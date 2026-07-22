import { pgTable, serial, integer, numeric, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { assessmentComponentsTable } from "./assessment-components";
import { teachersTable } from "./teachers";

export const scoresTable = pgTable("scores", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  assessmentComponentId: integer("assessment_component_id")
    .notNull()
    .references(() => assessmentComponentsTable.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").references(() => teachersTable.id, { onDelete: "set null" }),
  scoreValue: numeric("score_value", { precision: 5, scale: 2 }).notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  enteredAt: timestamp("entered_at", { withTimezone: true }).notNull().defaultNow(),
  lastEditedAt: timestamp("last_edited_at", { withTimezone: true }),
}, (table) => [
  index("scores_student_id_idx").on(table.studentId),
  index("scores_component_id_idx").on(table.assessmentComponentId),
  index("scores_teacher_id_idx").on(table.teacherId),
  index("scores_student_component_idx").on(table.studentId, table.assessmentComponentId),
]);

export const insertScoreSchema = createInsertSchema(scoresTable).omit({
  id: true,
  enteredAt: true,
  lastEditedAt: true,
});
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scoresTable.$inferSelect;
