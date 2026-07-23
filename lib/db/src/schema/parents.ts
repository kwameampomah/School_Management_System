import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { studentsTable } from "./students";

export const parentsTable = pgTable("parents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  studentId: integer("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  relationship: text("relationship").default("parent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("parents_user_id_idx").on(table.userId),
  index("parents_student_id_idx").on(table.studentId),
]);

export const insertParentSchema = createInsertSchema(parentsTable).omit({ id: true });
export type InsertParent = z.infer<typeof insertParentSchema>;
export type Parent = typeof parentsTable.$inferSelect;
