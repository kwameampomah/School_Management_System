import { pgTable, serial, text, boolean, integer, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { academicYearsTable } from "./academic-years";

export const termsTable = pgTable("terms", {
  id: serial("id").primaryKey(),
  academicYearId: integer("academic_year_id")
    .notNull()
    .references(() => academicYearsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  isCurrent: boolean("is_current").notNull().default(false),
}, (table) => [
  index("terms_academic_year_id_idx").on(table.academicYearId),
]);

export const insertTermSchema = createInsertSchema(termsTable).omit({ id: true });
export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Term = typeof termsTable.$inferSelect;
