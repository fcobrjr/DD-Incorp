import {
  users, commonAreas, resources, activities, teamMembers,
  workPlans, scheduledActivities,
  type User, type InsertUser,
  type CommonArea, type InsertCommonArea,
  type Resource, type InsertResource,
  type Activity, type InsertActivity,
  type TeamMember, type InsertTeamMember,
  type WorkPlan, type InsertWorkPlan,
  type ScheduledActivity, type InsertScheduledActivity
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
}

export const storage = new DatabaseStorage();
