import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, studentsTable, auditLogsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/promotions/bulk", requireAdmin, async (req, res): Promise<void> => {
  const { studentIds, targetClassId } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0 || !targetClassId) {
    res.status(400).json({ error: "studentIds array and targetClassId are required" });
    return;
  }

  try {
    const numericTargetClassId = parseInt(targetClassId, 10);

    // Update students
    const updatedRows = await db
      .update(studentsTable)
      .set({ classId: numericTargetClassId })
      .where(inArray(studentsTable.id, studentIds))
      .returning();

    // Log promotions in the audit trail
    for (const student of updatedRows) {
      await db.insert(auditLogsTable).values({
        actorUserId: req.session.userId ?? null,
        action: "PROMOTE",
        tableName: "students",
        rowId: student.id,
        oldValue: `Class ID change for student: ${student.fullName}`,
        newValue: `New Class ID: ${numericTargetClassId}`,
      });
    }

    res.json({ successCount: updatedRows.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to process promotions" });
  }
});

export default router;
