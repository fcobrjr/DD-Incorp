import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { WorkPlan, PlannedActivity, Periodicity, Activity, CorrelatedResource } from '@shared/types';
import { TrashIcon, EditIcon, PlusIcon, LayoutGridIcon, ListIcon, FilterIcon } from '../components/icons';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/SearchableSelect';

// No planejamento, atividades existentes nunca são sobrescritas.
// Qualquer alteração em SLA, materiais ou ferramentas
// exige salvar como nova atividade.

const PERIODICITY_OPTIONS: Periodicity[] = ['Diário', 'Semanal', 'Quinzenal', 'Mensal'];

const PERIODICITY_COLOR_CONFIG: { [key: string]: { text: string; bg: string; } } = {
    'Diário': { text: 'text-blue-800', bg: 'bg-blue-100' },
    'Semanal': { text: 'text-orange-800', bg: 'bg-orange-100' },
    'Quinzenal': { text: 'text-amber-800', bg: 'bg-amber-100' },
    'Mensal': { text: 'text-yellow-800', bg: 'bg-yellow-100' },
};

const getPeriodicityStyle = (p: string) => {
    return PERIODICITY_COLOR_CONFIG[p] || { text: 'text-purple-800', bg: 'bg-purple-100' };
};

interface PlanActivityForm {
    id: string;
    activityId: string;
    activityName: string;
    slaFixed: number;
    slaCoefficient: number;
    tools: CorrelatedResource[];
    materials: CorrelatedResource[];
    hasChanges: boolean;
}

interface WorkPlanForm {
    id: string;
    commonAreaId: string;
    planName: string;
    periodicity: Periodicity;
    activities: PlanActivityForm[];
}

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
    const [formState, setFormState] = useState<WorkPlanForm | null>(null);
    const [locationSearch, setLocationSearch] = useState('');
    const [activitySearch, setActivitySearch] = useState('');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showActivityDropdown, setShowActivityDropdown] = useState(false);

    const [saveActivityModalOpen, setSaveActivityModalOpen] = useState(false);
    const [activityToSave, setActivityToSave] = useState<PlanActivityForm | null>(null);
    const [newActivityName, setNewActivityName] = useState('');

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

    const uniqueClients = useMemo(() => Array.from(new Set(commonAreas.map(a => a.client).filter(Boolean))).sort(), [commonAreas]);

    const filteredLocations = useMemo(() => {
        if (!locationSearch.trim()) return commonAreas;
        const term = locationSearch.toLowerCase();
        return commonAreas.filter(a => 
            a.client.toLowerCase().includes(term) ||
            a.location.toLowerCase().includes(term) ||
            a.subLocation.toLowerCase().includes(term) ||
            a.environment.toLowerCase().includes(term)
        );
    }, [commonAreas, locationSearch]);

    const filteredActivities = useMemo(() => {
        if (!activitySearch.trim()) return activities;
        const term = activitySearch.toLowerCase();
        return activities.filter(a => 
            a.name.toLowerCase().includes(term) ||
            a.description.toLowerCase().includes(term)
        );
    }, [activities, activitySearch]);

    const selectedArea = useMemo(() => {
        if (!formState?.commonAreaId) return null;
        return commonAreas.find(a => a.id === formState.commonAreaId);
    }, [formState?.commonAreaId, commonAreas]);

    const planSummary = useMemo(() => {
        if (!formState || !selectedArea) return { area: 0, totalActivities: 0, totalMinutes: 0 };
        const totalMinutes = formState.activities.reduce((sum, act) => {
            const time = act.slaFixed + (act.slaCoefficient * selectedArea.area);
            return sum + time;
        }, 0);
        return {
            area: selectedArea.area,
            totalActivities: formState.activities.length,
            totalMinutes
        };
    }, [formState, selectedArea]);

    const hasAnyChanges = useMemo(() => {
        return formState?.activities.some(act => act.hasChanges) ?? false;
    }, [formState?.activities]);

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        if (h === 0) return `${m}min`;
        return `${h}h ${m}min`;
    };

    const openModal = (plan: WorkPlan | null = null) => {
        setCurrentPlan(plan);
        if (plan) {
            const area = commonAreas.find(a => a.id === plan.commonAreaId);
            const planActivities: PlanActivityForm[] = (plan.plannedActivities || []).map(pa => {
                const act = activities.find(a => a.id === pa.activityId);
                return {
                    id: pa.id,
                    activityId: pa.activityId,
                    activityName: act?.name || '',
                    slaFixed: act?.sla || 0,
                    slaCoefficient: act?.slaCoefficient || 0,
                    tools: act?.tools || [],
                    materials: act?.materials || [],
                    hasChanges: false
                };
            });
            setFormState({
                id: plan.id,
                commonAreaId: plan.commonAreaId,
                planName: `Plano - ${area?.environment || ''}`,
                periodicity: plan.plannedActivities[0]?.periodicity || 'Diário',
                activities: planActivities
            });
            setLocationSearch(area ? `${area.client} > ${area.location} > ${area.subLocation} > ${area.environment}` : '');
        } else {
            setFormState({
                id: `plan-${Date.now()}`,
                commonAreaId: '',
                planName: '',
                periodicity: 'Diário',
                activities: []
            });
            setLocationSearch('');
        }
        setActivitySearch('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentPlan(null);
        setFormState(null);
        setLocationSearch('');
        setActivitySearch('');
    };

    const handleLocationSelect = (areaId: string) => {
        const area = commonAreas.find(a => a.id === areaId);
        if (!area) return;

        const existingPlan = workPlans.find(p => p.commonAreaId === areaId);
        if (existingPlan && !currentPlan) {
            alert("Já existe um plano para esta Área Comum. Editando o plano existente.");
            openModal(existingPlan);
            return;
        }

        setFormState(prev => prev ? { 
            ...prev, 
            commonAreaId: areaId,
            planName: prev.planName || `Plano - ${area.environment}`
        } : null);
        setLocationSearch(`${area.client} > ${area.location} > ${area.subLocation} > ${area.environment}`);
        setShowLocationDropdown(false);
    };

    const handleActivitySelect = (activityId: string) => {
        if (!formState) return;
        
        const activity = activities.find(a => a.id === activityId);
        if (!activity) return;

        if (formState.activities.some(a => a.activityId === activityId)) {
            setActivitySearch('');
            setShowActivityDropdown(false);
            return;
        }

        const newActivity: PlanActivityForm = {
            id: `pa-${Date.now()}-${activityId}`,
            activityId,
            activityName: activity.name,
            slaFixed: activity.sla || 0,
            slaCoefficient: activity.slaCoefficient || 0,
            tools: activity.tools || [],
            materials: activity.materials || [],
            hasChanges: false
        };

        setFormState(prev => prev ? {
            ...prev,
            activities: [...prev.activities, newActivity]
        } : null);
        setActivitySearch('');
        setShowActivityDropdown(false);
    };

    const removeActivityFromPlan = (activityFormId: string) => {
        setFormState(prev => prev ? {
            ...prev,
            activities: prev.activities.filter(a => a.id !== activityFormId)
        } : null);
    };

    const updateActivitySla = (activityFormId: string, field: 'fixed' | 'coefficient', value: number) => {
        setFormState(prev => prev ? {
            ...prev,
            activities: prev.activities.map(a => 
                a.id === activityFormId 
                    ? { 
                        ...a, 
                        [field === 'fixed' ? 'slaFixed' : 'slaCoefficient']: value,
                        hasChanges: true
                    }
                    : a
            )
        } : null);
    };

    const addResourceToActivity = (activityFormId: string, type: 'tools' | 'materials', resourceId: string) => {
        if (!resourceId) return;
        
        setFormState(prev => prev ? {
            ...prev,
            activities: prev.activities.map(a => {
                if (a.id !== activityFormId) return a;
                const list = type === 'tools' ? a.tools : a.materials;
                if (list.some(r => r.resourceId === resourceId)) return a;
                
                return {
                    ...a,
                    [type]: [...list, { resourceId, quantity: 1 }],
                    hasChanges: true
                };
            })
        } : null);
    };

    const updateResourceQuantity = (activityFormId: string, type: 'tools' | 'materials', resourceId: string, quantity: number) => {
        setFormState(prev => prev ? {
            ...prev,
            activities: prev.activities.map(a => {
                if (a.id !== activityFormId) return a;
                const list = type === 'tools' ? a.tools : a.materials;
                return {
                    ...a,
                    [type]: list.map(r => r.resourceId === resourceId ? { ...r, quantity: Math.max(0, quantity) } : r),
                    hasChanges: true
                };
            })
        } : null);
    };

    const removeResource = (activityFormId: string, type: 'tools' | 'materials', resourceId: string) => {
        setFormState(prev => prev ? {
            ...prev,
            activities: prev.activities.map(a => {
                if (a.id !== activityFormId) return a;
                const list = type === 'tools' ? a.tools : a.materials;
                return {
                    ...a,
                    [type]: list.filter(r => r.resourceId !== resourceId),
                    hasChanges: true
                };
            })
        } : null);
    };

    const handleSubmitPlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState || !formState.commonAreaId) {
            alert("Por favor, selecione uma Área Comum.");
            return;
        }
        if (!formState.planName.trim()) {
            alert("Por favor, informe o nome do plano.");
            return;
        }
        if (formState.activities.length === 0) {
            alert("Por favor, adicione pelo menos uma atividade.");
            return;
        }

        if (hasAnyChanges) {
            alert("Você tem atividades modificadas. É necessário salvá-las como novas atividades antes de continuar.");
            return;
        }

        savePlan();
    };

    const savePlan = () => {
        if (!formState) return;

        const plannedActivities: PlannedActivity[] = formState.activities.map(act => ({
            id: act.id,
            activityId: act.activityId,
            periodicity: formState.periodicity
        }));

        const workPlan: WorkPlan = {
            id: formState.id,
            commonAreaId: formState.commonAreaId,
            plannedActivities
        };

        if (currentPlan) {
            setWorkPlans(prev => prev.map(p => p.id === currentPlan.id ? workPlan : p));
        } else {
            if (workPlans.some(p => p.commonAreaId === formState.commonAreaId)) {
                alert("Já existe um plano para esta Área Comum. Por favor, edite o plano existente.");
                return;
            }
            setWorkPlans(prev => [...prev, workPlan]);
        }
        closeModal();
    };

    const handleSaveModifiedActivity = () => {
        if (!activityToSave || !formState) return;
        if (!newActivityName.trim()) {
            alert("Por favor, informe um nome para a nova atividade.");
            return;
        }
        if (newActivityName.trim() === activityToSave.activityName) {
            alert("O nome deve ser diferente do original.");
            return;
        }

        const newActivity: Activity = {
            id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: newActivityName.trim(),
            description: `Derivada de: ${activityToSave.activityName}`,
            sla: activityToSave.slaFixed,
            slaCoefficient: activityToSave.slaCoefficient,
            tools: activityToSave.tools,
            materials: activityToSave.materials
        };

        setActivities(prev => [...prev, newActivity]);

        setFormState(prev => prev ? {
            ...prev,
            activities: prev.activities.map(a => 
                a.id === activityToSave.id 
                    ? { ...a, activityId: newActivity.id, hasChanges: false }
                    : a
            )
        } : null);

        setSaveActivityModalOpen(false);
        setActivityToSave(null);
        setNewActivityName('');

        savePlan();
    };

    const handleDelete = (planId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este plano de trabalho?")) {
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
            if (filters.location && area.location !== filters.location) return false;
            if (filters.subLocation && area.subLocation !== filters.subLocation) return false;
            if (filters.environment && area.environment !== filters.environment) return false;
            if (filters.activityId && !(plan.plannedActivities || []).some(pa => pa.activityId === filters.activityId)) return false;
            return true;
        });
    }, [workPlans, filters, commonAreas]);

    const flattenedActivities = useMemo(() => {
        return filteredWorkPlans.flatMap(plan =>
            (plan.plannedActivities || []).map(pa => {
                const area = commonAreas.find(ca => ca.id === plan.commonAreaId);
                const activity = activities.find(a => a.id === pa.activityId);
                const sla = (activity?.sla || 0) + (activity?.slaCoefficient ? (activity.slaCoefficient * (area?.area || 0)) : 0);
                return { id: pa.id, periodicity: pa.periodicity, client: area?.client || 'N/A', location: area?.location || 'N/A', subLocation: area?.subLocation || 'N/A', environment: area?.environment || 'N/A', activityName: activity?.name || 'N/A', activitySla: sla, originalPlan: plan };
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Local</label>
                            <select name="location" value={filters.location} onChange={handleFilterChange} disabled={!filters.client} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                                <option value="">Todos</option>
                                {!filters.client ? null : commonAreas.filter(a => a.client === filters.client).reduce((acc, a) => {
                                    if (!acc.includes(a.location)) acc.push(a.location);
                                    return acc;
                                }, [] as string[]).sort().map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sublocal</label>
                            <select name="subLocation" value={filters.subLocation} onChange={handleFilterChange} disabled={!filters.location} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                                <option value="">Todos</option>
                                {!filters.location ? null : commonAreas.filter(a => a.client === filters.client && a.location === filters.location).reduce((acc, a) => {
                                    if (!acc.includes(a.subLocation)) acc.push(a.subLocation);
                                    return acc;
                                }, [] as string[]).sort().map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Ambiente</label>
                            <select name="environment" value={filters.environment} onChange={handleFilterChange} disabled={!filters.subLocation} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                                <option value="">Todos</option>
                                {!filters.subLocation ? null : commonAreas.filter(a => a.client === filters.client && a.location === filters.location && a.subLocation === filters.subLocation).reduce((acc, a) => {
                                    if (!acc.includes(a.environment)) acc.push(a.environment);
                                    return acc;
                                }, [] as string[]).sort().map(env => <option key={env} value={env}>{env}</option>)}
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
                                <div className="p-3 border-b border-gray-100 relative group/header">
                                    <h3 className="font-bold text-gray-900 text-sm">{area.client}</h3>
                                    <div className="text-[10px] text-gray-600 space-y-0.5 mt-1.5">
                                        <p><span className="font-semibold">Local:</span> {area.location}</p>
                                        <p><span className="font-semibold">Sublocal:</span> {area.subLocation}</p>
                                        <p><span className="font-semibold">Ambiente:</span> {area.environment}</p>
                                    </div>
                                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(plan)} className="p-1 rounded-full text-primary-600 hover:bg-primary-50"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(plan.id)} className="p-1 rounded-full text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50/50 flex-1 space-y-2 max-h-40 overflow-y-auto">
                                    {(plan.plannedActivities || []).map(pa => (
                                        <div key={pa.id} className="bg-white p-2 rounded border border-gray-100 text-[11px] font-medium text-gray-700">
                                            {activities.find(a => a.id === pa.activityId)?.name}
                                            <span className={`block mt-1 text-[9px] font-bold uppercase ${getPeriodicityStyle(pa.periodicity).text}`}>{pa.periodicity}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-3 py-2 border-t border-gray-100 bg-white flex justify-between text-[10px] font-bold text-gray-400">
                                    <span>{plan.plannedActivities?.length || 0} Atividades</span>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sublocal</th>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.subLocation}</td>
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
                                        <td colSpan={7} className="text-center py-10 text-gray-500">Nenhum plano cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && formState && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {currentPlan ? 'Editar Plano de Trabalho' : 'Novo Plano de Trabalho'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmitPlan} className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Identificação do Local</h4>
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Local / Área Comum *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                value={locationSearch}
                                                onChange={(e) => {
                                                    setLocationSearch(e.target.value);
                                                    setShowLocationDropdown(true);
                                                    if (!e.target.value) {
                                                        setFormState(prev => prev ? { ...prev, commonAreaId: '' } : null);
                                                    }
                                                }}
                                                onFocus={() => setShowLocationDropdown(true)}
                                                placeholder="Buscar por cliente, local, sublocal ou ambiente..."
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                disabled={!!currentPlan}
                                            />
                                        </div>
                                        {showLocationDropdown && !currentPlan && filteredLocations.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-48 overflow-y-auto">
                                                {filteredLocations.map(area => (
                                                    <button
                                                        key={area.id}
                                                        type="button"
                                                        onClick={() => handleLocationSelect(area.id)}
                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 transition-colors ${formState.commonAreaId === area.id ? 'bg-primary-100 text-primary-700' : 'text-gray-700'}`}
                                                    >
                                                        <span className="font-medium">{area.client}</span>
                                                        <span className="text-gray-400"> &gt; </span>
                                                        <span>{area.location}</span>
                                                        <span className="text-gray-400"> &gt; </span>
                                                        <span>{area.subLocation}</span>
                                                        <span className="text-gray-400"> &gt; </span>
                                                        <span className="text-primary-600">{area.environment}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Dados do Plano</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano *</label>
                                            <input
                                                type="text"
                                                value={formState.planName}
                                                onChange={(e) => setFormState(prev => prev ? { ...prev, planName: e.target.value } : null)}
                                                placeholder="Ex: Limpeza semanal - Cobertura"
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade *</label>
                                            <select
                                                value={formState.periodicity}
                                                onChange={(e) => setFormState(prev => prev ? { ...prev, periodicity: e.target.value as Periodicity } : null)}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            >
                                                {PERIODICITY_OPTIONS.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Atividades do Plano</h4>
                                    <div className="relative mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adicionar Atividade *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                value={activitySearch}
                                                onChange={(e) => {
                                                    setActivitySearch(e.target.value);
                                                    setShowActivityDropdown(true);
                                                }}
                                                onFocus={() => setShowActivityDropdown(true)}
                                                placeholder="Pesquisar atividade existente..."
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                        </div>
                                        {showActivityDropdown && filteredActivities.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-48 overflow-y-auto">
                                                {filteredActivities.map(act => (
                                                    <button
                                                        key={act.id}
                                                        type="button"
                                                        onClick={() => handleActivitySelect(act.id)}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50 transition-colors text-gray-700"
                                                    >
                                                        <span className="font-medium">{act.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {formState.activities.map(act => (
                                            <div key={act.id} className={`rounded-lg border p-4 shadow-sm ${act.hasChanges ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <h5 className="font-semibold text-gray-900">Atividade: {act.activityName}</h5>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeActivityFromPlan(act.id)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>

                                                {act.hasChanges && (
                                                    <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-sm text-amber-800">
                                                        <strong>Alteração detectada:</strong> Esta atividade foi modificada e será salva como uma nova atividade.
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">SLA fixo (min)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={act.slaFixed}
                                                            onChange={(e) => updateActivitySla(act.id, 'fixed', parseFloat(e.target.value) || 0)}
                                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">SLA por m² (min/m²)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            value={act.slaCoefficient}
                                                            onChange={(e) => updateActivitySla(act.id, 'coefficient', parseFloat(e.target.value) || 0)}
                                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {selectedArea && (
                                                    <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                                                        <p>Área do local: <strong>{selectedArea.area} m²</strong></p>
                                                        <p>Tempo estimado: <strong>{formatTime(act.slaFixed + (act.slaCoefficient * selectedArea.area))}</strong></p>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipamentos</label>
                                                        <SearchableSelect
                                                            options={tools.map(t => ({ value: t.id, label: t.name }))}
                                                            value=""
                                                            onChange={(val) => addResourceToActivity(act.id, 'tools', val)}
                                                            placeholder="Adicionar equipamento..."
                                                        />
                                                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                                                            {act.tools.map(tool => {
                                                                const toolObj = tools.find(t => t.id === tool.resourceId);
                                                                if (!toolObj) return null;
                                                                return (
                                                                    <div key={tool.resourceId} className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                                                                        <span>{toolObj.name}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeResource(act.id, 'tools', tool.resourceId)}
                                                                            className="text-red-500 hover:text-red-700"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Materiais</label>
                                                        <SearchableSelect
                                                            options={materials.map(m => ({ value: m.id, label: m.name }))}
                                                            value=""
                                                            onChange={(val) => addResourceToActivity(act.id, 'materials', val)}
                                                            placeholder="Adicionar material..."
                                                        />
                                                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                                                            {act.materials.map(material => {
                                                                const matObj = materials.find(m => m.id === material.resourceId);
                                                                if (!matObj) return null;
                                                                return (
                                                                    <div key={material.resourceId} className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                                                                        <div>
                                                                            <span>{matObj.name}</span>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.1"
                                                                                value={material.quantity}
                                                                                onChange={(e) => updateResourceQuantity(act.id, 'materials', material.resourceId, parseFloat(e.target.value))}
                                                                                className="block w-16 mt-1 px-2 py-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeResource(act.id, 'materials', material.resourceId)}
                                                                            className="text-red-500 hover:text-red-700"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {formState.activities.length > 0 && selectedArea && (
                                    <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                                        <h4 className="text-sm font-semibold text-primary-800 mb-2">Resumo do Plano</h4>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-primary-600">Área total:</span>
                                                <span className="ml-2 font-medium text-primary-900">{planSummary.area} m²</span>
                                            </div>
                                            <div>
                                                <span className="text-primary-600">Total de atividades:</span>
                                                <span className="ml-2 font-medium text-primary-900">{planSummary.totalActivities}</span>
                                            </div>
                                            <div>
                                                <span className="text-primary-600">Tempo estimado:</span>
                                                <span className="ml-2 font-medium text-primary-900">{formatTime(planSummary.totalMinutes)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitPlan}
                                disabled={hasAnyChanges}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${hasAnyChanges ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                            >
                                {hasAnyChanges ? 'Salve as alterações de atividades' : 'Salvar Plano'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {saveActivityModalOpen && activityToSave && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Salvar como Nova Atividade</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                <strong>{activityToSave.activityName}</strong> foi modificada. Para continuar, é necessário salvá-la como uma nova atividade.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da nova atividade *</label>
                                <input
                                    type="text"
                                    value={newActivityName}
                                    onChange={(e) => setNewActivityName(e.target.value)}
                                    placeholder="Digite o novo nome..."
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSaveActivityModalOpen(false);
                                    setActivityToSave(null);
                                    setNewActivityName('');
                                }}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveModifiedActivity}
                                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700"
                            >
                                Salvar Atividade e Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planning;
