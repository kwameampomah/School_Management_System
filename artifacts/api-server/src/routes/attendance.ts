import { Router, type IRouter } from "express";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db, attendanceTable, studentsTable, classesTable, teacherAssignmentsTable, parentsTable } from "@workspace/db";
import { requireAuth, requireTeacher } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { z } from "zod";

const router: IRouter = Router();

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

async function teacherCanManageClass(role: string, teacherId: number | null, classId: number): Promise<boolean> {
  if (role === "admin") return true;
  if (!teacherId) return false;
  const allowed = await getTeacherClassIds(teacherId!);
  return allowed.includes(classId);
}

async function teacherCanManageStudent(role: string, teacherId: number | null, studentId: number): Promise<boolean> {
  if (role === "admin") return true;
  if (!teacherId) return false;
  const [student] = await db.select({ classId: studentsTable.classId }).from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student || !student.classId) return false;
  return teacherCanManageClass(role, teacherId, student.classId);
}

const BulkAttendanceSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (d) => {
        const dateObj = new Date(d);
        const today = new Date();
        const minDate = new Date("2000-01-01");
        return dateObj <= today && dateObj >= minDate;
      },
      "Attendance date cannot be in the future or before 2000"
    ),
  termId: z.number().int().positive(),
  classId: z.number().int().positive(),
  records: z
    .array(
      z.object({
        studentId: z.number().int().positive(),
        status: z.enum(["present", "absent", "late", "excused"]),
        notes: z.string().max(500).optional().nullable(),
      })
    )
    .min(1, "At least one attendance record is required"),
});

// 1. Bulk Upsert Daily Attendance (teachers and admins only)
router.post("/attendance/bulk", requireTeacher, validate(BulkAttendanceSchema), async (req, res): Promise<void> => {
  const { date, termId, classId, records } = req.body;
  const userId = req.session.userId ?? null;

  const canManage = await teacherCanManageClass(req.session.role!, req.session.teacherId ?? null, classId);
  if (!canManage) {
    res.status(403).json({ error: "You are not authorized to manage attendance for this class" });
    return;
  }

  // Sort records deterministically by studentId to prevent deadlocks / race conditions
  const sortedRecords = [...records].sort((a, b) => a.studentId - b.studentId);

  try {
    // Single transaction: all records saved or none
    await db.transaction(async (tx) => {
      for (const record of sortedRecords) {
        await tx
          .insert(attendanceTable)
          .values({
            studentId: record.studentId,
            termId,
            classId,
            attendanceDate: date,
            status: record.status,
            notes: record.notes ?? null,
            recordedBy: userId,
          })
          .onConflictDoUpdate({
            target: [attendanceTable.studentId, attendanceTable.classId, attendanceTable.attendanceDate],
            set: {
              status: record.status,
              notes: record.notes ?? null,
              recordedBy: userId,
            },
          });
      }
    });

    res.json({
      success: true,
      message: `Successfully recorded attendance for ${records.length} students.`,
    });
  } catch (error) {
    console.error("Bulk attendance recording failed:", error);
    res.status(500).json({ error: "Failed to record bulk attendance" });
  }
});

// 2. GET Student Attendance Summary for Term (authenticated users with ownership/teacher scope)
router.get("/attendance/summary/:studentId/:termId", requireAuth, async (req, res): Promise<void> => {
  const studentId = parseInt(
    Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId,
    10
  );
  const termId = parseInt(
    Array.isArray(req.params.termId) ? req.params.termId[0] : req.params.termId,
    10
  );

  if (isNaN(studentId) || studentId <= 0 || isNaN(termId) || termId <= 0) {
    res.status(400).json({ error: "Invalid studentId or termId parameter" });
    return;
  }

  if (req.session.role === "teacher") {
    const allowed = await teacherCanManageStudent(req.session.role, req.session.teacherId ?? null, studentId);
    if (!allowed) {
      res.status(403).json({ error: "You are not authorized to view this student's attendance summary" });
      return;
    }
  } else if (req.session.role === "parent") {
    const [parentLink] = await db
      .select()
      .from(parentsTable)
      .where(and(eq(parentsTable.userId, req.session.userId!), eq(parentsTable.studentId, studentId)));

    const [guardianStudent] = await db
      .select()
      .from(studentsTable)
      .where(and(eq(studentsTable.id, studentId), eq(studentsTable.guardianUserId, req.session.userId!)));

    if (!parentLink && !guardianStudent) {
      res.status(403).json({ error: "You are not authorized to view this student's attendance summary" });
      return;
    }
  }

  try {
    const rows = await db
      .select({
        status: attendanceTable.status,
        count: sql<number>`count(*)`,
      })
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.studentId, studentId),
          eq(attendanceTable.termId, termId)
        )
      )
      .groupBy(attendanceTable.status);

    const summary = { present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 100 };

    rows.forEach((r) => {
      const cnt = Number(r.count);
      if (r.status === "present") summary.present = cnt;
      else if (r.status === "absent") summary.absent = cnt;
      else if (r.status === "late") summary.late = cnt;
      else if (r.status === "excused") summary.excused = cnt;
    });

    summary.total = summary.present + summary.absent + summary.late + summary.excused;

    // Late students physically attended: count them in the attendance percentage
    if (summary.total > 0) {
      const effectivePresent = summary.present + summary.late;
      summary.percentage = Math.round((effectivePresent / summary.total) * 100);
    }

    res.json(summary);
  } catch (error) {
    console.error("Failed to fetch student attendance summary:", error);
    res.status(500).json({ error: "Failed to fetch student attendance summary" });
  }
});

// 3. GET Class Attendance Report for Term (teachers and admins only)
router.get("/attendance/report/:classId/:termId", requireTeacher, async (req, res): Promise<void> => {
  const classId = parseInt(
    Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId,
    10
  );
  const termId = parseInt(
    Array.isArray(req.params.termId) ? req.params.termId[0] : req.params.termId,
    10
  );

  if (isNaN(classId) || classId <= 0 || isNaN(termId) || termId <= 0) {
    res.status(400).json({ error: "Invalid classId or termId parameter" });
    return;
  }

  const canManage = await teacherCanManageClass(req.session.role!, req.session.teacherId ?? null, classId);
  if (!canManage) {
    res.status(403).json({ error: "You are not authorized to view attendance report for this class" });
    return;
  }

  try {
    const classStudents = await db
      .select({
        id: studentsTable.id,
        fullName: studentsTable.fullName,
        studentIdNumber: studentsTable.studentIdNumber,
      })
      .from(studentsTable)
      .where(eq(studentsTable.classId, classId))
      .orderBy(studentsTable.fullName);

    // Aggregate attendance counts using SQL GROUP BY to avoid loading all rows into memory
    const aggregates = await db
      .select({
        studentId: attendanceTable.studentId,
        status: attendanceTable.status,
        count: sql<number>`count(*)`,
      })
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.classId, classId),
          eq(attendanceTable.termId, termId)
        )
      )
      .groupBy(attendanceTable.studentId, attendanceTable.status);

    const report = classStudents.map((student) => {
      const studentAgg = aggregates.filter((a) => a.studentId === student.id);
      const present = Number(studentAgg.find((a) => a.status === "present")?.count ?? 0);
      const absent = Number(studentAgg.find((a) => a.status === "absent")?.count ?? 0);
      const late = Number(studentAgg.find((a) => a.status === "late")?.count ?? 0);
      const excused = Number(studentAgg.find((a) => a.status === "excused")?.count ?? 0);
      const total = present + absent + late + excused;
      // Late counts as present for attendance percentage
      const effectivePresent = present + late;
      const percentage = total > 0 ? Math.round((effectivePresent / total) * 100) : 100;

      return { studentId: student.id, fullName: student.fullName, studentIdNumber: student.studentIdNumber, present, absent, late, excused, total, percentage };
    });

    res.json(report);
  } catch (error) {
    console.error("Failed to fetch class attendance report:", error);
    res.status(500).json({ error: "Failed to fetch class attendance report" });
  }
});

// 4. PATCH single attendance record (correct a mistake)
router.patch("/attendance/:id", requireTeacher, async (req, res): Promise<void> => {
  const id = parseInt(
    Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    10
  );

  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid attendance record id" });
    return;
  }

  const [existingRecord] = await db.select().from(attendanceTable).where(eq(attendanceTable.id, id));
  if (!existingRecord) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  const canManage = await teacherCanManageClass(req.session.role!, req.session.teacherId ?? null, existingRecord.classId);
  if (!canManage) {
    res.status(403).json({ error: "You are not authorized to modify attendance for this class" });
    return;
  }

  const PatchSchema = z.object({
    status: z.enum(["present", "absent", "late", "excused"]).optional(),
    notes: z.string().max(500).nullable().optional(),
  });

  const result = PatchSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed", details: result.error.errors });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (result.data.status !== undefined) updates.status = result.data.status;
  if (result.data.notes !== undefined) updates.notes = result.data.notes;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update provided" });
    return;
  }

  try {
    const [updated] = await db
      .update(attendanceTable)
      .set(updates)
      .where(eq(attendanceTable.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Failed to update attendance record:", error);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});

export default router;
