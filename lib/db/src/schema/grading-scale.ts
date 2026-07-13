import { pgTable, serial, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gradingScaleTable = pgTable("grading_scale", {
  id: serial("id").primaryKey(),
  minScore: numeric("min_score", { precision: 5, scale: 2 }).notNull(),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).notNull(),
  gradeLabel: text("grade_label").notNull(),
  remark: text("remark").notNull(),
});

export const insertGradingScaleSchema = createInsertSchema(gradingScaleTable).omit({ id: true });
export type InsertGradingScale = z.infer<typeof insertGradingScaleSchema>;
export type GradingScale = typeof gradingScaleTable.$inferSelect;
