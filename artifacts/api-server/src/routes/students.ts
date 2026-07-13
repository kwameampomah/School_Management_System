import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, studentsTable, classesTable } from "@workspace/db";
import { requireAuth, requireAdmin, requireTeacher } from "../middlewares/auth";

const router: IRouter = Router();

async function teacherCanManageStudent(
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

async function teacherCanManageStudentId(
  role: string,
  teacherId: number | null,
  studentId: number,
): Promise<boolean> {
  if (role === "admin") return true;
  if (!teacherId) return false;

  const [student] = await db
    .select({ classId: studentsTable.classId })
    .from(studentsTable)
    .where(eq(studentsTable.id, studentId));

  if (!student) return false;

  return teacherCanManageStudent(role, teacherId, student.classId);
}

async function getStudentRow(id: number) {
  const [row] = await db
    .select({
      id: studentsTable.id,
      studentIdNumber: studentsTable.studentIdNumber,
      fullName: studentsTable.fullName,
      dateOfBirth: studentsTable.dateOfBirth,
      gender: studentsTable.gender,
      classId: studentsTable.classId,
      className: classesTable.name,
      guardianName: studentsTable.guardianName,
      guardianPhone: studentsTable.guardianPhone,
      admissionDate: studentsTable.admissionDate,
    })
    .from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(eq(studentsTable.id, id));
  return row;
}

router.get("/students", requireAuth, async (req, res): Promise<void> => {
  const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : null;

  const rows = await db
    .select({
      id: studentsTable.id,
      studentIdNumber: studentsTable.studentIdNumber,
      fullName: studentsTable.fullName,
      dateOfBirth: studentsTable.dateOfBirth,
      gender: studentsTable.gender,
      classId: studentsTable.classId,
      className: classesTable.name,
      guardianName: studentsTable.guardianName,
      guardianPhone: studentsTable.guardianPhone,
      admissionDate: studentsTable.admissionDate,
    })
    .from(studentsTable)
    .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
    .where(classId ? eq(studentsTable.classId, classId) : undefined)
    .orderBy(studentsTable.fullName);

  res.json(rows);
});

router.post("/students", requireTeacher, async (req, res): Promise<void> => {
  const { studentIdNumber, fullName, classId, dateOfBirth, gender, guardianName, guardianPhone, admissionDate } = req.body;
  if (!studentIdNumber || !fullName || !classId) {
    res.status(400).json({ error: "studentIdNumber, fullName, and classId are required" });
    return;
  }

  const classIdNum = parseInt(classId, 10);
  const allowed = await teacherCanManageStudent(req.session.role!, req.session.teacherId ?? null, classIdNum);
  if (!allowed) {
    res.status(403).json({ error: "You are not authorized to add students to this class" });
    return;
  }

  const [student] = await db
    .insert(studentsTable)
    .values({ studentIdNumber, fullName, classId: classIdNum, dateOfBirth, gender, guardianName, guardianPhone, admissionDate })
    .returning();
  const row = await getStudentRow(student.id);
  res.status(201).json(row);
});

router.post("/students/bulk", requireTeacher, async (req, res): Promise<void> => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) {
    res.status(400).json({ error: "students array is required" });
    return;
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const { studentIdNumber, fullName, classId, dateOfBirth, gender, guardianName, guardianPhone, admissionDate } = s;
    if (!studentIdNumber || !fullName || !classId) {
      errors.push({ index: i, error: "studentIdNumber, fullName, and classId are required" });
      continue;
    }

    const classIdNum = parseInt(classId, 10);
    const allowed = await teacherCanManageStudent(req.session.role!, req.session.teacherId ?? null, classIdNum);
    if (!allowed) {
      errors.push({ index: i, name: fullName, error: "You are not authorized to add students to this class" });
      continue;
    }

    try {
      const [student] = await db
        .insert(studentsTable)
        .values({
          studentIdNumber,
          fullName,
          classId: parseInt(classId, 10),
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          admissionDate: admissionDate || null
        })
        .returning();
      
      results.push(student);
    } catch (e: any) {
      errors.push({ index: i, name: fullName, error: e.message || "Insert failed" });
    }
  }

  res.json({ successCount: results.length, errorCount: errors.length, errors });
});

router.get("/students/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const row = await getStudentRow(id);
  if (!row) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(row);
});

router.patch("/students/:id", requireTeacher, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { fullName, dateOfBirth, gender, classId, guardianName, guardianPhone } = req.body;

  const allowed = await teacherCanManageStudentId(req.session.role!, req.session.teacherId ?? null, id);
  if (!allowed) {
    res.status(403).json({ error: "You are not authorized to modify this student" });
    return;
  }

  if (classId !== undefined) {
    const targetClassId = parseInt(classId, 10);
    const targetAllowed = await teacherCanManageStudent(req.session.role!, req.session.teacherId ?? null, targetClassId);
    if (!targetAllowed) {
      res.status(403).json({ error: "You are not authorized to move student to this class" });
      return;
    }
  }

  const updates: Record<string, unknown> = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
  if (gender !== undefined) updates.gender = gender;
  if (classId !== undefined) updates.classId = classId;
  if (guardianName !== undefined) updates.guardianName = guardianName;
  if (guardianPhone !== undefined) updates.guardianPhone = guardianPhone;

  const [student] = await db.update(studentsTable).set(updates).where(eq(studentsTable.id, id)).returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const row = await getStudentRow(id);
  res.json(row);
});

router.delete("/students/:id", requireTeacher, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const allowed = await teacherCanManageStudentId(req.session.role!, req.session.teacherId ?? null, id);
  if (!allowed) {
    res.status(403).json({ error: "You are not authorized to delete this student" });
    return;
  }

  const [student] = await db.delete(studentsTable).where(eq(studentsTable.id, id)).returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
