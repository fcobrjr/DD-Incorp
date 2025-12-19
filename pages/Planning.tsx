
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { WorkPlan, PlannedActivity, Periodicity, Activity, CorrelatedResource } from '../types';
import { TrashIcon, EditIcon, PlusIcon, LayoutGridIcon, ListIcon, FilterIcon } from '../components/icons';
import PageHeader from '../components/PageHeader';
import InfoTooltip from '../components/InfoTooltip';
import SearchableSelect from '../components/SearchableSelect';

const PERIODICITY_OPTIONS: string[] = ['Diário', 'Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];

const PERIODICITY_COLOR_CONFIG: { [key: string]: { text: string; bg: string; } } = {
    'Diário': { text: 'text-blue-800', bg: 'bg-blue-100' },
    'Semanal': { text: 'text-orange-800', bg: 'bg-orange-100' },
    'Quinzenal': { text: 'text-amber-800', bg: 'bg-amber-100' },
    'Mensal': { text: 'text-yellow-800', bg: 'bg-yellow-100' },
    'Bimestral': { text: 'text-lime-800', bg: 'bg-lime-100' },
    'Trimestral': { text: 'text-green-800', bg: 'bg-green-100' },
    'Semestral': { text: 'text-teal-800', bg: 'bg-teal-100' },
    'Anual': { text: 'text-cyan-800', bg: 'bg-cyan-100' },
};

const getPeriodicityStyle = (p: string) => {
    return PERIODICITY_COLOR_CONFIG[p] || { text: 'text-purple-800', bg: 'bg-purple-100' };
};

const Planning: React.FC = () => {
    const {
        commonAreas,
        activities,
        setActivities,
        tools,
        materials,
        workPlans,
        setWorkPlans
    } = useContext(AppContext)!;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<WorkPlan | null>(null);
    const [formState, setFormState] = useState<WorkPlan | null>(null);
    const [selectedActivityForAdd, setSelectedActivityForAdd] = useState('');
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
    const [activityFormState, setActivityFormState] = useState<Omit<Activity, 'id'>>({ 
      name: '', 
      description: '', 
      sla: 0, 
      slaCoefficient: 0,
      tools: [], 
      materials: [] 
    });

    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        client: '',
        location: '',
        subLocation: '',
        environment: '',
        activityId: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'client') {
                newFilters.location = '';
                newFilters.subLocation = '';
                newFilters.environment = '';
            }
            if (name === 'location') {
                newFilters.subLocation = '';
                newFilters.environment = '';
            }
            if (name === 'subLocation') {
                newFilters.environment = '';
            }
            return newFilters;
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', client: '', location: '', subLocation: '', environment: '', activityId: '' });
    };

    const uniqueClients = useMemo(() => [...new Set(commonAreas.map(a => a.client).filter(Boolean))].sort(), [commonAreas]);

    const openModal = (plan: WorkPlan | null = null) => {
        setCurrentPlan(plan);
        setFormState(plan ? { ...JSON.parse(JSON.stringify(plan)), plannedActivities: plan.plannedActivities || [] } : {
            id: `plan-${Date.now()}`,
            commonAreaId: '',
            plannedActivities: [],
        });
        setSelectedActivityForAdd('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentPlan(null);
        setFormState(null);
    };

    const handleAreaChange = (val: string) => {
        if (!currentPlan) {
            const existingPlan = workPlans.find(p => p.commonAreaId === val);
            if (existingPlan) {
                alert("Já existe um plano para esta Área Comum. Editando o plano existente.");
                setCurrentPlan(existingPlan);
                setFormState({ ...JSON.parse(JSON.stringify(existingPlan)), plannedActivities: existingPlan.plannedActivities || [] });
                return;
            }
        }
        setFormState(prev => prev ? { ...prev, commonAreaId: val } : null);
    };
    
    const addActivityToPlan = (activityId: string) => {
        if (!formState || !activityId || (formState.plannedActivities || []).some(p => p.activityId === activityId)) {
            setSelectedActivityForAdd('');
            return;
        }
        const newPlannedActivity: PlannedActivity = {
            id: `pa-${Date.now()}-${activityId}`,
            activityId,
            periodicity: 'Diário',
        };
        setFormState(prev => prev ? { ...prev, plannedActivities: [...(prev.plannedActivities || []), newPlannedActivity] } : null);
        setSelectedActivityForAdd(''); 
    };

    const removeActivityFromPlan = (plannedActivityId: string) => {
        setFormState(prev => prev ? { ...prev, plannedActivities: (prev.plannedActivities || []).filter(p => p.id !== plannedActivityId) } : null);
    };
    
    const updateActivityPeriodicity = (plannedActivityId: string, periodicity: Periodicity) => {
        setFormState(prev => prev ? {
            ...prev,
            plannedActivities: (prev.plannedActivities || []).map(p => 
                p.id === plannedActivityId ? { ...p, periodicity } : p
            )
        } : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState || !formState.commonAreaId) {
            alert("Por favor, selecione uma Área Comum.");
            return;
        }
        if (currentPlan) {
            setWorkPlans(prev => prev.map(p => p.id === currentPlan.id ? formState : p));
        } else {
             if (workPlans.some(p => p.commonAreaId === formState.commonAreaId)) {
                alert("Já existe um plano para esta Área Comum. Por favor, edite o plano existente.");
                return;
            }
            setWorkPlans(prev => [...prev, formState]);
        }
        closeModal();
    };
    
    const handleDelete = (planId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este plano de trabalho? Todas as tarefas agendadas futuras também serão removidas.")) {
            setWorkPlans(prev => prev.filter(p => p.id !== planId));
        }
    };

    const filteredWorkPlans = useMemo(() => {
        return workPlans.filter(plan => {
            const area = commonAreas.find(a => a.id === plan.commonAreaId);
            if (!area) return false;
            if (filters.search) {
                const term = filters.search.toLowerCase();
                const matches = area.client.toLowerCase().includes(term) || area.location.toLowerCase().includes(term) || area.environment.toLowerCase().includes(term);
                if (!matches) return false;
            }
            if (filters.client && area.client !== filters.client) return false;
            if (filters.activityId && !(plan.plannedActivities || []).some(pa => pa.activityId === filters.activityId)) return false;
            return true;
        });
    }, [workPlans, filters, commonAreas, activities]);

    const flattenedActivities = useMemo(() => {
        return filteredWorkPlans.flatMap(plan =>
            (plan.plannedActivities || []).map(pa => {
                const area = commonAreas.find(ca => ca.id === plan.commonAreaId);
                const activity = activities.find(a => a.id === pa.activityId);
                const sla = (activity?.sla || 0) + (activity?.slaCoefficient ? (activity.slaCoefficient * (area?.area || 0)) : 0);
                return { id: pa.id, periodicity: pa.periodicity, client: area?.client || 'N/A', environment: area?.environment || 'N/A', activityName: activity?.name || 'N/A', activitySla: sla, originalPlan: plan };
            })
        );
    }, [filteredWorkPlans, commonAreas, activities]);

    return (
        <div className="p-8">
            <PageHeader title="Planejamento">
                <div className="flex items-center space-x-2">
                     <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
                        <button onClick={() => setViewMode('card')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}><LayoutGridIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}><ListIcon className="w-5 h-5" /></button>
                    </div>
                    <button onClick={() => openModal()} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none transition-colors duration-150 font-semibold shadow-sm"><PlusIcon className="w-5 h-5 mr-2" />Novo Plano</button>
                </div>
            </PageHeader>
            
            <div className="mb-6 flex justify-end">
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-200 hover:text-primary-600'}`}><FilterIcon className="w-5 h-5 mr-2" />{showFilters ? 'Ocultar Filtros' : 'Filtros e Pesquisa'}</button>
            </div>

            {showFilters && (
                <div className="mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Pesquisa</label>
                            <input type="text" value={filters.search} onChange={handleFilterChange} name="search" placeholder="Termo livre..." className="block w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-primary-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                            <select name="client" value={filters.client} onChange={handleFilterChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 sm:text-sm py-1.5">
                                <option value="">Todos</option>
                                {uniqueClients.map(cli => <option key={cli} value={cli}>{cli}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={clearFilters} className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline px-4 py-2">Limpar filtros</button>
                    </div>
                </div>
            )}

           <div className={viewMode === 'card' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" : ""}>
                {viewMode === 'card' ? (
                    filteredWorkPlans.length > 0 ? filteredWorkPlans.map((plan) => {
                        const area = commonAreas.find(a => a.id === plan.commonAreaId);
                        if (!area) return null;
                        return (
                            <div key={plan.id} className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col transition-all duration-300 hover:shadow-lg overflow-hidden">
                                <div className="p-4 border-b border-gray-100 relative group/header">
                                    <h3 className="font-bold text-gray-900 text-sm">{area.client}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{area.environment}</p>
                                    <div className="absolute top-3 right-2 flex space-x-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(plan)} className="p-1 rounded-full text-primary-600 hover:bg-primary-50"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(plan.id)} className="p-1 rounded-full text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50/50 flex-1 space-y-2 max-h-48 overflow-y-auto">
                                    {(plan.plannedActivities || []).map(pa => (
                                        <div key={pa.id} className="bg-white p-2 rounded border border-gray-100 text-[11px] font-medium text-gray-700">
                                            {activities.find(a => a.id === pa.activityId)?.name}
                                            <span className={`block mt-1 text-[9px] font-bold uppercase ${getPeriodicityStyle(pa.periodicity).text}`}>{pa.periodicity}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-2 border-t border-gray-100 bg-white flex justify-between text-[10px] font-bold text-gray-400">
                                    <span>{plan.plannedActivities.length} Atividades</span>
                                    <span>{area.area}m²</span>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="text-center py-10 text-gray-500 col-span-full">Nenhum plano cadastrado.</div>
                    )
                ) : (
                    <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ambiente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodicidade</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {flattenedActivities.length > 0 ? flattenedActivities.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.client}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.environment}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.activityName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`text-xs font-bold rounded-full px-2 py-1 ${getPeriodicityStyle(item.periodicity).bg} ${getPeriodicityStyle(item.periodicity).text}`}>{item.periodicity}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(item.originalPlan)} className="text-primary-600 hover:bg-primary-50 p-2 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-gray-500">Nenhum plano cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && formState && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentPlan ? 'Editar Plano de Trabalho' : 'Novo Plano de Trabalho'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900">Área Comum</label>
                                <div className="mt-2">
                                    <SearchableSelect options={commonAreas.map(a => ({ value: a.id, label: `${a.client} | ${a.environment}` }))} value={formState.commonAreaId} onChange={handleAreaChange} disabled={!!currentPlan} placeholder="Selecione a área..."/>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-x-4">
                                <button type="button" onClick={closeModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                                <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">Salvar Plano</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planning;
