
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
  sla: number; // Fixed SLA in minutes
  slaCoefficient?: number; // SLA in minutes per m²
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

export type Sector = 'A&B' | 'Recepção' | 'Manutenção' | 'Áreas Comuns' | 'Outros';
export type ContractType = 'Efetivo' | 'Intermitente';
export type WorkSchedule = '5x2' | '6x1' | '12x36' | 'Flexível' | 'Outro';

export interface TeamMember extends BaseItem {
  role: string;
  sector: Sector;
  isActive: boolean;
  
  // Contract & Schedule
  contractType?: ContractType;
  workSchedule?: WorkSchedule;
  cbo?: string;
  maxWeeklyHours?: number;
  monthlyHoursTarget?: number;
  
  notes?: string;
}

// Alterado para string para permitir valores como "Cada 3 dias"
export type Periodicity = 'Diário' | 'Semanal' | 'Quinzenal' | 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual' | string;

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
