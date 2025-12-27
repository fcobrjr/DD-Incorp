import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  insertCommonAreaSchema, insertResourceSchema, insertActivitySchema,
  insertTeamMemberSchema, insertWorkPlanSchema, insertScheduledActivitySchema
} from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/common-areas", async (req, res) => {
    try {
      const areas = await storage.getCommonAreas();
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch common areas" });
    }
  });

  app.get("/api/common-areas/:id", async (req, res) => {
    try {
      const area = await storage.getCommonArea(parseInt(req.params.id));
      if (!area) {
        return res.status(404).json({ message: "Common area not found" });
      }
      res.json(area);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch common area" });
    }
  });

  app.post("/api/common-areas", async (req, res) => {
    try {
      const areaData = insertCommonAreaSchema.parse(req.body);
      const area = await storage.createCommonArea(areaData);
      res.status(201).json(area);
    } catch (error) {
      res.status(400).json({ message: "Invalid common area data", error });
    }
  });

  app.put("/api/common-areas/:id", async (req, res) => {
    try {
      const areaData = insertCommonAreaSchema.partial().parse(req.body);
      const area = await storage.updateCommonArea(parseInt(req.params.id), areaData);
      res.json(area);
    } catch (error) {
      res.status(400).json({ message: "Failed to update common area", error });
    }
  });

  app.delete("/api/common-areas/:id", async (req, res) => {
    try {
      await storage.deleteCommonArea(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete common area" });
    }
  });

  app.get("/api/resources", async (req, res) => {
    try {
      const type = req.query.type as "tool" | "material" | undefined;
      const resources = await storage.getResources(type);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    try {
      const resource = await storage.getResource(parseInt(req.params.id));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource data", error });
    }
  });

  app.put("/api/resources/:id", async (req, res) => {
    try {
      const resourceData = insertResourceSchema.partial().parse(req.body);
      const resource = await storage.updateResource(parseInt(req.params.id), resourceData);
      res.json(resource);
    } catch (error) {
      res.status(400).json({ message: "Failed to update resource", error });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    try {
      await storage.deleteResource(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/:id", async (req, res) => {
    try {
      const activity = await storage.getActivity(parseInt(req.params.id));
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: "Invalid activity data", error });
    }
  });

  app.put("/api/activities/:id", async (req, res) => {
    try {
      const activityData = insertActivitySchema.partial().parse(req.body);
      const activity = await storage.updateActivity(parseInt(req.params.id), activityData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ message: "Failed to update activity", error });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      await storage.deleteActivity(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  app.get("/api/team-members", async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team-members/:id", async (req, res) => {
    try {
      const member = await storage.getTeamMember(parseInt(req.params.id));
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.post("/api/team-members", async (req, res) => {
    try {
      const memberData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid team member data", error });
    }
  });

  app.put("/api/team-members/:id", async (req, res) => {
    try {
      const memberData = insertTeamMemberSchema.partial().parse(req.body);
      const member = await storage.updateTeamMember(parseInt(req.params.id), memberData);
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: "Failed to update team member", error });
    }
  });

  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      await storage.deleteTeamMember(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  app.get("/api/work-plans", async (req, res) => {
    try {
      const plans = await storage.getWorkPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work plans" });
    }
  });

  app.get("/api/work-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getWorkPlan(parseInt(req.params.id));
      if (!plan) {
        return res.status(404).json({ message: "Work plan not found" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work plan" });
    }
  });

  app.post("/api/work-plans", async (req, res) => {
    try {
      const planData = insertWorkPlanSchema.parse(req.body);
      const plan = await storage.createWorkPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: "Invalid work plan data", error });
    }
  });

  app.put("/api/work-plans/:id", async (req, res) => {
    try {
      const planData = insertWorkPlanSchema.partial().parse(req.body);
      const plan = await storage.updateWorkPlan(parseInt(req.params.id), planData);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: "Failed to update work plan", error });
    }
  });

  app.delete("/api/work-plans/:id", async (req, res) => {
    try {
      await storage.deleteWorkPlan(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete work plan" });
    }
  });

  app.get("/api/scheduled-activities", async (req, res) => {
    try {
      const activities = await storage.getScheduledActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scheduled activities" });
    }
  });

  app.post("/api/scheduled-activities", async (req, res) => {
    try {
      const activityData = insertScheduledActivitySchema.parse(req.body);
      const activity = await storage.createScheduledActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: "Invalid scheduled activity data", error });
    }
  });

  app.put("/api/scheduled-activities/:id", async (req, res) => {
    try {
      const activityData = insertScheduledActivitySchema.partial().parse(req.body);
      const activity = await storage.updateScheduledActivity(parseInt(req.params.id), activityData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ message: "Failed to update scheduled activity", error });
    }
  });

  app.delete("/api/scheduled-activities/:id", async (req, res) => {
    try {
      await storage.deleteScheduledActivity(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scheduled activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
