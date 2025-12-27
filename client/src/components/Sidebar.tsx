import React from 'react';
import { Link, useLocation } from 'wouter';
import { HomeIcon, ActivityIcon, ToolIcon, MaterialIcon, TeamIcon, PlanIcon, CalendarIcon, MenuIcon, MapIcon, ClipboardListIcon, LogOutIcon } from './icons';
import { useAuth } from '../hooks/use-auth';

const navigation = [
  { name: 'Áreas Comuns', href: '/', icon: HomeIcon },
  { name: 'Planejamento', href: '/planning', icon: PlanIcon },
  { name: 'Agenda', href: '/schedule', icon: CalendarIcon },
  { name: 'OS Diária', href: '/daily-work-orders', icon: ClipboardListIcon },
  { name: 'Atividades', href: '/activities', icon: ActivityIcon },
  { name: 'Equipamentos', href: '/tools', icon: ToolIcon },
  { name: 'Materiais', href: '/materials', icon: MaterialIcon },
  { name: 'Equipes', href: '/team', icon: TeamIcon },
  { name: 'Blueprint', href: '/blueprint', icon: MapIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();

  return (
    <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`p-4 border-b border-gray-200 flex items-center h-20 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div>
            <h1 className="text-2xl font-bold text-primary-600">Planner</h1>
            <p className="text-sm text-gray-500">Gestão de Áreas Comuns</p>
          </div>
        )}
        <button onClick={onToggle} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.href === '/' ? location === '/' : location.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${isCollapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && user && (
          <div className="mb-3 text-sm text-gray-600">
            <span className="font-medium">{user.name}</span>
          </div>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          title={isCollapsed ? 'Sair' : undefined}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOutIcon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && 'Sair'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
