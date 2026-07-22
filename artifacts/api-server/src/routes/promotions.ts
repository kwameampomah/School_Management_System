import { Router, type IRouter } from "express";
import { inArray } from "drizzle-orm";
import { db, studentsTable, auditLogsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { z } from "zod";

const router: IRouter = Router();

const BulkPromotionBody = z.object({
  studentIds: z.array(z.number()),
  // null means "graduate" (remove from all classes); a number means move to target class
  targetClassId: z.number().int().positive().nullable(),
});

router.post("/promotions/bulk", requireAdmin, validate(BulkPromotionBody), async (req, res): Promise<void> => {
  const { studentIds, targetClassId } = req.body;

  try {
    const isGraduation = targetClassId === null;

    // Update students — null classId marks them as graduated
    // Use `any` cast for the null case because Drizzle's set() types don't allow null
    // for non-nullable columns, but the DB schema allows null for classId (graduated students)
    const updatedRows = await db
      .update(studentsTable)
      .set({ classId: (isGraduation ? null : targetClassId) as any })
      .where(inArray(studentsTable.id, studentIds))
      .returning();

    // Log promotions in the audit trail
    for (const student of updatedRows) {
      await db.insert(auditLogsTable).values({
        actorUserId: req.session.userId ?? null,
        action: isGraduation ? "GRADUATE" : "PROMOTE",
        tableName: "students",
        rowId: student.id,
        oldValue: `Class ID change for student: ${student.fullName}`,
        newValue: isGraduation ? "Graduated (no class)" : `New Class ID: ${targetClassId}`,
      });
    }

    res.json({ successCount: updatedRows.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to process promotions" });
  }
});

export default router;

