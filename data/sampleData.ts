import { Resource, TeamMember, CommonArea, Activity, WorkPlan } from '../types';

// --- BASE RESOURCES ---
export const SAMPLE_TOOLS: Resource[] = [
  { id: 'tool-1', name: 'MOP Industrial', unit: 'un' },
  { id: 'tool-2', name: 'Balde com Espremedor', unit: 'un' },
  { id: 'tool-3', name: 'Rodo Limpa Vidros', unit: 'kit' },
  { id: 'tool-4', name: 'Aspirador de Pó Profissional', unit: 'un' },
];

export const SAMPLE_MATERIALS: Resource[] = [
  { id: 'mat-1', name: 'Limpador Multiuso', unit: 'L' },
  { id: 'mat-2', name: 'Desinfetante Hospitalar', unit: 'L' },
  { id: 'mat-3', name: 'Pano de Microfibra', unit: 'un' },
  { id: 'mat-4', name: 'Saco de Lixo 100L', unit: 'un' },
];

// FIX: Corrected typo in variable name.
export const SAMPLE_TEAM_MEMBERS: TeamMember[] = [
  { id: 'team-1', name: 'João da Silva', role: 'Agente de Limpeza' },
  { id: 'team-2', name: 'Maria Oliveira', role: 'Supervisora' },
  { id: 'team-3', name: 'Carlos Pereira', role: 'Agente de Limpeza' },
];

// --- CORE ENTITIES ---
export const SAMPLE_COMMON_AREAS: CommonArea[] = [
  {
    id: 'area-1',
    client: 'Grand Hotel Central',
    location: 'Térreo',
    subLocation: 'Entrada Principal',
    environment: 'Lobby de Hotel',
    area: 120,
  },
  {
    id: 'area-2',
    client: 'TechCorp Edifício Coorporativo',
    location: '5º Andar',
    subLocation: 'Ala Norte',
    environment: 'Cozinha Coorporativa',
    area: 45,
  },
  {
    id: 'area-3',
    client: 'Grand Hotel Central',
    location: '1º Andar',
    subLocation: 'Corredor Leste',
    environment: 'Corredor de Quartos',
    area: 80,
  },
];

export const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    name: 'Limpeza e Polimento de Piso',
    description: 'Lavar o piso do lobby com MOP industrial e limpador multiuso.',
    sla: 90,
    tools: [{ resourceId: 'tool-1', quantity: 1 }, { resourceId: 'tool-2', quantity: 1 }],
    materials: [{ resourceId: 'mat-1', quantity: 0.5 }],
  },
  {
    id: 'act-2',
    name: 'Higienização de Superfícies na Cozinha',
    description: 'Limpar e desinfetar todas as bancadas, mesas e micro-ondas.',
    sla: 30,
    tools: [],
    materials: [{ resourceId: 'mat-2', quantity: 0.2 }, { resourceId: 'mat-3', quantity: 3 }],
  },
  {
    id: 'act-3',
    name: 'Limpeza de Vidros e Espelhos',
    description: 'Limpar todas as janelas e espelhos do lobby.',
    sla: 45,
    tools: [{ resourceId: 'tool-3', quantity: 1 }],
    materials: [{ resourceId: 'mat-1', quantity: 0.3 }, { resourceId: 'mat-3', quantity: 2 }],
  },
  {
    id: 'act-4',
    name: 'Recolhimento de Lixo',
    description: 'Esvaziar todas as lixeiras e substituir os sacos.',
    sla: 15,
    tools: [],
    materials: [{ resourceId: 'mat-4', quantity: 5 }],
  },
];

// --- PLANNING ---
const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);

export const SAMPLE_WORK_PLANS: WorkPlan[] = [
  {
    id: 'plan-1',
    commonAreaId: 'area-1', // Grand Hotel Central Lobby
    date: today.toISOString(),
    plannedActivities: [
      {
        id: 'pa-1',
        activityId: 'act-1', // Limpeza de Piso
        assignedTeamMemberId: 'team-1', // João da Silva
      },
      {
        id: 'pa-2',
        activityId: 'act-3', // Limpeza de Vidros
        assignedTeamMemberId: 'team-3', // Carlos Pereira
      },
    ],
  },
  {
    id: 'plan-2',
    commonAreaId: 'area-2', // TechCorp Cozinha
    date: tomorrow.toISOString(),
    plannedActivities: [
        {
            id: 'pa-3',
            activityId: 'act-2', // Higienização de Superfícies
            assignedTeamMemberId: 'team-1' // João da Silva
        },
        {
            id: 'pa-4',
            activityId: 'act-4', // Recolhimento de lixo
            assignedTeamMemberId: 'team-1' // João da Silva
        }
    ]
  }
];
