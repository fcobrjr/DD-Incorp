
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { TeamMember, Sector, ContractType, WorkSchedule } from '../types';
import { EditIcon, TrashIcon, PlusIcon, FilterIcon } from '../components/icons';

const SECTORS: Sector[] = ['Governança', 'A&B', 'Recepção', 'Manutenção', 'Áreas Comuns', 'Outros'];
const CONTRACT_TYPES: ContractType[] = ['Efetivo', 'Intermitente'];

const SECTOR_COLORS: { [key in Sector]: string } = {
  'Governança': 'bg-purple-100 text-purple-800 border-purple-200',
  'A&B': 'bg-orange-100 text-orange-800 border-orange-200',
  'Recepção': 'bg-blue-100 text-blue-800 border-blue-200',
  'Manutenção': 'bg-gray-100 text-gray-800 border-gray-200',
  'Áreas Comuns': 'bg-green-100 text-green-800 border-green-200',
  'Outros': 'bg-gray-50 text-gray-600 border-gray-200'
};

const Team: React.FC = () => {
  const { teamMembers, setTeamMembers } = useContext(AppContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<TeamMember | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', sector: '', status: 'Ativos' });

  const [formState, setFormState] = useState<Omit<TeamMember, 'id'>>({
    name: '', role: '', sector: 'Áreas Comuns', isActive: true, contractType: 'Efetivo'
  });

  const openModal = (item: TeamMember | null = null) => {
    setCurrentItem(item);
    setFormState(item ? { ...item } : { name: '', role: '', sector: 'Áreas Comuns', isActive: true, contractType: 'Efetivo' });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setCurrentItem(null); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(m => {
        if (filters.search && !m.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.sector && m.sector !== filters.sector) return false;
        if (filters.status === 'Ativos' && !m.isActive) return false;
        return true;
    });
  }, [teamMembers, filters]);

  return (
    <div className="p-8">
      <PageHeader title="Equipes">
        <button onClick={() => openModal()} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow-sm transition-colors"><PlusIcon className="w-5 h-5 mr-2" />Novo Colaborador</button>
      </PageHeader>

      <div className="mb-6 flex justify-end">
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-200 hover:text-primary-600'}`}><FilterIcon className="w-5 h-5 mr-2" />Filtros</button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.length > 0 ? filteredMembers.map(member => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{member.isActive ? 'Ativo' : 'Inativo'}</span></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                <td className="px-6 py-4"><span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded border ${SECTOR_COLORS[member.sector] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>{member.sector}</span></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-1">
                    <button onClick={() => openModal(member)} className="text-primary-600 hover:bg-primary-100 p-2 rounded-full transition-colors"><EditIcon className="w-5 h-5"/></button>
                  </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">Nenhum colaborador encontrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-2xl">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentItem ? 'Editar' : 'Novo'} Colaborador</h3>
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-x-4">
                <button type="button" onClick={closeModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">Cancelar</button>
                <button type="button" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
