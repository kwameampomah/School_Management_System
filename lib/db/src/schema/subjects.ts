import { pgTable, serial, text, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
});

export const classSubjectsTable = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classesTable.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjectsTable.id, { onDelete: "cascade" }),
}, (table) => [
  index("class_subjects_class_id_idx").on(table.classId),
  index("class_subjects_subject_id_idx").on(table.subjectId),
]);

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true });
export const insertClassSubjectSchema = createInsertSchema(classSubjectsTable).omit({ id: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;
export type ClassSubject = typeof classSubjectsTable.$inferSelect;
