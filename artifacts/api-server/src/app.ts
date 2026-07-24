import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./swagger";

const PgSession = connectPgSimple(session);

const app: Express = express();

app.set("trust proxy", 1); // Trust proxy to allow secure cookies over HTTPS behind Vite proxy

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins: (string | RegExp)[] =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean)
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,  // LAN access in dev
      ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some((allowed) =>
      typeof allowed === "string" ? allowed === origin : allowed.test(origin)
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { rateLimit } from "express-rate-limit";

// Rate limiting: general API limiter (100 requests per minute per IP)
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please wait a moment before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for heavy bulk endpoints (20 requests per minute)
const bulkRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many bulk mutation requests. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on every request (activity-based timeout)
    cookie: {
      maxAge: 2 * 60 * 60 * 1000, // 2 hours of inactivity → auto logout
      httpOnly: true,              // Not accessible from JavaScript (XSS protection)
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    },
  }),
);

app.use("/api/attendance/bulk", bulkRateLimiter);
app.use("/api/scores/bulk", bulkRateLimiter);
app.use("/api/students/bulk", bulkRateLimiter);
app.use("/api", apiRateLimiter, router);

// API Documentation Endpoint
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve static frontend assets in production mode
if (process.env.NODE_ENV === "production") {
  const publicPath = path.join(process.cwd(), "artifacts/school-report/dist/public");
  const fallbackPath = path.join(process.cwd(), "../school-report/dist/public");
  
  const finalPath = fs.existsSync(publicPath) ? publicPath : fallbackPath;
  
  app.use(express.static(finalPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(finalPath, "index.html"));
  });
}

// Standardized JSON error handler
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  // Type guard — only access known properties of Error objects
  if (err instanceof Error) {
    const status = (err as any).status || (err as any).statusCode || 500;
    req.log?.error({ err }, err.message);
    const errorMessage = process.env.NODE_ENV === "production" ? "Internal Server Error" : (err.message || "An unexpected error occurred");
    res.status(status).json({ error: errorMessage });
  } else {
    req.log?.error({ err }, "Unknown error thrown");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default app;
