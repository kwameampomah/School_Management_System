import { pgTable, serial, integer, text, numeric, date, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { termsTable } from "./terms";
import { usersTable } from "./users";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank_transfer", "momo"]);

export const feeTypesTable = pgTable("fee_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentFeesTable = pgTable("student_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  termId: integer("term_id")
    .notNull()
    .references(() => termsTable.id, { onDelete: "cascade" }),
  feeTypeId: integer("fee_type_id")
    .notNull()
    .references(() => feeTypesTable.id, { onDelete: "restrict" }),
  amountDue: numeric("amount_due", { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0.00"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("student_fees_student_term_idx").on(table.studentId, table.termId),
]);

export const feePaymentsTable = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  studentFeeId: integer("student_fee_id")
    .notNull()
    .references(() => studentFeesTable.id, { onDelete: "cascade" }),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  reference: text("reference"),
  recordedBy: integer("recorded_by").references(() => usersTable.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("fee_payments_student_fee_idx").on(table.studentFeeId),
]);

export const insertFeeTypeSchema = createInsertSchema(feeTypesTable).omit({ id: true, createdAt: true });
export type InsertFeeType = z.infer<typeof insertFeeTypeSchema>;
export type FeeType = typeof feeTypesTable.$inferSelect;

export const insertStudentFeeSchema = createInsertSchema(studentFeesTable).omit({ id: true, createdAt: true });
export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;
export type StudentFee = typeof studentFeesTable.$inferSelect;

export const insertFeePaymentSchema = createInsertSchema(feePaymentsTable).omit({ id: true, createdAt: true });
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type FeePayment = typeof feePaymentsTable.$inferSelect;
