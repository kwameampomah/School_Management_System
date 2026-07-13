import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable, teachersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const role = req.query.role as string | undefined;
  const rows = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(role ? eq(usersTable.role, role as "admin" | "teacher" | "parent") : undefined)
    .orderBy(usersTable.fullName);
  res.json(rows);
});

router.post("/users", requireAdmin, async (req, res): Promise<void> => {
  const { fullName, email, password, role, staffId, phone } = req.body;
  if (!fullName || !email || !password || !role) {
    res.status(400).json({ error: "fullName, email, password, and role are required" });
    return;
  }
  if (typeof password === "string" && password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ fullName, email, passwordHash, role })
    .returning();

  if (role === "teacher") {
    await db.insert(teachersTable).values({ userId: user.id, staffId, phone });
  }

  res.status(201).json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.get("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.patch("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { fullName, email, password, role } = req.body;
  const updates: Record<string, unknown> = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (email !== undefined) updates.email = email;
  if (password) {
    if (typeof password === "string" && password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters long" });
      return;
    }
    updates.passwordHash = await bcrypt.hash(password, 10);
  }
  if (role !== undefined) updates.role = role;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
