import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, studentTermMetadataTable, studentsTable } from "@workspace/db";
import { requireTeacher } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/student-term-metadata", requireTeacher, async (req, res): Promise<void> => {
  const termId = req.query.termId ? parseInt(req.query.termId as string, 10) : null;
  const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : null;

  if (!termId) {
    res.status(400).json({ error: "termId is required" });
    return;
  }

  const conditions = [eq(studentTermMetadataTable.termId, termId)];
  if (classId) {
    conditions.push(eq(studentsTable.classId, classId));
  }

  const rows = await db
    .select({
      id: studentTermMetadataTable.id,
      studentId: studentTermMetadataTable.studentId,
      studentName: studentsTable.fullName,
      termId: studentTermMetadataTable.termId,
      daysOpened: studentTermMetadataTable.daysOpened,
      daysPresent: studentTermMetadataTable.daysPresent,
      conduct: studentTermMetadataTable.conduct,
      attitude: studentTermMetadataTable.attitude,
      interest: studentTermMetadataTable.interest,
      teacherRemarks: studentTermMetadataTable.teacherRemarks,
      headmasterRemarks: studentTermMetadataTable.headmasterRemarks,
    })
    .from(studentTermMetadataTable)
    .innerJoin(studentsTable, eq(studentTermMetadataTable.studentId, studentsTable.id))
    .where(and(...conditions));

  res.json(rows);
});

router.put("/student-term-metadata", requireTeacher, async (req, res): Promise<void> => {
  const {
    studentId,
    termId,
    daysOpened,
    daysPresent,
    conduct,
    attitude,
    interest,
    teacherRemarks,
    headmasterRemarks,
  } = req.body;

  if (!studentId || !termId) {
    res.status(400).json({ error: "studentId and termId are required" });
    return;
  }

  // Check if existing record
  const [existing] = await db
    .select()
    .from(studentTermMetadataTable)
    .where(
      and(
        eq(studentTermMetadataTable.studentId, studentId),
        eq(studentTermMetadataTable.termId, termId),
      ),
    );

  const payload = {
    studentId,
    termId,
    daysOpened: daysOpened !== undefined ? parseInt(daysOpened, 10) : 0,
    daysPresent: daysPresent !== undefined ? parseInt(daysPresent, 10) : 0,
    conduct: conduct || null,
    attitude: attitude || null,
    interest: interest || null,
    teacherRemarks: teacherRemarks || null,
    headmasterRemarks: headmasterRemarks || null,
  };

  let result;
  if (existing) {
    [result] = await db
      .update(studentTermMetadataTable)
      .set(payload)
      .where(eq(studentTermMetadataTable.id, existing.id))
      .returning();
  } else {
    [result] = await db
      .insert(studentTermMetadataTable)
      .values(payload)
      .returning();
  }

  res.json(result);
});

export default router;
