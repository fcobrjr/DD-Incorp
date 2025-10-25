// FIX: Import Dispatch and SetStateAction from 'react' to resolve type errors.
import type { Dispatch, SetStateAction } from 'react';

export interface BaseItem {
  id: string;
  name: string;
}

export interface Resource extends BaseItem {
  unit: string; // e.g., 'unit', 'ml', 'g', 'box'
  coefficientM2?: number; // Amount of the unit per square meter
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

export type Periodicity = 'Diário' | 'Semanal' | 'Quinzenal' | 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';

export interface PlannedActivity {
  id: string;
  activityId: string;
  periodicity: Periodicity;
}

export interface WorkPlan {
  id: string;
  commonAreaId: string;
  plannedActivities: PlannedActivity[];
}

export interface ScheduledActivity {
  id: string;
  workPlanId: string;
  plannedActivityId: string;
  plannedDate: string; // ISO date string 'YYYY-MM-DD'
  executionDate: string | null; // ISO date string 'YYYY-MM-DD'
  operatorId?: string;
}


// Context Types
export interface AppContextType {
  commonAreas: CommonArea[];
  setCommonAreas: Dispatch<SetStateAction<CommonArea[]>>;
  activities: Activity[];
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  tools: Resource[];
  setTools: Dispatch<SetStateAction<Resource[]>>;
  materials: Resource[];
  setMaterials: Dispatch<SetStateAction<Resource[]>>;
  teamMembers: TeamMember[];
  setTeamMembers: Dispatch<SetStateAction<TeamMember[]>>;
  workPlans: WorkPlan[];
  setWorkPlans: Dispatch<SetStateAction<WorkPlan[]>>;
  scheduledActivities: ScheduledActivity[];
  setScheduledActivities: Dispatch<SetStateAction<ScheduledActivity[]>>;
}