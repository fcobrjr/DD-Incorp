import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppContext } from './context/AppContext';
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
import { CommonArea, Activity, Resource, TeamMember, WorkPlan, ScheduledActivity, GovernanceParameters as GovernanceParametersType, GovernanceWeeklyPlan, GovernanceSchedule as GovernanceScheduleType, Convocation } from '@shared/types';
import { 
  DEFAULT_GOVERNANCE_PARAMETERS
} from './data/sampleData';

const App: React.FC = () => {
  const [commonAreas, setCommonAreas] = useLocalStorage<CommonArea[]>('commonAreas', []);
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', []);
  const [tools, setTools] = useLocalStorage<Resource[]>('tools', []);
  const [materials, setMaterials] = useLocalStorage<Resource[]>('materials', []);
  const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>('teamMembers', []);
  const [workPlans, setWorkPlans] = useLocalStorage<WorkPlan[]>('workPlans', []);
  const [scheduledActivities, setScheduledActivities] = useLocalStorage<ScheduledActivity[]>('scheduledActivities', []);
  const [governanceParameters, setGovernanceParameters] = useLocalStorage<GovernanceParametersType>('governanceParameters', DEFAULT_GOVERNANCE_PARAMETERS);
  const [governanceWeeklyPlans, setGovernanceWeeklyPlans] = useLocalStorage<GovernanceWeeklyPlan[]>('governanceWeeklyPlans', []);
  const [governanceSchedules, setGovernanceSchedules] = useLocalStorage<GovernanceScheduleType[]>('governanceSchedules', []);
  const [governanceConvocations, setGovernanceConvocations] = useLocalStorage<Convocation[]>('governanceConvocations', []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AppContext.Provider value={{
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
    }}>
      <HashRouter>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<CommonAreas />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/team" element={<Team />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/daily-work-orders" element={<DailyWorkOrders />} />
              <Route path="/governance-parameters" element={<GovernanceParameters />} />
              <Route path="/governance-planning" element={<GovernancePlanning />} />
              <Route path="/governance-schedule" element={<GovernanceSchedule />} />
              <Route path="/governance-convocations" element={<GovernanceConvocation />} />
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
