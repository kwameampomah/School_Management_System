import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import {
  db,
  reportCardStatusTable,
  classesTable,
  termsTable,
  studentsTable,
  scoresTable,
  assessmentComponentsTable,
  classSubjectsTable,
  subjectsTable,
  gradingScaleTable,
  academicYearsTable,
  teacherAssignmentsTable,
  studentTermMetadataTable,
} from "@workspace/db";
import { requireAuth, requireAdmin, requireTeacher } from "../middlewares/auth";

const router: IRouter = Router();

// Helper: compute subject total for one student, one classSubject, one term
async function computeSubjectTotal(
  studentId: number,
  classSubjectId: number,
  termId: number,
): Promise<{ total: number; componentScores: Array<{ componentId: number; componentName: string; scoreValue: number; maxScore: number; weightPercent: number; weightedScore: number }> }> {
  const components = await db
    .select()
    .from(assessmentComponentsTable)
    .where(
      and(
        eq(assessmentComponentsTable.classSubjectId, classSubjectId),
        eq(assessmentComponentsTable.termId, termId),
      ),
    );

  const componentScores = [];
  let total = 0;

  for (const comp of components) {
    const [score] = await db
      .select()
      .from(scoresTable)
      .where(
        and(
          eq(scoresTable.studentId, studentId),
          eq(scoresTable.assessmentComponentId, comp.id),
        ),
      );

    const scoreValue = score ? parseFloat(score.scoreValue as unknown as string) : 0;
    const maxScore = parseFloat(comp.maxScore as unknown as string);
    const weightPercent = parseFloat(comp.weightPercent as unknown as string);
    const weightedScore = maxScore > 0 ? (scoreValue / maxScore) * weightPercent : 0;
    total += weightedScore;

    componentScores.push({
      componentId: comp.id,
      componentName: comp.name,
      scoreValue,
      maxScore,
      weightPercent,
      weightedScore: Math.round(weightedScore * 100) / 100,
    });
  }

  return { total: Math.round(total * 100) / 100, componentScores };
}

// Helper: lookup grade from grading scale
async function lookupGrade(total: number): Promise<{ grade: string; remark: string }> {
  const scales = await db.select().from(gradingScaleTable);
  for (const scale of scales) {
    const min = parseFloat(scale.minScore as unknown as string);
    const max = parseFloat(scale.maxScore as unknown as string);
    if (total >= min && total <= max) {
      return { grade: scale.gradeLabel, remark: scale.remark };
    }
  }
  return { grade: "N/A", remark: "No grade" };
}

async function userCanManageStatus(
  role: string,
  teacherId: number | null,
  classId: number,
): Promise<boolean> {
  if (role === "admin") return true;
  if (!teacherId) return false;

  const [cls] = await db
    .select({ classTeacherId: classesTable.classTeacherId })
    .from(classesTable)
    .where(eq(classesTable.id, classId));

  return cls?.classTeacherId === teacherId;
}

// GET /report-card-status
router.get("/report-card-status", requireAuth, async (req, res): Promise<void> => {
  const termId = req.query.termId ? parseInt(req.query.termId as string, 10) : null;
  const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : null;

  const conditions = [];
  if (termId) conditions.push(eq(reportCardStatusTable.termId, termId));
  if (classId) conditions.push(eq(reportCardStatusTable.classId, classId));

  const rows = await db
    .select({
      id: reportCardStatusTable.id,
      classId: reportCardStatusTable.classId,
      className: classesTable.name,
      termId: reportCardStatusTable.termId,
      termName: termsTable.name,
      status: reportCardStatusTable.status,
      approvedBy: reportCardStatusTable.approvedBy,
      approvedAt: reportCardStatusTable.approvedAt,
    })
    .from(reportCardStatusTable)
    .leftJoin(classesTable, eq(reportCardStatusTable.classId, classesTable.id))
    .leftJoin(termsTable, eq(reportCardStatusTable.termId, termsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(classesTable.name);

  res.json(rows);
});

router.patch("/report-card-status/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  const [rcsRow] = await db
    .select({ classId: reportCardStatusTable.classId })
    .from(reportCardStatusTable)
    .where(eq(reportCardStatusTable.id, id));

  if (!rcsRow) {
    res.status(404).json({ error: "Report card status not found" });
    return;
  }

  const allowed = await userCanManageStatus(
    req.session.role!,
    req.session.teacherId ?? null,
    rcsRow.classId,
  );
  if (!allowed) {
    res.status(403).json({ error: "You are not authorized to update status for this class" });
    return;
  }

  const updates: Record<string, unknown> = { status };
  if (status === "approved") {
    updates.approvedBy = req.session.userId;
    updates.approvedAt = new Date();
  }

  const [rcs] = await db
    .update(reportCardStatusTable)
    .set(updates)
    .where(eq(reportCardStatusTable.id, id))
    .returning();
  if (!rcs) {
    res.status(404).json({ error: "Report card status not found" });
    return;
  }

  const [row] = await db
    .select({
      id: reportCardStatusTable.id,
      classId: reportCardStatusTable.classId,
      className: classesTable.name,
      termId: reportCardStatusTable.termId,
      termName: termsTable.name,
      status: reportCardStatusTable.status,
      approvedBy: reportCardStatusTable.approvedBy,
      approvedAt: reportCardStatusTable.approvedAt,
    })
    .from(reportCardStatusTable)
    .leftJoin(classesTable, eq(reportCardStatusTable.classId, classesTable.id))
    .leftJoin(termsTable, eq(reportCardStatusTable.termId, termsTable.id))
    .where(eq(reportCardStatusTable.id, id));

  res.json(row);
});

// POST /report-card-status/class/:classId/term/:termId
router.post(
  "/report-card-status/class/:classId/term/:termId",
  requireAuth,
  async (req, res): Promise<void> => {
    const classId = parseInt(
      Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId,
      10,
    );
    const termId = parseInt(
      Array.isArray(req.params.termId) ? req.params.termId[0] : req.params.termId,
      10,
    );

    const allowed = await userCanManageStatus(
      req.session.role!,
      req.session.teacherId ?? null,
      classId,
    );
    if (!allowed) {
      res.status(403).json({ error: "You are not authorized to initialize status for this class" });
      return;
    }

    const [existing] = await db
      .select()
      .from(reportCardStatusTable)
      .where(
        and(eq(reportCardStatusTable.classId, classId), eq(reportCardStatusTable.termId, termId)),
      );

    if (existing) {
      res.status(400).json({ error: "Report card status already exists for this class+term" });
      return;
    }

    const [rcs] = await db
      .insert(reportCardStatusTable)
      .values({ classId, termId, status: "draft" })
      .returning();

    const [row] = await db
      .select({
        id: reportCardStatusTable.id,
        classId: reportCardStatusTable.classId,
        className: classesTable.name,
        termId: reportCardStatusTable.termId,
        termName: termsTable.name,
        status: reportCardStatusTable.status,
        approvedBy: reportCardStatusTable.approvedBy,
        approvedAt: reportCardStatusTable.approvedAt,
      })
      .from(reportCardStatusTable)
      .leftJoin(classesTable, eq(reportCardStatusTable.classId, classesTable.id))
      .leftJoin(termsTable, eq(reportCardStatusTable.termId, termsTable.id))
      .where(eq(reportCardStatusTable.id, rcs.id));

    res.status(201).json(row);
  },
);

// GET /report-cards/:studentId/:termId
router.get("/report-cards/:studentId/:termId", requireAuth, async (req, res): Promise<void> => {
  const studentId = parseInt(
    Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId,
    10,
  );
  const termId = parseInt(
    Array.isArray(req.params.termId) ? req.params.termId[0] : req.params.termId,
    10,
  );

  const [student] = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      studentIdNumber: studentsTable.studentIdNumber,
      classId: studentsTable.classId,
      className: classesTable.name,
    })
    .from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(eq(studentsTable.id, studentId));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [term] = await db
    .select({ name: termsTable.name, academicYearLabel: academicYearsTable.yearLabel })
    .from(termsTable)
    .leftJoin(academicYearsTable, eq(termsTable.academicYearId, academicYearsTable.id))
    .where(eq(termsTable.id, termId));

  // Get all class subjects for this student's class
  const classSubjects = await db
    .select({
      id: classSubjectsTable.id,
      subjectId: subjectsTable.id,
      subjectName: subjectsTable.name,
      subjectCode: subjectsTable.code,
    })
    .from(classSubjectsTable)
    .leftJoin(subjectsTable, eq(classSubjectsTable.subjectId, subjectsTable.id))
    .where(eq(classSubjectsTable.classId, student.classId!));

  // Get all students in this class for ranking
  const classStudents = await db
    .select({ id: studentsTable.id })
    .from(studentsTable)
    .where(eq(studentsTable.classId, student.classId!));

  // Compute totals for all students for ranking
  const studentTotals: Record<number, number> = {};
  for (const cs of classStudents) {
    let totalAvg = 0;
    for (const subj of classSubjects) {
      const { total } = await computeSubjectTotal(cs.id, subj.id, termId);
      totalAvg += total;
    }
    studentTotals[cs.id] = classSubjects.length > 0 ? totalAvg / classSubjects.length : 0;
  }

  // Overall position
  const sortedStudents = Object.entries(studentTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => parseInt(id, 10));
  const overallPosition = sortedStudents.indexOf(studentId) + 1;
  const overallAverage = Math.round((studentTotals[studentId] ?? 0) * 100) / 100;

  // Subject results with class stats and per-subject rankings
  const subjectResults = [];
  for (const subj of classSubjects) {
    const { total, componentScores } = await computeSubjectTotal(studentId, subj.id, termId);
    const { grade, remark } = await lookupGrade(total);

    // Class stats for this subject
    const subjectTotals: number[] = [];
    for (const cs of classStudents) {
      const { total: t } = await computeSubjectTotal(cs.id, subj.id, termId);
      subjectTotals.push(t);
    }
    const sortedSubjectTotals = [...subjectTotals].sort((a, b) => b - a);
    const subjectRank = sortedSubjectTotals.indexOf(total) + 1;
    const classAverage = subjectTotals.length > 0
      ? Math.round((subjectTotals.reduce((a, b) => a + b, 0) / subjectTotals.length) * 100) / 100
      : 0;
    const classHighest = subjectTotals.length > 0 ? Math.max(...subjectTotals) : 0;
    const classLowest = subjectTotals.length > 0 ? Math.min(...subjectTotals) : 0;

    subjectResults.push({
      subjectId: subj.subjectId,
      subjectName: subj.subjectName,
      subjectCode: subj.subjectCode,
      total,
      grade,
      remark,
      subjectRank,
      classAverage,
      classHighest,
      classLowest,
      componentScores,
    });
  }

  // Report card publication status
  const [rcs] = await db
    .select({ status: reportCardStatusTable.status })
    .from(reportCardStatusTable)
    .where(
      and(
        eq(reportCardStatusTable.classId, student.classId!),
        eq(reportCardStatusTable.termId, termId),
      ),
    );

  // Fetch term metadata
  const [metadata] = await db
    .select()
    .from(studentTermMetadataTable)
    .where(
      and(
        eq(studentTermMetadataTable.studentId, studentId),
        eq(studentTermMetadataTable.termId, termId),
      ),
    );

  res.json({
    studentId,
    studentName: student.fullName,
    studentIdNumber: student.studentIdNumber,
    className: student.className,
    termName: term?.name ?? "",
    academicYear: term?.academicYearLabel ?? "",
    overallAverage,
    overallPosition,
    totalStudents: classStudents.length,
    subjectResults,
    reportCardStatus: rcs?.status ?? "draft",
    metadata: metadata ? {
      daysOpened: metadata.daysOpened,
      daysPresent: metadata.daysPresent,
      conduct: metadata.conduct,
      attitude: metadata.attitude,
      interest: metadata.interest,
      teacherRemarks: metadata.teacherRemarks,
      headmasterRemarks: metadata.headmasterRemarks,
    } : null,
  });
});

// GET /report-cards/class/:classId/term/:termId
router.get(
  "/report-cards/class/:classId/term/:termId",
  requireTeacher,
  async (req, res): Promise<void> => {
    const classId = parseInt(
      Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId,
      10,
    );
    const termId = parseInt(
      Array.isArray(req.params.termId) ? req.params.termId[0] : req.params.termId,
      10,
    );

    // Enforce that a teacher is assigned to at least one subject in this class+term
    if (req.session.role !== "admin") {
      const teacherId = req.session.teacherId ?? null;
      if (!teacherId) {
        res.status(403).json({ error: "No teacher profile associated with this account" });
        return;
      }

      const [ledClass] = await db
        .select({ id: classesTable.id })
        .from(classesTable)
        .where(and(eq(classesTable.id, classId), eq(classesTable.classTeacherId, teacherId)));

      const [assignment] = await db
        .select({ id: teacherAssignmentsTable.id })
        .from(teacherAssignmentsTable)
        .innerJoin(classSubjectsTable, eq(teacherAssignmentsTable.classSubjectId, classSubjectsTable.id))
        .where(
          and(
            eq(teacherAssignmentsTable.teacherId, teacherId),
            eq(classSubjectsTable.classId, classId),
            eq(teacherAssignmentsTable.termId, termId),
          ),
        );

      if (!ledClass && !assignment) {
        res.status(403).json({ error: "You are not authorized to access reports for this class" });
        return;
      }
    }

    const classStudents = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(eq(studentsTable.classId, classId));

    // Build each student's report card (simplified - reuse the logic inline)
    const reportCards = [];
    for (const s of classStudents) {
      // Make a sub-request conceptually by calling the same logic
      const [student] = await db
        .select({
          id: studentsTable.id,
          fullName: studentsTable.fullName,
          studentIdNumber: studentsTable.studentIdNumber,
          classId: studentsTable.classId,
          className: classesTable.name,
        })
        .from(studentsTable)
        .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
        .where(eq(studentsTable.id, s.id));

      const [term] = await db
        .select({ name: termsTable.name, academicYearLabel: academicYearsTable.yearLabel })
        .from(termsTable)
        .leftJoin(academicYearsTable, eq(termsTable.academicYearId, academicYearsTable.id))
        .where(eq(termsTable.id, termId));

      const classSubjects = await db
        .select({
          id: classSubjectsTable.id,
          subjectId: subjectsTable.id,
          subjectName: subjectsTable.name,
          subjectCode: subjectsTable.code,
        })
        .from(classSubjectsTable)
        .leftJoin(subjectsTable, eq(classSubjectsTable.subjectId, subjectsTable.id))
        .where(eq(classSubjectsTable.classId, classId));

      let subjectTotalsSum = 0;
      const subjectResults = [];
      for (const subj of classSubjects) {
        const { total, componentScores } = await computeSubjectTotal(s.id, subj.id, termId);
        const { grade, remark } = await lookupGrade(total);
        subjectTotalsSum += total;
        subjectResults.push({
          subjectId: subj.subjectId,
          subjectName: subj.subjectName,
          subjectCode: subj.subjectCode,
          total,
          grade,
          remark,
          subjectRank: 0, // computed after all students
          classAverage: 0,
          classHighest: 0,
          classLowest: 0,
          componentScores,
        });
      }

      reportCards.push({
        studentId: s.id,
        studentName: student?.fullName ?? "",
        studentIdNumber: student?.studentIdNumber ?? "",
        className: student?.className ?? "",
        termName: term?.name ?? "",
        academicYear: term?.academicYearLabel ?? "",
        overallAverage: classSubjects.length > 0
          ? Math.round((subjectTotalsSum / classSubjects.length) * 100) / 100
          : 0,
        overallPosition: 0, // computed after
        totalStudents: classStudents.length,
        subjectResults,
        reportCardStatus: "draft" as const,
      });
    }

    // Compute overall positions
    const sorted = [...reportCards].sort((a, b) => b.overallAverage - a.overallAverage);
    for (const rc of reportCards) {
      rc.overallPosition = sorted.findIndex(s => s.studentId === rc.studentId) + 1;
    }

    const [rcs] = await db
      .select({ status: reportCardStatusTable.status })
      .from(reportCardStatusTable)
      .where(
        and(eq(reportCardStatusTable.classId, classId), eq(reportCardStatusTable.termId, termId)),
      );

    for (const rc of reportCards) {
      (rc as any).reportCardStatus = rcs?.status ?? "draft";
    }

    res.json(reportCards);
  },
);

export default router;
