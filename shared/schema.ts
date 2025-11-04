import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  joiningDate: date("joining_date").notNull(),
  department: text("department").notNull(),
  weeksEntitled: integer("weeks_entitled").notNull().default(6),
});

export const vacationRequests = pgTable("vacation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  year: integer("year").notNull().default(2026),
  
  // Priority-based weeks: ordered array of week start dates (Monday of each week)
  // Priority 0 = highest priority, Priority N = lowest priority
  prioritizedWeeks: text("prioritized_weeks").array(),
  
  // Legacy fields (kept for backward compatibility during migration)
  firstChoiceWeeks: text("first_choice_weeks").array(),
  secondChoiceWeeks: text("second_choice_weeks").array(),
  
  // Individual week approvals - array of approved week dates
  approvedWeeks: text("approved_weeks").array().notNull().default(sql`ARRAY[]::text[]`),
  deniedWeeks: text("denied_weeks").array().notNull().default(sql`ARRAY[]::text[]`),
  
  status: text("status").notNull().default("pending"),
  allocatedChoice: text("allocated_choice"),
  
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({
  id: true,
});

export const insertVacationRequestSchema = createInsertSchema(vacationRequests).omit({
  id: true,
  submittedAt: true,
}).extend({
  // New priority-based validation
  prioritizedWeeks: z.array(z.string()).min(1, "Prioritized weeks must have at least one week").optional(),
  // Legacy validation (kept for backward compatibility)
  firstChoiceWeeks: z.array(z.string()).min(1, "First choice must have at least one week").optional(),
  secondChoiceWeeks: z.array(z.string()).min(1, "Second choice must have at least one week").optional(),
}).refine(
  (data) => {
    // Must have either prioritizedWeeks OR (firstChoiceWeeks AND secondChoiceWeeks)
    const hasPrioritized = data.prioritizedWeeks && data.prioritizedWeeks.length > 0;
    const hasLegacy = data.firstChoiceWeeks && data.firstChoiceWeeks.length > 0 && 
                     data.secondChoiceWeeks && data.secondChoiceWeeks.length > 0;
    return hasPrioritized || hasLegacy;
  },
  {
    message: "Must provide either prioritizedWeeks or both firstChoiceWeeks and secondChoiceWeeks",
  }
);

export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;

export type InsertVacationRequest = z.infer<typeof insertVacationRequestSchema>;
export type VacationRequest = typeof vacationRequests.$inferSelect;
