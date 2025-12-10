
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

export type Sector = 'Governança' | 'A&B' | 'Recepção' | 'Manutenção' | 'Áreas Comuns' | 'Outros';
export type ContractType = 'Efetivo' | 'Intermitente';
export type WorkSchedule = '5x2' | '6x1' | '12x36' | 'Flexível' | 'Outro';

export interface WeeklyHistory {
    week: string; // e.g., "2025-48"
    hours: number;
    predominantShift?: string; // e.g., "Manhã", "Tarde"
}

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
  
  // Governance Specifics
  cleaningSpeedVacantDirty?: number; // Minutes per room (Vago Sujo)
  cleaningSpeedStay?: number; // Minutes per room (Estada)
  governanceMaxWeeklyHours?: number; // Specific override for governance
  operationalRestrictions?: string;
  unavailableDays?: string[]; // List of days e.g., 'Domingo', 'Segunda-feira'
  
  // History & Planning
  historyWeeks?: WeeklyHistory[];
  lastFullOffWeek?: string; // ISO Date or Week string
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

export interface GovernanceParameters {
  // 1. Tempos Médios
  defaultCleaningSpeedVacantDirty: number;
  defaultCleaningSpeedStay: number;

  // 2. Regras Feriados
  holidayDemandMultiplier: number;
  holidayEveDemandMultiplier: number;
  allowIntermittentOnHolidays: boolean;
  preferEffectiveOnHolidays: boolean;
  holidayNotes: string;

  // 3. Regras Intermitentes
  intermittentMinWeeklyHours: number;
  intermittentMaxWeeklyHours: number;
  intermittentMaxConsecutiveDays: number;
  intermittentWeeksInterval: number; // semanas de descanso entre convocações
  intermittentMandatoryOffWeeks: number; // a cada X semanas

  // 4. Alternância
  maxShiftRepetitionPercentage: number;
  maxDayShiftRepetitionPercentage: number;
  alternationMode: 'Conservador' | 'Flexível';

  // 5. Regime Operacional
  totalApartments: number; // Quantidade total de apartamentos do hotel
  standardShiftDuration: number;
  efficiencyTarget: number; // percentage (0-100)
  sundayRotationRatio: number; // 1 every X weeks

  // 6. Campo Livre
  customRules: string;
}

// --- Governance Planning Types ---

export type DayType = 'Normal' | 'Feriado' | 'Véspera';

export interface DailyOperationalData {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  occupancy: number; // %
  uhOccupied?: number; // Quantidade absoluta de quartos ocupados
  vacantDirty: number;
  stay: number;
  dayType: DayType;
}

export interface DailyDemand {
  date: string;
  totalMinutes: number; // Raw workload
  adjustedMinutes: number; // After holiday multipliers
  totalHours: number; // adjustedMinutes / 60
  requiredHoursWithEfficiency: number; // totalHours / (efficiency/100)
  requiredMaids: number; // requiredHoursWithEfficiency / shiftDuration
}

export interface GovernanceWeeklyPlan {
  id: string;
  weekStartDate: string; // Monday YYYY-MM-DD
  weekEndDate: string; // Sunday YYYY-MM-DD
  weeklyMaintenanceRooms?: number; // Quartos fora de serviço na semana (Valor Único)
  days: DailyOperationalData[];
  calculatedDemand?: DailyDemand[];
  updatedAt?: string;
}

// --- Governance Scheduling Types ---

export interface ScheduleShift {
  id: string;
  teamMemberId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakDuration: number; // minutes
  totalHours: number;
  activity: string; // e.g., 'Limpeza UH'
  type?: 'Manhã' | 'Tarde' | 'Noite' | 'Intermediário';
  breakStartTime?: string; // HH:mm
  breakEndTime?: string; // HH:mm
  observation?: string;
}

export interface GovernanceSchedule {
  id: string;
  weekStartDate: string;
  shifts: ScheduleShift[];
  updatedAt: string;
}

// --- Governance Convocation Types ---
export type ConvocationStatus = 'Pendente' | 'Aceita' | 'Recusada' | 'Expirada';

export interface Convocation {
  id: string;
  scheduleId: string;
  shiftId: string;
  teamMemberId: string;
  shiftDate: string; // YYYY-MM-DD
  shiftStartTime: string;
  shiftEndTime: string;
  sentAt: string; // ISO String
  deadlineAt: string; // ISO String (>= 72h before shift)
  respondedAt?: string; // ISO String
  status: ConvocationStatus;
  operationalJustification?: string;
  rejectionReason?: string;
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
  governanceParameters: GovernanceParameters;
  setGovernanceParameters: Dispatch<SetStateAction<GovernanceParameters>>;
  governanceWeeklyPlans: GovernanceWeeklyPlan[];
  setGovernanceWeeklyPlans: Dispatch<SetStateAction<GovernanceWeeklyPlan[]>>;
  governanceSchedules: GovernanceSchedule[];
  setGovernanceSchedules: Dispatch<SetStateAction<GovernanceSchedule[]>>;
  governanceConvocations: Convocation[];
  setGovernanceConvocations: Dispatch<SetStateAction<Convocation[]>>;
}
