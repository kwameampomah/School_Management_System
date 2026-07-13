import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const academicYearsTable = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  yearLabel: text("year_label").notNull().unique(),
  isCurrent: boolean("is_current").notNull().default(false),
});

export const insertAcademicYearSchema = createInsertSchema(academicYearsTable).omit({ id: true });
export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type AcademicYear = typeof academicYearsTable.$inferSelect;
