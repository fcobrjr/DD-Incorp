import {
  users, commonAreas, resources, activities, teamMembers,
  workPlans, scheduledActivities, governanceParameters,
  governanceWeeklyPlans, governanceSchedules, convocations,
  type User, type InsertUser,
  type CommonArea, type InsertCommonArea,
  type Resource, type InsertResource,
  type Activity, type InsertActivity,
  type TeamMember, type InsertTeamMember,
  type WorkPlan, type InsertWorkPlan,
  type ScheduledActivity, type InsertScheduledActivity,
  type GovernanceParameters, type InsertGovernanceParameters,
  type GovernanceWeeklyPlan, type InsertGovernanceWeeklyPlan,
  type GovernanceSchedule, type InsertGovernanceSchedule,
  type Convocation, type InsertConvocation
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: any;

  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  getCommonAreas(): Promise<CommonArea[]>;
  getCommonArea(id: number): Promise<CommonArea | undefined>;
  createCommonArea(area: InsertCommonArea): Promise<CommonArea>;
  updateCommonArea(id: number, area: Partial<InsertCommonArea>): Promise<CommonArea>;
  deleteCommonArea(id: number): Promise<void>;

  getResources(type?: "tool" | "material"): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: number): Promise<void>;

  getActivities(): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(id: number): Promise<void>;

  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, member: Partial<InsertTeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<void>;

  getWorkPlans(): Promise<WorkPlan[]>;
  getWorkPlan(id: number): Promise<WorkPlan | undefined>;
  getWorkPlanByCommonArea(commonAreaId: number): Promise<WorkPlan | undefined>;
  createWorkPlan(plan: InsertWorkPlan): Promise<WorkPlan>;
  updateWorkPlan(id: number, plan: Partial<InsertWorkPlan>): Promise<WorkPlan>;
  deleteWorkPlan(id: number): Promise<void>;

  getScheduledActivities(): Promise<ScheduledActivity[]>;
  createScheduledActivity(activity: InsertScheduledActivity): Promise<ScheduledActivity>;
  updateScheduledActivity(id: number, activity: Partial<InsertScheduledActivity>): Promise<ScheduledActivity>;
  deleteScheduledActivity(id: number): Promise<void>;

  getGovernanceParameters(): Promise<GovernanceParameters | undefined>;
  updateGovernanceParameters(params: Partial<InsertGovernanceParameters>): Promise<GovernanceParameters>;

  getGovernanceWeeklyPlans(): Promise<GovernanceWeeklyPlan[]>;
  getGovernanceWeeklyPlan(id: number): Promise<GovernanceWeeklyPlan | undefined>;
  createGovernanceWeeklyPlan(plan: InsertGovernanceWeeklyPlan): Promise<GovernanceWeeklyPlan>;
  updateGovernanceWeeklyPlan(id: number, plan: Partial<InsertGovernanceWeeklyPlan>): Promise<GovernanceWeeklyPlan>;
  deleteGovernanceWeeklyPlan(id: number): Promise<void>;

  getGovernanceSchedules(): Promise<GovernanceSchedule[]>;
  getGovernanceSchedule(id: number): Promise<GovernanceSchedule | undefined>;
  createGovernanceSchedule(schedule: InsertGovernanceSchedule): Promise<GovernanceSchedule>;
  updateGovernanceSchedule(id: number, schedule: Partial<InsertGovernanceSchedule>): Promise<GovernanceSchedule>;
  deleteGovernanceSchedule(id: number): Promise<void>;

  getConvocations(): Promise<Convocation[]>;
  getConvocation(id: number): Promise<Convocation | undefined>;
  createConvocation(convocation: InsertConvocation): Promise<Convocation>;
  updateConvocation(id: number, convocation: Partial<InsertConvocation>): Promise<Convocation>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getCommonAreas(): Promise<CommonArea[]> {
    return await db.select().from(commonAreas).orderBy(desc(commonAreas.createdAt));
  }

  async getCommonArea(id: number): Promise<CommonArea | undefined> {
    const [area] = await db.select().from(commonAreas).where(eq(commonAreas.id, id));
    return area || undefined;
  }

  async createCommonArea(area: InsertCommonArea): Promise<CommonArea> {
    const [newArea] = await db.insert(commonAreas).values(area).returning();
    return newArea;
  }

  async updateCommonArea(id: number, area: Partial<InsertCommonArea>): Promise<CommonArea> {
    const [updated] = await db.update(commonAreas).set(area).where(eq(commonAreas.id, id)).returning();
    return updated;
  }

  async deleteCommonArea(id: number): Promise<void> {
    await db.delete(commonAreas).where(eq(commonAreas.id, id));
  }

  async getResources(type?: "tool" | "material"): Promise<Resource[]> {
    if (type) {
      return await db.select().from(resources).where(eq(resources.type, type)).orderBy(desc(resources.createdAt));
    }
    return await db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource> {
    const [updated] = await db.update(resources).set(resource).where(eq(resources.id, id)).returning();
    return updated;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt));
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity> {
    const [updated] = await db.update(activities).set(activity).where(eq(activities.id, id)).returning();
    return updated;
  }

  async deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).orderBy(desc(teamMembers.createdAt));
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member || undefined;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async updateTeamMember(id: number, member: Partial<InsertTeamMember>): Promise<TeamMember> {
    const [updated] = await db.update(teamMembers).set(member).where(eq(teamMembers.id, id)).returning();
    return updated;
  }

  async deleteTeamMember(id: number): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  async getWorkPlans(): Promise<WorkPlan[]> {
    return await db.select().from(workPlans).orderBy(desc(workPlans.createdAt));
  }

  async getWorkPlan(id: number): Promise<WorkPlan | undefined> {
    const [plan] = await db.select().from(workPlans).where(eq(workPlans.id, id));
    return plan || undefined;
  }

  async getWorkPlanByCommonArea(commonAreaId: number): Promise<WorkPlan | undefined> {
    const [plan] = await db.select().from(workPlans).where(eq(workPlans.commonAreaId, commonAreaId));
    return plan || undefined;
  }

  async createWorkPlan(plan: InsertWorkPlan): Promise<WorkPlan> {
    const [newPlan] = await db.insert(workPlans).values(plan).returning();
    return newPlan;
  }

  async updateWorkPlan(id: number, plan: Partial<InsertWorkPlan>): Promise<WorkPlan> {
    const [updated] = await db.update(workPlans).set(plan).where(eq(workPlans.id, id)).returning();
    return updated;
  }

  async deleteWorkPlan(id: number): Promise<void> {
    await db.delete(workPlans).where(eq(workPlans.id, id));
  }

  async getScheduledActivities(): Promise<ScheduledActivity[]> {
    return await db.select().from(scheduledActivities).orderBy(desc(scheduledActivities.createdAt));
  }

  async createScheduledActivity(activity: InsertScheduledActivity): Promise<ScheduledActivity> {
    const [newActivity] = await db.insert(scheduledActivities).values(activity).returning();
    return newActivity;
  }

  async updateScheduledActivity(id: number, activity: Partial<InsertScheduledActivity>): Promise<ScheduledActivity> {
    const [updated] = await db.update(scheduledActivities).set(activity).where(eq(scheduledActivities.id, id)).returning();
    return updated;
  }

  async deleteScheduledActivity(id: number): Promise<void> {
    await db.delete(scheduledActivities).where(eq(scheduledActivities.id, id));
  }

  async getGovernanceParameters(): Promise<GovernanceParameters | undefined> {
    const [params] = await db.select().from(governanceParameters).limit(1);
    return params || undefined;
  }

  async updateGovernanceParameters(params: Partial<InsertGovernanceParameters>): Promise<GovernanceParameters> {
    const existing = await this.getGovernanceParameters();
    if (existing) {
      const [updated] = await db.update(governanceParameters).set({ ...params, updatedAt: new Date() }).where(eq(governanceParameters.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(governanceParameters).values(params as InsertGovernanceParameters).returning();
      return created;
    }
  }

  async getGovernanceWeeklyPlans(): Promise<GovernanceWeeklyPlan[]> {
    return await db.select().from(governanceWeeklyPlans).orderBy(desc(governanceWeeklyPlans.weekStartDate));
  }

  async getGovernanceWeeklyPlan(id: number): Promise<GovernanceWeeklyPlan | undefined> {
    const [plan] = await db.select().from(governanceWeeklyPlans).where(eq(governanceWeeklyPlans.id, id));
    return plan || undefined;
  }

  async createGovernanceWeeklyPlan(plan: InsertGovernanceWeeklyPlan): Promise<GovernanceWeeklyPlan> {
    const [newPlan] = await db.insert(governanceWeeklyPlans).values(plan).returning();
    return newPlan;
  }

  async updateGovernanceWeeklyPlan(id: number, plan: Partial<InsertGovernanceWeeklyPlan>): Promise<GovernanceWeeklyPlan> {
    const [updated] = await db.update(governanceWeeklyPlans).set({ ...plan, updatedAt: new Date() }).where(eq(governanceWeeklyPlans.id, id)).returning();
    return updated;
  }

  async deleteGovernanceWeeklyPlan(id: number): Promise<void> {
    await db.delete(governanceWeeklyPlans).where(eq(governanceWeeklyPlans.id, id));
  }

  async getGovernanceSchedules(): Promise<GovernanceSchedule[]> {
    return await db.select().from(governanceSchedules).orderBy(desc(governanceSchedules.weekStartDate));
  }

  async getGovernanceSchedule(id: number): Promise<GovernanceSchedule | undefined> {
    const [schedule] = await db.select().from(governanceSchedules).where(eq(governanceSchedules.id, id));
    return schedule || undefined;
  }

  async createGovernanceSchedule(schedule: InsertGovernanceSchedule): Promise<GovernanceSchedule> {
    const [newSchedule] = await db.insert(governanceSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateGovernanceSchedule(id: number, schedule: Partial<InsertGovernanceSchedule>): Promise<GovernanceSchedule> {
    const [updated] = await db.update(governanceSchedules).set({ ...schedule, updatedAt: new Date() }).where(eq(governanceSchedules.id, id)).returning();
    return updated;
  }

  async deleteGovernanceSchedule(id: number): Promise<void> {
    await db.delete(governanceSchedules).where(eq(governanceSchedules.id, id));
  }

  async getConvocations(): Promise<Convocation[]> {
    return await db.select().from(convocations).orderBy(desc(convocations.sentAt));
  }

  async getConvocation(id: number): Promise<Convocation | undefined> {
    const [convocation] = await db.select().from(convocations).where(eq(convocations.id, id));
    return convocation || undefined;
  }

  async createConvocation(convocation: InsertConvocation): Promise<Convocation> {
    const [newConvocation] = await db.insert(convocations).values(convocation).returning();
    return newConvocation;
  }

  async updateConvocation(id: number, convocation: Partial<InsertConvocation>): Promise<Convocation> {
    const [updated] = await db.update(convocations).set(convocation).where(eq(convocations.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
