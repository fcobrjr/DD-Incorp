
import React, { createContext, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CommonAreas from './pages/CommonAreas';
import Activities from './pages/Activities';
import Tools from './pages/Tools';
import Materials from './pages/Materials';
import Team from './pages/Team';
import Planning from './pages/Planning';
import Schedule from './pages/Schedule';
import DailyWorkOrders from './pages/DailyWorkOrders';
import GovernanceParameters from './pages/GovernanceParameters';
import GovernancePlanning from './pages/GovernancePlanning';
import GovernanceSchedule from './pages/GovernanceSchedule';
import GovernanceConvocation from './pages/GovernanceConvocation';
import ConvocationResponse from './pages/ConvocationResponse';
import Blueprint from './pages/Blueprint';
import useLocalStorage from './hooks/useLocalStorage';
import { AppContextType, CommonArea, Activity, Resource, TeamMember, WorkPlan, ScheduledActivity, GovernanceParameters as GovernanceParametersType, GovernanceWeeklyPlan, GovernanceSchedule as GovernanceScheduleType, Convocation } from './types';
import { 
  SAMPLE_COMMON_AREAS,
  SAMPLE_ACTIVITIES,
  SAMPLE_TOOLS,
  SAMPLE_MATERIALS,
  SAMPLE_TEAM_MEMBERS,
  SAMPLE_WORK_PLANS,
  SAMPLE_SCHEDULED_ACTIVITIES,
  DEFAULT_GOVERNANCE_PARAMETERS,
  SAMPLE_GOVERNANCE_WEEKLY_PLANS,
  SAMPLE_CONVOCATIONS
} from './data/sampleData';

export const AppContext = createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const [commonAreas, setCommonAreas] = useLocalStorage<CommonArea[]>('commonAreas', SAMPLE_COMMON_AREAS);
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', SAMPLE_ACTIVITIES);
  const [tools, setTools] = useLocalStorage<Resource[]>('tools', SAMPLE_TOOLS);
  const [materials, setMaterials] = useLocalStorage<Resource[]>('materials', SAMPLE_MATERIALS);
  const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>('teamMembers', SAMPLE_TEAM_MEMBERS);
  const [workPlans, setWorkPlans] = useLocalStorage<WorkPlan[]>('workPlans', SAMPLE_WORK_PLANS);
  const [scheduledActivities, setScheduledActivities] = useLocalStorage<ScheduledActivity[]>('scheduledActivities', SAMPLE_SCHEDULED_ACTIVITIES);
  const [governanceParameters, setGovernanceParameters] = useLocalStorage<GovernanceParametersType>('governanceParameters', DEFAULT_GOVERNANCE_PARAMETERS);
  const [governanceWeeklyPlans, setGovernanceWeeklyPlans] = useLocalStorage<GovernanceWeeklyPlan[]>('governanceWeeklyPlans', SAMPLE_GOVERNANCE_WEEKLY_PLANS);
  const [governanceSchedules, setGovernanceSchedules] = useLocalStorage<GovernanceScheduleType[]>('governanceSchedules', []);
  const [governanceConvocations, setGovernanceConvocations] = useLocalStorage<Convocation[]>('governanceConvocations', SAMPLE_CONVOCATIONS);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const contextValue: AppContextType = {
    commonAreas, setCommonAreas,
    activities, setActivities,
    tools, setTools,
    materials, setMaterials,
    teamMembers, setTeamMembers,
    workPlans, setWorkPlans,
    scheduledActivities, setScheduledActivities,
    governanceParameters, setGovernanceParameters,
    governanceWeeklyPlans, setGovernanceWeeklyPlans,
    governanceSchedules, setGovernanceSchedules,
    governanceConvocations, setGovernanceConvocations
  };

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="flex h-screen bg-gray-100">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<CommonAreas />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/daily-work-orders" element={<DailyWorkOrders />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/team" element={<Team />} />
              <Route path="/governance-parameters" element={<GovernanceParameters />} />
              <Route path="/governance-planning" element={<GovernancePlanning />} />
              <Route path="/governance-schedule" element={<GovernanceSchedule />} />
              <Route path="/governance-convocations" element={<GovernanceConvocation />} />
              {/* Rota pública (simulada) para resposta do colaborador */}
              <Route path="/convocation-response/:id" element={<ConvocationResponse />} />
              <Route path="/blueprint" element={<Blueprint />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
