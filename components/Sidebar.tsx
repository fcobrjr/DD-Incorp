
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, ActivityIcon, ToolIcon, MaterialIcon, TeamIcon, PlanIcon } from './icons';

const navigation = [
  { name: 'Áreas Comuns', href: '/', icon: HomeIcon },
  { name: 'Planejamento', href: '/planning', icon: PlanIcon },
  { name: 'Atividades', href: '/activities', icon: ActivityIcon },
  { name: 'Equipamentos', href: '/tools', icon: ToolIcon },
  { name: 'Materiais', href: '/materials', icon: MaterialIcon },
  { name: 'Equipes', href: '/team', icon: TeamIcon },
];

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary-600">Planner</h1>
        <p className="text-sm text-gray-500">Gestão de Áreas Comuns</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
