
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { TeamMember, Sector, ContractType, WorkSchedule } from '../types';
import { EditIcon, TrashIcon, PlusIcon, FilterIcon } from '../components/icons';

const SECTORS: Sector[] = ['Governança', 'A&B', 'Recepção', 'Manutenção', 'Áreas Comuns', 'Outros'];
const CONTRACT_TYPES: ContractType[] = ['Efetivo', 'Intermitente'];
const WORK_SCHEDULES: WorkSchedule[] = ['5x2', '6x1', '12x36', 'Flexível', 'Outro'];
const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

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
  
  const [formState, setFormState] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    role: '',
    sector: 'Áreas Comuns',
    isActive: true,
    contractType: 'Efetivo',
    cbo: '',
    workSchedule: '6x1',
    maxWeeklyHours: 44,
    monthlyHoursTarget: 220,
    cleaningSpeedVacantDirty: 25,
    cleaningSpeedStay: 10,
    governanceMaxWeeklyHours: undefined,
    operationalRestrictions: '',
    unavailableDays: [],
    historyWeeks: [],
    lastFullOffWeek: '',
    notes: ''
  });

  const [filterSector, setFilterSector] = useState<string>('');

  const openModal = (item: TeamMember | null = null) => {
    setCurrentItem(item);
    if (item) {
      setFormState({
        name: item.name,
        role: item.role,
        sector: item.sector,
        isActive: item.isActive,
        contractType: item.contractType || 'Efetivo',
        cbo: item.cbo || '',
        workSchedule: item.workSchedule || '6x1',
        maxWeeklyHours: item.maxWeeklyHours || 44,
        monthlyHoursTarget: item.monthlyHoursTarget || 220,
        cleaningSpeedVacantDirty: item.cleaningSpeedVacantDirty || 25,
        cleaningSpeedStay: item.cleaningSpeedStay || 10,
        governanceMaxWeeklyHours: item.governanceMaxWeeklyHours,
        operationalRestrictions: item.operationalRestrictions || '',
        unavailableDays: item.unavailableDays || [],
        historyWeeks: item.historyWeeks || [],
        lastFullOffWeek: item.lastFullOffWeek || '',
        notes: item.notes || ''
      });
    } else {
      setFormState({
        name: '',
        role: '',
        sector: 'Governança',
        isActive: true,
        contractType: 'Efetivo',
        cbo: '',
        workSchedule: '6x1',
        maxWeeklyHours: 44,
        monthlyHoursTarget: 220,
        cleaningSpeedVacantDirty: 25,
        cleaningSpeedStay: 10,
        governanceMaxWeeklyHours: undefined,
        operationalRestrictions: '',
        unavailableDays: [],
        historyWeeks: [],
        lastFullOffWeek: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && name === 'isActive') {
         setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setFormState(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };

  const toggleDay = (day: string) => {
    setFormState(prev => {
        const currentDays = prev.unavailableDays || [];
        if (currentDays.includes(day)) {
            return { ...prev, unavailableDays: currentDays.filter(d => d !== day) };
        } else {
            return { ...prev, unavailableDays: [...currentDays, day] };
        }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem) {
      setTeamMembers(prev => prev.map(t => t.id === currentItem.id ? { ...formState, id: currentItem.id } : t));
    } else {
      setTeamMembers(prev => [...prev, { ...formState, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir este colaborador?')) {
        setTeamMembers(prev => prev.filter(t => t.id !== id));
    }
  };

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
        if (filterSector && member.sector !== filterSector) return false;
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [teamMembers, filterSector]);

  return (
    <div className="p-8">
      <PageHeader title="Equipes / Colaboradores">
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Colaborador
        </button>
      </PageHeader>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
        <div className="flex items-center text-gray-500">
            <FilterIcon className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Filtros:</span>
        </div>
        <div>
            <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="block w-48 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
                <option value="">Todos os Setores</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        {filterSector && (
             <button onClick={() => setFilterSector('')} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Limpar
            </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome / CBO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor / Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato / Jornada</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.length > 0 ? filteredMembers.map(member => (
              <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${!member.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {member.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    {member.cbo && <div className="text-xs text-gray-500">CBO: {member.cbo}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex flex-col items-start space-y-1">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${SECTOR_COLORS[member.sector] || 'bg-gray-100 text-gray-700'}`}>
                            {member.sector}
                        </span>
                        <span className="text-sm text-gray-600">{member.role}</span>
                     </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                        <span className="font-medium">{member.contractType || '—'}</span>
                        <span className="text-xs text-gray-400">{member.workSchedule} • {member.maxWeeklyHours}h/sem</span>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-1">
                    <button onClick={() => openModal(member)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors" title="Editar"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(member.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors" title="Excluir"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                        {filterSector ? `Nenhum colaborador encontrado no setor de ${filterSector}.` : 'Nenhum colaborador cadastrado.'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10">
                <h3 className="text-xl font-semibold text-gray-900">{currentItem ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Fechar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-8">
                
                {/* 1. Dados Básicos */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">Dados Pessoais & Função</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="md:col-span-2 flex items-start space-x-4">
                            <div className="flex-grow">
                                <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Nome Completo <span className="text-red-500">*</span></label>
                                <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                            </div>
                             <div className="flex items-center h-full pt-8">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" checked={formState.isActive} onChange={handleInputChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">{formState.isActive ? 'Ativo' : 'Inativo'}</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="sector" className="block text-sm font-medium leading-6 text-gray-900">Setor <span className="text-red-500">*</span></label>
                            <select id="sector" name="sector" value={formState.sector} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required>
                                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">Função / Cargo <span className="text-red-500">*</span></label>
                            <input type="text" id="role" name="role" value={formState.role} onChange={handleInputChange} placeholder={formState.sector === 'Governança' ? 'Ex: Camareira' : 'Ex: Recepcionista'} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                        </div>
                        <div>
                            <label htmlFor="cbo" className="block text-sm font-medium leading-6 text-gray-900">CBO</label>
                            <input type="text" id="cbo" name="cbo" value={formState.cbo} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>
                </div>

                {/* 2. Contrato & Jornada */}
                <div>
                     <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">Contrato & Jornada</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label htmlFor="contractType" className="block text-sm font-medium leading-6 text-gray-900">Tipo de Contrato <span className="text-red-500">*</span></label>
                            <select id="contractType" name="contractType" value={formState.contractType} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="workSchedule" className="block text-sm font-medium leading-6 text-gray-900">Regime de Trabalho <span className="text-red-500">*</span></label>
                            <select id="workSchedule" name="workSchedule" value={formState.workSchedule} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                {WORK_SCHEDULES.map(ws => <option key={ws} value={ws}>{ws}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="maxWeeklyHours" className="block text-sm font-medium leading-6 text-gray-900">Carga Horária Semanal (Máx)</label>
                            <input type="number" id="maxWeeklyHours" name="maxWeeklyHours" value={formState.maxWeeklyHours} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                        </div>
                        <div>
                            <label htmlFor="monthlyHoursTarget" className="block text-sm font-medium leading-6 text-gray-900">Meta Mensal (Horas)</label>
                            <input type="number" id="monthlyHoursTarget" name="monthlyHoursTarget" value={formState.monthlyHoursTarget} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                        </div>
                     </div>
                </div>

                {/* 3. Específico de Governança (Conditional) */}
                {formState.sector === 'Governança' && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center mb-4 border-b border-purple-200 pb-2">
                             <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wider flex-1">Específico Governança</h4>
                             <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Parâmetros de Produtividade</span>
                        </div>
                       
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="cleaningSpeedVacantDirty" className="block text-sm font-medium leading-6 text-purple-900">Tempo Limpeza - Vago Sujo (min)</label>
                                <input type="number" id="cleaningSpeedVacantDirty" name="cleaningSpeedVacantDirty" value={formState.cleaningSpeedVacantDirty} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-purple-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
                                <p className="text-xs text-purple-600 mt-1">Sugerido: 25 min</p>
                            </div>
                            <div>
                                <label htmlFor="cleaningSpeedStay" className="block text-sm font-medium leading-6 text-purple-900">Tempo Limpeza - Estada (min)</label>
                                <input type="number" id="cleaningSpeedStay" name="cleaningSpeedStay" value={formState.cleaningSpeedStay} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-purple-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
                                <p className="text-xs text-purple-600 mt-1">Sugerido: 10 min</p>
                            </div>
                             <div>
                                <label htmlFor="governanceMaxWeeklyHours" className="block text-sm font-medium leading-6 text-purple-900">Carga Horária Gov. (Opcional)</label>
                                <input type="number" id="governanceMaxWeeklyHours" name="governanceMaxWeeklyHours" value={formState.governanceMaxWeeklyHours || ''} onChange={handleInputChange} placeholder="Mesmo do contrato se vazio" className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-purple-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6" />
                            </div>
                            
                            <div className="md:col-span-3">
                                <label htmlFor="operationalRestrictions" className="block text-sm font-medium leading-6 text-purple-900">Restrições Operacionais</label>
                                <textarea id="operationalRestrictions" name="operationalRestrictions" value={formState.operationalRestrictions} onChange={handleInputChange} rows={2} placeholder="Ex: Não trabalha no turno da noite; Não pode carregar peso excessivo..." className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-purple-300 focus:ring-2 focus:ring-inset focus:ring-purple-600 sm:text-sm sm:leading-6"></textarea>
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-purple-900 mb-2">Dias Indisponíveis / Preferência de Folga</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button 
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                                                (formState.unavailableDays || []).includes(day)
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-purple-50'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Clique para marcar os dias em que o colaborador <strong>não pode</strong> trabalhar.</p>
                            </div>
                        </div>
                    </div>
                )}

                 {/* 4. Dados para Escala (Histórico) */}
                 <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">Dados para Escala (Histórico)</h4>
                    
                    {formState.contractType === 'Intermitente' && (
                        <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-amber-700">
                                        <strong>Atenção para Intermitentes:</strong> É crucial manter o histórico de convocações e garantir períodos de inatividade para evitar descaracterização do contrato.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label htmlFor="lastFullOffWeek" className="block text-sm font-medium leading-6 text-gray-900">Última Semana de Folga Completa</label>
                             <input type="month" id="lastFullOffWeek" name="lastFullOffWeek" value={formState.lastFullOffWeek} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                             <p className="text-xs text-gray-500 mt-1">Referência para cálculo de descanso obrigatório.</p>
                        </div>
                        
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">Histórico Recente (Visualização)</label>
                             <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                                {formState.historyWeeks && formState.historyWeeks.length > 0 ? (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semana</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno Predominante</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {formState.historyWeeks.map((hw, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{hw.week}</td>
                                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{hw.hours}h</td>
                                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{hw.predominantShift || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        Nenhum histórico registrado ainda. Os dados serão populados automaticamente pelo motor de escalas.
                                    </div>
                                )}
                             </div>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">Observações Gerais</label>
                            <textarea id="notes" name="notes" value={formState.notes} onChange={handleInputChange} rows={3} className="mt-2 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"></textarea>
                        </div>
                    </div>
                 </div>

              </div>
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-x-4 bg-white sticky bottom-0">
                <button type="button" onClick={closeModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Salvar Colaborador</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
