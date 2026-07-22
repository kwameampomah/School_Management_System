import { pgTable, serial, text, integer, date, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";
import { usersTable } from "./users";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  studentIdNumber: text("student_id_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  gender: text("gender"),
  classId: integer("class_id")
    .references(() => classesTable.id, { onDelete: "restrict" }),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  guardianUserId: integer("guardian_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  admissionDate: date("admission_date", { mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("students_class_id_idx").on(table.classId),
  index("students_updated_at_idx").on(table.updatedAt),
]);

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
