import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "manager", "operator"] }).notNull().default("operator"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commonAreas = pgTable("common_areas", {
  id: serial("id").primaryKey(),
  client: text("client").notNull(),
  location: text("location").notNull(),
  subLocation: text("sub_location").notNull(),
  environment: text("environment").notNull(),
  area: real("area").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["tool", "material"] }).notNull(),
  unit: text("unit").notNull(),
  coefficientM2: real("coefficient_m2"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sla: integer("sla").notNull(),
  slaCoefficient: real("sla_coefficient"),
  tools: jsonb("tools").default([]),
  materials: jsonb("materials").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  sector: text("sector", { enum: ["A&B", "Recepção", "Manutenção", "Áreas Comuns", "Outros"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  contractType: text("contract_type", { enum: ["Efetivo", "Intermitente"] }),
  workSchedule: text("work_schedule", { enum: ["5x2", "6x1", "12x36", "Flexível", "Outro"] }),
  cbo: text("cbo"),
  maxWeeklyHours: integer("max_weekly_hours"),
  monthlyHoursTarget: integer("monthly_hours_target"),
  cleaningSpeedVacantDirty: real("cleaning_speed_vacant_dirty"),
  cleaningSpeedStay: real("cleaning_speed_stay"),
  governanceMaxWeeklyHours: integer("governance_max_weekly_hours"),
  operationalRestrictions: text("operational_restrictions"),
  unavailableDays: jsonb("unavailable_days").default([]),
  historyWeeks: jsonb("history_weeks").default([]),
  lastFullOffWeek: text("last_full_off_week"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workPlans = pgTable("work_plans", {
  id: serial("id").primaryKey(),
  commonAreaId: integer("common_area_id").notNull().references(() => commonAreas.id, { onDelete: "cascade" }),
  plannedActivities: jsonb("planned_activities").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduledActivities = pgTable("scheduled_activities", {
  id: serial("id").primaryKey(),
  workPlanId: integer("work_plan_id").notNull().references(() => workPlans.id, { onDelete: "cascade" }),
  plannedActivityId: text("planned_activity_id").notNull(),
  plannedDate: text("planned_date").notNull(),
  executionDate: text("execution_date"),
  operatorId: integer("operator_id").references(() => teamMembers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const governanceParameters = pgTable("governance_parameters", {
  id: serial("id").primaryKey(),
  defaultCleaningSpeedVacantDirty: real("default_cleaning_speed_vacant_dirty").notNull().default(30),
  defaultCleaningSpeedStay: real("default_cleaning_speed_stay").notNull().default(20),
  holidayDemandMultiplier: real("holiday_demand_multiplier").notNull().default(1.2),
  holidayEveDemandMultiplier: real("holiday_eve_demand_multiplier").notNull().default(1.1),
  allowIntermittentOnHolidays: boolean("allow_intermittent_on_holidays").notNull().default(true),
  preferEffectiveOnHolidays: boolean("prefer_effective_on_holidays").notNull().default(true),
  holidayNotes: text("holiday_notes").default(""),
  intermittentMinWeeklyHours: integer("intermittent_min_weekly_hours").notNull().default(8),
  intermittentMaxWeeklyHours: integer("intermittent_max_weekly_hours").notNull().default(44),
  intermittentMaxConsecutiveDays: integer("intermittent_max_consecutive_days").notNull().default(6),
  intermittentWeeksInterval: integer("intermittent_weeks_interval").notNull().default(1),
  intermittentMandatoryOffWeeks: integer("intermittent_mandatory_off_weeks").notNull().default(4),
  maxShiftRepetitionPercentage: real("max_shift_repetition_percentage").notNull().default(60),
  maxDayShiftRepetitionPercentage: real("max_day_shift_repetition_percentage").notNull().default(50),
  alternationMode: text("alternation_mode", { enum: ["Conservador", "Flexível"] }).notNull().default("Flexível"),
  totalApartments: integer("total_apartments").notNull().default(100),
  standardShiftDuration: real("standard_shift_duration").notNull().default(8),
  efficiencyTarget: real("efficiency_target").notNull().default(80),
  sundayRotationRatio: integer("sunday_rotation_ratio").notNull().default(4),
  customRules: text("custom_rules").default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const governanceWeeklyPlans = pgTable("governance_weekly_plans", {
  id: serial("id").primaryKey(),
  weekStartDate: text("week_start_date").notNull(),
  weekEndDate: text("week_end_date").notNull(),
  weeklyMaintenanceRooms: integer("weekly_maintenance_rooms"),
  days: jsonb("days").default([]),
  calculatedDemand: jsonb("calculated_demand"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const governanceSchedules = pgTable("governance_schedules", {
  id: serial("id").primaryKey(),
  weekStartDate: text("week_start_date").notNull(),
  shifts: jsonb("shifts").default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const convocations = pgTable("convocations", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => governanceSchedules.id, { onDelete: "cascade" }),
  shiftId: text("shift_id").notNull(),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembers.id),
  shiftDate: text("shift_date").notNull(),
  shiftStartTime: text("shift_start_time").notNull(),
  shiftEndTime: text("shift_end_time").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deadlineAt: timestamp("deadline_at").notNull(),
  respondedAt: timestamp("responded_at"),
  status: text("status", { enum: ["Pendente", "Aceita", "Recusada", "Expirada"] }).notNull().default("Pendente"),
  operationalJustification: text("operational_justification"),
  rejectionReason: text("rejection_reason"),
});

export const usersRelations = relations(users, ({ many }) => ({}));

export const commonAreasRelations = relations(commonAreas, ({ many }) => ({
  workPlans: many(workPlans),
}));

export const workPlansRelations = relations(workPlans, ({ one, many }) => ({
  commonArea: one(commonAreas, {
    fields: [workPlans.commonAreaId],
    references: [commonAreas.id],
  }),
  scheduledActivities: many(scheduledActivities),
}));

export const scheduledActivitiesRelations = relations(scheduledActivities, ({ one }) => ({
  workPlan: one(workPlans, {
    fields: [scheduledActivities.workPlanId],
    references: [workPlans.id],
  }),
  operator: one(teamMembers, {
    fields: [scheduledActivities.operatorId],
    references: [teamMembers.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCommonAreaSchema = createInsertSchema(commonAreas).omit({
  id: true,
  createdAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertWorkPlanSchema = createInsertSchema(workPlans).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledActivitySchema = createInsertSchema(scheduledActivities).omit({
  id: true,
  createdAt: true,
});

export const insertGovernanceParametersSchema = createInsertSchema(governanceParameters).omit({
  id: true,
  updatedAt: true,
});

export const insertGovernanceWeeklyPlanSchema = createInsertSchema(governanceWeeklyPlans).omit({
  id: true,
  updatedAt: true,
});

export const insertGovernanceScheduleSchema = createInsertSchema(governanceSchedules).omit({
  id: true,
  updatedAt: true,
});

export const insertConvocationSchema = createInsertSchema(convocations).omit({
  id: true,
  sentAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CommonArea = typeof commonAreas.$inferSelect;
export type InsertCommonArea = z.infer<typeof insertCommonAreaSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type WorkPlan = typeof workPlans.$inferSelect;
export type InsertWorkPlan = z.infer<typeof insertWorkPlanSchema>;
export type ScheduledActivity = typeof scheduledActivities.$inferSelect;
export type InsertScheduledActivity = z.infer<typeof insertScheduledActivitySchema>;
export type GovernanceParameters = typeof governanceParameters.$inferSelect;
export type InsertGovernanceParameters = z.infer<typeof insertGovernanceParametersSchema>;
export type GovernanceWeeklyPlan = typeof governanceWeeklyPlans.$inferSelect;
export type InsertGovernanceWeeklyPlan = z.infer<typeof insertGovernanceWeeklyPlanSchema>;
export type GovernanceSchedule = typeof governanceSchedules.$inferSelect;
export type InsertGovernanceSchedule = z.infer<typeof insertGovernanceScheduleSchema>;
export type Convocation = typeof convocations.$inferSelect;
export type InsertConvocation = z.infer<typeof insertConvocationSchema>;
