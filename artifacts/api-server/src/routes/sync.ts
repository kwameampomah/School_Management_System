import { Router, type IRouter } from "express";
import { gte, eq, and, inArray, sql } from "drizzle-orm";
import {
  db,
  studentsTable,
  studentTermMetadataTable,
  scoresTable,
  attendanceTable,
  feePaymentsTable,
  studentFeesTable,
  classesTable,
  subjectsTable,
  assessmentComponentsTable,
  termsTable,
  gradingScaleTable,
  teacherAssignmentsTable,
  parentsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Helper to get allowed class IDs for a teacher account
async function getTeacherClassIds(teacherId: number): Promise<number[]> {
  const classTeacherClasses = await db
    .select({ id: classesTable.id })
    .from(classesTable)
    .where(eq(classesTable.classTeacherId, teacherId));

  const subjectTeacherAssignments = await db
    .select({ classId: classesTable.id })
    .from(teacherAssignmentsTable)
    .innerJoin(classesTable, eq(teacherAssignmentsTable.classSubjectId, classesTable.id));

  return Array.from(
    new Set([
      ...classTeacherClasses.map((c) => c.id),
      ...subjectTeacherAssignments.map((a) => a.classId),
    ])
  );
}

// GET /api/sync/delta — Delta sync for System B (Offline PWA)
// Role-scoped:
// - Admin: gets all data.
// - Teacher: gets data for students/classes they teach/manage.
// - Parent: gets data for their own children only.
router.get("/sync/delta", requireAuth, async (req, res): Promise<void> => {
  const sinceParam = req.query.since as string | undefined;
  const sinceDate = sinceParam ? new Date(sinceParam) : null;
  const isValidSince = sinceDate && !isNaN(sinceDate.getTime());
  const role = req.session.role;
  const userId = req.session.userId;
  const teacherId = req.session.teacherId;

  try {
    const currentSyncTime = new Date().toISOString();

    let allowedStudentIds: number[] | null = null;
    let allowedClassIds: number[] | null = null;

    if (role === "teacher") {
      if (!teacherId) {
        res.status(403).json({ error: "No teacher profile found" });
        return;
      }
      allowedClassIds = await getTeacherClassIds(teacherId);
      if (allowedClassIds.length === 0) {
        res.json({
          serverTime: currentSyncTime,
          students: [],
          studentTermMetadata: [],
          scores: [],
          attendance: [],
          feePayments: [],
          classes: [],
          subjects: await db.select().from(subjectsTable),
          assessmentComponents: [],
          terms: await db.select().from(termsTable),
          gradingScales: await db.select().from(gradingScaleTable),
        });
        return;
      }

      const classStudents = await db
        .select({ id: studentsTable.id })
        .from(studentsTable)
        .where(inArray(studentsTable.classId, allowedClassIds));
      allowedStudentIds = classStudents.map((s) => s.id);
    } else if (role === "parent") {
      if (!userId) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      const parentLinks = await db
        .select({ studentId: parentsTable.studentId })
        .from(parentsTable)
        .where(eq(parentsTable.userId, userId));

      const guardianStudents = await db
        .select({ id: studentsTable.id })
        .from(studentsTable)
        .where(eq(studentsTable.guardianUserId, userId));

      allowedStudentIds = Array.from(
        new Set([
          ...parentLinks.map((p) => p.studentId),
          ...guardianStudents.map((s) => s.id),
        ])
      );

      if (allowedStudentIds.length === 0) {
        res.json({
          serverTime: currentSyncTime,
          students: [],
          studentTermMetadata: [],
          scores: [],
          attendance: [],
          feePayments: [],
          classes: [],
          subjects: await db.select().from(subjectsTable),
          assessmentComponents: [],
          terms: await db.select().from(termsTable),
          gradingScales: await db.select().from(gradingScaleTable),
        });
        return;
      }
    }

    // Build conditions
    const studentConds = [];
    if (allowedStudentIds !== null) {
      if (allowedStudentIds.length === 0) studentConds.push(sql`1=0`);
      else studentConds.push(inArray(studentsTable.id, allowedStudentIds));
    }
    if (isValidSince) studentConds.push(gte(studentsTable.updatedAt, sinceDate!));
    else studentConds.push(sql`${studentsTable.deletedAt} IS NULL`);

    const students = await db
      .select()
      .from(studentsTable)
      .where(studentConds.length > 0 ? and(...studentConds) : undefined);

    // Filter metadata
    const metadataConds = [];
    if (allowedStudentIds !== null) {
      if (allowedStudentIds.length === 0) metadataConds.push(sql`1=0`);
      else metadataConds.push(inArray(studentTermMetadataTable.studentId, allowedStudentIds));
    }
    if (isValidSince) metadataConds.push(gte(studentTermMetadataTable.updatedAt, sinceDate!));
    else metadataConds.push(sql`${studentTermMetadataTable.deletedAt} IS NULL`);

    const metadata = await db
      .select()
      .from(studentTermMetadataTable)
      .where(metadataConds.length > 0 ? and(...metadataConds) : undefined);

    // Filter scores
    const scoreConds = [];
    if (allowedStudentIds !== null) {
      if (allowedStudentIds.length === 0) scoreConds.push(sql`1=0`);
      else scoreConds.push(inArray(scoresTable.studentId, allowedStudentIds));
    }
    if (isValidSince) scoreConds.push(gte(scoresTable.updatedAt, sinceDate!));
    else scoreConds.push(sql`${scoresTable.deletedAt} IS NULL`);

    const scores = await db
      .select()
      .from(scoresTable)
      .where(scoreConds.length > 0 ? and(...scoreConds) : undefined);

    // Filter attendance
    const attendanceConds = [];
    if (allowedStudentIds !== null) {
      if (allowedStudentIds.length === 0) attendanceConds.push(sql`1=0`);
      else attendanceConds.push(inArray(attendanceTable.studentId, allowedStudentIds));
    }
    if (isValidSince) attendanceConds.push(gte(attendanceTable.createdAt, sinceDate!));

    const attendance = await db
      .select()
      .from(attendanceTable)
      .where(attendanceConds.length > 0 ? and(...attendanceConds) : undefined);

    // Filter feePayments via studentFeesTable join
    let feePayments: any[] = [];
    if (allowedStudentIds !== null) {
      if (allowedStudentIds.length === 0) {
        feePayments = [];
      } else {
        const studentFeeRows = await db
          .select({ id: studentFeesTable.id })
          .from(studentFeesTable)
          .where(inArray(studentFeesTable.studentId, allowedStudentIds));
        const feeIds = studentFeeRows.map((f) => f.id);

        if (feeIds.length === 0) {
          feePayments = [];
        } else {
          const feeConds = [inArray(feePaymentsTable.studentFeeId, feeIds)];
          if (isValidSince) feeConds.push(gte(feePaymentsTable.createdAt, sinceDate!));

          feePayments = await db
            .select()
            .from(feePaymentsTable)
            .where(and(...feeConds));
        }
      }
    } else {
      feePayments = isValidSince
        ? await db.select().from(feePaymentsTable).where(gte(feePaymentsTable.createdAt, sinceDate!))
        : await db.select().from(feePaymentsTable);
    }

    // Shared reference tables
    const classes = allowedClassIds
      ? await db.select().from(classesTable).where(inArray(classesTable.id, allowedClassIds))
      : await db.select().from(classesTable);
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
