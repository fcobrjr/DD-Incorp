
import React, { createContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CommonAreas from './pages/CommonAreas';
import Activities from './pages/Activities';
import Tools from './pages/Tools';
import Materials from './pages/Materials';
import Team from './pages/Team';
import Planning from './pages/Planning';
import useLocalStorage from './hooks/useLocalStorage';
import { AppContextType, CommonArea, Activity, Resource, TeamMember, WorkPlan } from './types';

export const AppContext = createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const [commonAreas, setCommonAreas] = useLocalStorage<CommonArea[]>('commonAreas', []);
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', []);
  const [tools, setTools] = useLocalStorage<Resource[]>('tools', []);
  const [materials, setMaterials] = useLocalStorage<Resource[]>('materials', []);
  const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>('teamMembers', []);
  const [workPlans, setWorkPlans] = useLocalStorage<WorkPlan[]>('workPlans', []);

  const contextValue: AppContextType = {
    commonAreas, setCommonAreas,
    activities, setActivities,
    tools, setTools,
    materials, setMaterials,
    teamMembers, setTeamMembers,
    workPlans, setWorkPlans
  };

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<CommonAreas />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/team" element={<Team />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
