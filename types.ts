
export interface BaseItem {
  id: string;
  name: string;
}

export interface Resource extends BaseItem {
  unit: string; // e.g., 'unit', 'ml', 'g', 'box'
}

export interface CorrelatedResource {
  resourceId: string;
  quantity: number;
}

export interface Activity extends BaseItem {
  description: string;
  sla: number; // Service Level Agreement in minutes
  tools: CorrelatedResource[];
  materials: CorrelatedResource[];
}

export interface CommonArea {
  id: string;
  client: string;
  location: string;
  subLocation: string;
  environment: string;
  area: number; // in m²
}

export interface TeamMember extends BaseItem {
  role: string;
}

export interface PlannedActivity {
  id: string;
  activityId: string;
  assignedTeamMemberId?: string;
}

export interface WorkPlan {
  id: string;
  commonAreaId: string;
  date: string;
  plannedActivities: PlannedActivity[];
}

// Context Types
export interface AppContextType {
  commonAreas: CommonArea[];
  setCommonAreas: React.Dispatch<React.SetStateAction<CommonArea[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  tools: Resource[];
  setTools: React.Dispatch<React.SetStateAction<Resource[]>>;
  materials: Resource[];
  setMaterials: React.Dispatch<React.SetStateAction<Resource[]>>;
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  workPlans: WorkPlan[];
  setWorkPlans: React.Dispatch<React.SetStateAction<WorkPlan[]>>;
}