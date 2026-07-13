import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { academicYearsTable } from "./academic-years";
import { teachersTable } from "./teachers";

export const classesTable = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  academicYearId: integer("academic_year_id")
    .notNull()
    .references(() => academicYearsTable.id, { onDelete: "cascade" }),
  classTeacherId: integer("class_teacher_id").references(() => teachersTable.id, {
    onDelete: "set null",
  }),
});

export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classesTable.$inferSelect;
