import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { studentsTable } from "./students";
import { termsTable } from "./terms";

export const studentTermMetadataTable = pgTable("student_term_metadata", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  termId: integer("term_id")
    .notNull()
    .references(() => termsTable.id, { onDelete: "cascade" }),
  daysOpened: integer("days_opened").notNull().default(0),
  daysPresent: integer("days_present").notNull().default(0),
  conduct: text("conduct"),
  attitude: text("attitude"),
  interest: text("interest"),
  teacherRemarks: text("teacher_remarks"),
  headmasterRemarks: text("headmaster_remarks"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("student_term_metadata_student_id_idx").on(table.studentId),
  index("student_term_metadata_term_id_idx").on(table.termId),
  index("student_term_metadata_updated_at_idx").on(table.updatedAt),
]);

export type StudentTermMetadata = typeof studentTermMetadataTable.$inferSelect;
export type InsertStudentTermMetadata = typeof studentTermMetadataTable.$inferInsert;
