import { pgTable, serial, text, integer, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  studentIdNumber: text("student_id_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  gender: text("gender"),
  classId: integer("class_id")
    .notNull()
    .references(() => classesTable.id, { onDelete: "restrict" }),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  admissionDate: date("admission_date", { mode: "string" }),
}, (table) => [
  index("students_class_id_idx").on(table.classId),
]);

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
