import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import { AppContext } from "../context/AppContext";
import useLocalStorage from "../hooks/useLocalStorage";
import { CommonArea, Activity, Resource, TeamMember, WorkPlan, ScheduledActivity } from "@shared/types";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [commonAreas, setCommonAreas] = useLocalStorage<CommonArea[]>('commonAreas', []);
  const [activities, setActivities] = useLocalStorage<Activity[]>('activities', []);
  const [tools, setTools] = useLocalStorage<Resource[]>('tools', []);
  const [materials, setMaterials] = useLocalStorage<Resource[]>('materials', []);
  const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>('teamMembers', []);
  const [workPlans, setWorkPlans] = useLocalStorage<WorkPlan[]>('workPlans', []);
  const [scheduledActivities, setScheduledActivities] = useLocalStorage<ScheduledActivity[]>('scheduledActivities', []);

  return (
    <AppContext.Provider value={{
      commonAreas, setCommonAreas,
      activities, setActivities,
      tools, setTools,
      materials, setMaterials,
      teamMembers, setTeamMembers,
      workPlans, setWorkPlans,
      scheduledActivities, setScheduledActivities
    }}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AppContext.Provider>
  );
}
