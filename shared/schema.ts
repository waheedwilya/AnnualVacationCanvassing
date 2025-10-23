import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  joiningDate: date("joining_date").notNull(),
  department: text("department").notNull(),
  weeksEntitled: integer("weeks_entitled").notNull().default(6),
});

export const vacationRequests = pgTable("vacation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  year: integer("year").notNull().default(2026),
  
  firstChoiceStart: date("first_choice_start").notNull(),
  firstChoiceEnd: date("first_choice_end").notNull(),
  
  secondChoiceStart: date("second_choice_start").notNull(),
  secondChoiceEnd: date("second_choice_end").notNull(),
  
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
  firstChoiceStart: z.string(),
  firstChoiceEnd: z.string(),
  secondChoiceStart: z.string(),
  secondChoiceEnd: z.string(),
});

export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;

export type InsertVacationRequest = z.infer<typeof insertVacationRequestSchema>;
export type VacationRequest = typeof vacationRequests.$inferSelect;
