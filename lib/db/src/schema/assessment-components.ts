import { pgTable, serial, text, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classSubjectsTable } from "./subjects";
import { termsTable } from "./terms";

export const assessmentComponentsTable = pgTable("assessment_components", {
  id: serial("id").primaryKey(),
  classSubjectId: integer("class_subject_id")
    .notNull()
    .references(() => classSubjectsTable.id, { onDelete: "cascade" }),
  termId: integer("term_id")
    .notNull()
    .references(() => termsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  weightPercent: numeric("weight_percent", { precision: 5, scale: 2 }).notNull(),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).notNull(),
});

export const insertAssessmentComponentSchema = createInsertSchema(
  assessmentComponentsTable,
).omit({ id: true });
export type InsertAssessmentComponent = z.infer<typeof insertAssessmentComponentSchema>;
export type AssessmentComponent = typeof assessmentComponentsTable.$inferSelect;
