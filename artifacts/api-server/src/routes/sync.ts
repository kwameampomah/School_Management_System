import { Router, type IRouter } from "express";
import { gte, eq, and, sql } from "drizzle-orm";
import {
  db,
  studentsTable,
  studentTermMetadataTable,
  scoresTable,
  attendanceTable,
  feePaymentsTable,
  classesTable,
  subjectsTable,
  assessmentComponentsTable,
  termsTable,
  gradingScaleTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// GET /api/sync/delta — Delta sync for System B (Offline PWA)
// If ?since=... is passed, returns entities updated since that timestamp.
// If ?since is omitted, returns a full snapshot for initial PWA seeding.
router.get("/sync/delta", requireAuth, async (req, res): Promise<void> => {
  const sinceParam = req.query.since as string | undefined;
  const sinceDate = sinceParam ? new Date(sinceParam) : null;
  const isValidSince = sinceDate && !isNaN(sinceDate.getTime());

  try {
    const currentSyncTime = new Date().toISOString();

    const students = isValidSince
      ? await db.select().from(studentsTable).where(gte(studentsTable.updatedAt, sinceDate!))
      : await db.select().from(studentsTable).where(sql`${studentsTable.deletedAt} IS NULL`);

    const metadata = isValidSince
      ? await db.select().from(studentTermMetadataTable).where(gte(studentTermMetadataTable.updatedAt, sinceDate!))
      : await db.select().from(studentTermMetadataTable).where(sql`${studentTermMetadataTable.deletedAt} IS NULL`);

    const scores = isValidSince
      ? await db.select().from(scoresTable).where(gte(scoresTable.updatedAt, sinceDate!))
      : await db.select().from(scoresTable).where(sql`${scoresTable.deletedAt} IS NULL`);

    const attendance = isValidSince
      ? await db.select().from(attendanceTable).where(gte(attendanceTable.createdAt, sinceDate!))
      : await db.select().from(attendanceTable);

    const feePayments = isValidSince
      ? await db.select().from(feePaymentsTable).where(gte(feePaymentsTable.createdAt, sinceDate!))
      : await db.select().from(feePaymentsTable);

    const classes = await db.select().from(classesTable);
    const subjects = await db.select().from(subjectsTable);
    const assessmentComponents = await db.select().from(assessmentComponentsTable);
    const terms = await db.select().from(termsTable);
    const gradingScales = await db.select().from(gradingScaleTable);

    res.json({
      serverTime: currentSyncTime,
      students,
      studentTermMetadata: metadata,
      scores,
      attendance,
      feePayments,
      classes,
      subjects,
      assessmentComponents,
      terms,
      gradingScales,
    });
  } catch (error: any) {
    console.error("Delta sync failed:", error);
    res.status(500).json({ error: "Failed to process delta sync" });
  }
});

export default router;
