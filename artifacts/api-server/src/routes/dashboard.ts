import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  teachersTable,
  classesTable,
  subjectsTable,
  studentsTable,
  termsTable,
  academicYearsTable,
  reportCardStatusTable,
  teacherAssignmentsTable,
  classSubjectsTable,
  assessmentComponentsTable,
  scoresTable,
} from "@workspace/db";
import { requireAuth, requireAdmin, requireTeacher } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/admin-summary", requireAdmin, async (_req, res): Promise<void> => {
  const [{ totalStudents }] = await db
    .select({ totalStudents: count() })
    .from(studentsTable);

  const [{ totalTeachers }] = await db
    .select({ totalTeachers: count() })
    .from(teachersTable);

  const [{ totalClasses }] = await db
    .select({ totalClasses: count() })
    .from(classesTable);

  const [{ totalSubjects }] = await db
    .select({ totalSubjects: count() })
    .from(subjectsTable);

  const [currentTerm] = await db
    .select({
      name: termsTable.name,
      yearLabel: academicYearsTable.yearLabel,
    })
    .from(termsTable)
    .leftJoin(academicYearsTable, eq(termsTable.academicYearId, academicYearsTable.id))
    .where(eq(termsTable.isCurrent, true));

  // Report card status counts
  const statusRows = await db
    .select({ status: reportCardStatusTable.status, cnt: count() })
    .from(reportCardStatusTable)
    .groupBy(reportCardStatusTable.status);

  const statusCounts = { draft: 0, submitted: 0, approved: 0, published: 0 };
  for (const row of statusRows) {
    if (row.status in statusCounts) {
      statusCounts[row.status as keyof typeof statusCounts] = row.cnt;
    }
  }

  res.json({
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    currentTerm: currentTerm?.name ?? null,
    currentAcademicYear: currentTerm?.yearLabel ?? null,
    reportCardStatusCounts: statusCounts,
  });
});

router.get("/dashboard/teacher-summary", requireTeacher, async (req, res): Promise<void> => {
  const teacherId = req.session.teacherId;
  if (!teacherId) {
    res.status(400).json({ error: "No teacher profile found" });
    return;
  }

  const [teacher] = await db
    .select({ fullName: usersTable.fullName })
    .from(teachersTable)
    .leftJoin(usersTable, eq(teachersTable.userId, usersTable.id))
    .where(eq(teachersTable.id, teacherId));

  // Get current term assignments
  const [currentTerm] = await db
    .select()
    .from(termsTable)
    .where(eq(termsTable.isCurrent, true));

  const termId = currentTerm?.id;

  const assignments = await db
    .select({
      id: teacherAssignmentsTable.id,
      classSubjectId: teacherAssignmentsTable.classSubjectId,
      classId: classesTable.id,
      className: classesTable.name,
      subjectName: subjectsTable.name,
    })
    .from(teacherAssignmentsTable)
    .leftJoin(classSubjectsTable, eq(teacherAssignmentsTable.classSubjectId, classSubjectsTable.id))
    .leftJoin(classesTable, eq(classSubjectsTable.classId, classesTable.id))
    .leftJoin(subjectsTable, eq(classSubjectsTable.subjectId, subjectsTable.id))
    .where(
      and(
        eq(teacherAssignmentsTable.teacherId, teacherId),
        termId ? eq(teacherAssignmentsTable.termId, termId) : sql`true`,
      ),
    );

  const assignedClasses = [];
  let totalStudentsInCharge = 0;
  let pendingScoreEntries = 0;

  for (const assignment of assignments) {
    const classId = assignment.classId;
    if (!classId) continue;

    const [{ studentCount }] = await db
      .select({ studentCount: count() })
      .from(studentsTable)
      .where(eq(studentsTable.classId, classId));

    // How many assessment components exist for this classSubject+term
    const components = await db
      .select({ id: assessmentComponentsTable.id })
      .from(assessmentComponentsTable)
      .where(
        and(
          eq(assessmentComponentsTable.classSubjectId, assignment.classSubjectId),
          termId ? eq(assessmentComponentsTable.termId, termId) : sql`true`,
        ),
      );

    const totalScoresExpected = studentCount * components.length;

    // Count actual scores entered
    let scoresEntered = 0;
    if (components.length > 0) {
      const componentIds = components.map(c => c.id);
      const [{ cnt }] = await db
        .select({ cnt: count() })
        .from(scoresTable)
        .where(
          sql`${scoresTable.assessmentComponentId} = ANY(ARRAY[${sql.join(componentIds.map(id => sql`${id}`), sql`, `)}]::int[])`,
        );
      scoresEntered = cnt;
    }

    const pending = totalScoresExpected - scoresEntered;
    pendingScoreEntries += Math.max(0, pending);
    totalStudentsInCharge += studentCount;

    assignedClasses.push({
      classId,
      className: assignment.className ?? "",
      subjectName: assignment.subjectName ?? "",
      studentCount,
      scoresEntered,
      totalScoresExpected,
    });
  }

  const ledClasses = await db
    .select({
      classId: classesTable.id,
      className: classesTable.name,
    })
    .from(classesTable)
    .where(eq(classesTable.classTeacherId, teacherId));

  res.json({
    teacherName: teacher?.fullName ?? "",
    assignedClasses,
    totalStudentsInCharge,
    pendingScoreEntries,
    ledClasses,
  });
});

router.get("/dashboard/score-completion", requireAdmin, async (req, res): Promise<void> => {
  const termId = req.query.termId ? parseInt(req.query.termId as string, 10) : null;
  if (!termId) {
    res.status(400).json({ error: "termId is required" });
    return;
  }

  const classSubjects = await db
    .select({
      classSubjectId: classSubjectsTable.id,
      classId: classesTable.id,
      className: classesTable.name,
      subjectId: subjectsTable.id,
      subjectName: subjectsTable.name,
    })
    .from(classSubjectsTable)
    .leftJoin(classesTable, eq(classSubjectsTable.classId, classesTable.id))
    .leftJoin(subjectsTable, eq(classSubjectsTable.subjectId, subjectsTable.id))
    .orderBy(classesTable.name, subjectsTable.name);

  const result = [];
  for (const cs of classSubjects) {
    const [{ studentCount }] = await db
      .select({ studentCount: count() })
      .from(studentsTable)
      .where(eq(studentsTable.classId, cs.classId!));

    const components = await db
      .select({ id: assessmentComponentsTable.id })
      .from(assessmentComponentsTable)
      .where(
        and(
          eq(assessmentComponentsTable.classSubjectId, cs.classSubjectId),
          eq(assessmentComponentsTable.termId, termId),
        ),
      );

    const totalExpected = studentCount * components.length;
    let totalEntered = 0;

    if (components.length > 0) {
      const componentIds = components.map(c => c.id);
      const [{ cnt }] = await db
        .select({ cnt: count() })
        .from(scoresTable)
        .where(
          sql`${scoresTable.assessmentComponentId} = ANY(ARRAY[${sql.join(componentIds.map(id => sql`${id}`), sql`, `)}]::int[])`,
        );
      totalEntered = cnt;
    }

    result.push({
      classId: cs.classId,
      className: cs.className,
      subjectId: cs.subjectId,
      subjectName: cs.subjectName,
      totalExpected,
      totalEntered,
      percentComplete: totalExpected > 0 ? Math.round((totalEntered / totalExpected) * 100) : 0,
    });
  }

  res.json(result);
});

export default router;
