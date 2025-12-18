
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

    // State for main planning modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<WorkPlan | null>(null);
    const [formState, setFormState] = useState<WorkPlan | null>(null);
    
    // UI State for Activity Addition (Combobox value)
    const [selectedActivityForAdd, setSelectedActivityForAdd] = useState('');

    // State for nested activity editing modal
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

    // UI State
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
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
        setFilters({
            search: '',
            client: '',
            location: '',
            subLocation: '',
            environment: '',
            activityId: '',
        });
    };

    const uniqueClients = useMemo(() => [...new Set(commonAreas.map(a => a.client).filter(Boolean))].sort(), [commonAreas]);

    const uniqueLocations = useMemo(() => {
        if (!filters.client) return [];
        return [...new Set(commonAreas.filter(a => a.client === filters.client).map(a => a.location).filter(Boolean))].sort();
    }, [commonAreas, filters.client]);
    
    const uniqueSubLocations = useMemo(() => {
        if (!filters.client || !filters.location) return [];
        return [...new Set(commonAreas.filter(a => a.client === filters.client && a.location === filters.location).map(a => a.subLocation).filter(Boolean))].sort();
    }, [commonAreas, filters.client, filters.location]);

    const uniqueEnvironments = useMemo(() => {
        if (!filters.client || !filters.location || !filters.subLocation) return [];
        return [...new Set(commonAreas.filter(a => a.client === filters.client && a.location === filters.location && a.subLocation === filters.subLocation).map(a => a.environment).filter(Boolean))].sort();
    }, [commonAreas, filters.client, filters.location, filters.subLocation]);

    // --- Main Planning Modal Logic ---
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
    
     const handleCoefficientChange = (activityId: string, resourceId: string, newQuantity: number) => {
        setActivities(prevActivities =>
            prevActivities.map(activity => {
                if (activity.id === activityId) {
                    const updatedMaterials = (activity.materials || []).map(material => {
                        if (material.resourceId === resourceId) {
                            return { ...material, quantity: newQuantity < 0 ? 0 : newQuantity };
                        }
                        return material;
                    });
                    return { ...activity, materials: updatedMaterials };
                }
                return activity;
            })
        );
    };

    // --- Nested Activity Modal Logic ---
    const openActivityModal = (activity: Activity) => {
        setActivityToEdit(activity);
        setActivityFormState({ ...activity, tools: activity.tools || [], materials: activity.materials || [] });
        setIsActivityModalOpen(true);
    };

    const closeActivityModal = () => {
        setIsActivityModalOpen(false);
        setActivityToEdit(null);
    };

    const handleActivityInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setActivityFormState(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const addActivityResource = (type: 'tools' | 'materials', resourceId: string) => {
      if (!resourceId || (activityFormState[type] || []).some(r => r.resourceId === resourceId)) return;
      
      let quantity = 1;
      if (type === 'materials') {
        const material = materials.find(m => m.id === resourceId);
        if (material?.coefficientM2 && material.coefficientM2 > 0) {
          quantity = material.coefficientM2;
        }
      }

      const newResource: CorrelatedResource = { resourceId, quantity };
      setActivityFormState(prev => ({ ...prev, [type]: [...(prev[type] || []), newResource] }));
    };

    const updateActivityResourceQuantity = (type: 'tools' | 'materials', resourceId: string, quantity: number) => {
        setActivityFormState(prev => ({
            ...prev,
            [type]: (prev[type] || []).map(r => r.resourceId === resourceId ? { ...r, quantity: quantity < 0 ? 0 : quantity } : r)
        }));
    };

    const removeActivityResource = (type: 'tools' | 'materials', resourceId: string) => {
        setActivityFormState(prev => ({
            ...prev,
            [type]: (prev[type] || []).filter(r => r.resourceId !== resourceId)
        }));
    };

    const handleActivityFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityToEdit) return;
        setActivities(prev => prev.map(a => a.id === activityToEdit.id ? { ...activityFormState, id: activityToEdit.id } : a));
        closeActivityModal();
    };

    const renderActivityResourceList = (type: 'tools' | 'materials') => {
        const resourceList = type === 'tools' ? tools : materials;
        const title = type === 'tools' ? 'Equipamentos' : 'Materiais';
        const resourceOptions = resourceList.map(r => ({ value: r.id, label: `${r.name} (${r.unit})` }));

        return (
            <div className="mt-6">
                <h4 className="text-lg font-medium leading-6 text-gray-900">{title}</h4>
                <div className="mt-4">
                  <div className="flex items-stretch space-x-2">
                      <SearchableSelect 
                        options={resourceOptions}
                        value=""
                        onChange={(val) => addActivityResource(type, val)}
                        placeholder={`Buscar ${title.toLowerCase()}...`}
                      />
                  </div>
                </div>
                <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2">
                    {(activityFormState[type] || []).length > 0 ? (activityFormState[type] || []).map(correlated => {
                        const resource = resourceList.find(r => r.id === correlated.resourceId);
                        if (!resource) return null;
                        const isCoefficient = type === 'materials' && resource.coefficientM2 && resource.coefficientM2 > 0;
                        return (
                            <div key={correlated.resourceId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <span className="text-sm font-medium text-gray-800">{resource.name}</span>
                                    {isCoefficient && <span className="text-xs text-blue-600 block">Coeficiente / m²</span>}
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="number" 
                                        aria-label={`Quantidade de ${resource.name}`}
                                        value={correlated.quantity}
                                        onChange={(e) => updateActivityResourceQuantity(type, correlated.resourceId, parseFloat(e.target.value))}
                                        className="block w-24 rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                        min="0"
                                        step="0.001"
                                    />
                                    <span className="text-sm text-gray-500 min-w-[30px]">{resource.unit}</span>
                                    <button type="button" onClick={() => removeActivityResource(type, correlated.resourceId)} className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors" aria-label={`Remover ${resource.name}`}>
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )
                    }) : (
                      <div className="text-center py-4 text-sm text-gray-500">Nenhum {title.toLowerCase()} adicionado.</div>
                    )}
                </div>
            </div>
        );
    }
    // --- Memoized Calculations ---
    const resourceSummary = useMemo(() => {
        if (!formState) return { tools: {}, materials: {} };

        const summary = {
            tools: new Map<string, number>(),
            materials: new Map<string, number>()
        };

        const currentArea = commonAreas.find(a => a.id === formState.commonAreaId);
        const areaSize = currentArea?.area || 0;

        (formState.plannedActivities || []).forEach(plannedActivity => {
            const activity = activities.find(a => a.id === plannedActivity.activityId);
            if (!activity) return;

            (activity.tools || []).forEach(tool => {
                summary.tools.set(tool.resourceId, (summary.tools.get(tool.resourceId) || 0) + tool.quantity);
            });
            (activity.materials || []).forEach(material => {
                const materialDef = materials.find(m => m.id === material.resourceId);
                let quantityToAdd = material.quantity;
                
                if (materialDef && materialDef.coefficientM2 !== undefined && materialDef.coefficientM2 !== null) {
                     quantityToAdd = material.quantity * areaSize;
                }
                
                summary.materials.set(material.resourceId, (summary.materials.get(material.resourceId) || 0) + quantityToAdd);
            });
        });

        return {
            tools: Object.fromEntries(summary.tools),
            materials: Object.fromEntries(summary.materials)
        };
    }, [formState, activities, commonAreas, materials]);

    const getAreaName = (areaId: string): string => {
        const area = commonAreas.find(a => a.id === areaId);
        if (!area) return 'Área Desconhecida';
        const parts = [
            area.client,
            area.location,
            area.subLocation,
            area.environment
        ].filter(Boolean);
        return parts.join(' | ');
    }

    const filteredWorkPlans = useMemo(() => {
        return workPlans.filter(plan => {
            const area = commonAreas.find(a => a.id === plan.commonAreaId);
            if (!area) return false;

            if (filters.search) {
                const term = filters.search.toLowerCase();
                const matches = 
                    area.client.toLowerCase().includes(term) ||
                    area.location.toLowerCase().includes(term) ||
                    area.environment.toLowerCase().includes(term) ||
                    (plan.plannedActivities || []).some(pa => {
                        const act = activities.find(a => a.id === pa.activityId);
                        return act?.name.toLowerCase().includes(term);
                    });
                if (!matches) return false;
            }
            
            if (filters.client && area.client !== filters.client) return false;
            if (filters.location && area.location !== filters.location) return false;
            if (filters.subLocation && area.subLocation !== filters.subLocation) return false;
            if (filters.environment && area.environment !== filters.environment) return false;
            if (filters.activityId && !(plan.plannedActivities || []).some(pa => pa.activityId === filters.activityId)) return false;
            return true;
        });
    }, [workPlans, filters, commonAreas, activities]);


    const flattenedActivities = useMemo(() => {
        return filteredWorkPlans
            .flatMap(plan =>
                (plan.plannedActivities || []).map(pa => {
                    const commonArea = commonAreas.find(ca => ca.id === plan.commonAreaId);
                    const activity = activities.find(a => a.id === pa.activityId);
                    
                    const areaSize = commonArea?.area || 0;
                    const calculatedSla = (activity?.sla || 0) + 
                        (activity?.slaCoefficient ? (activity.slaCoefficient * areaSize) : 0);

                    return {
                        id: pa.id,
                        periodicity: pa.periodicity,
                        client: commonArea?.client || 'N/A',
                        location: commonArea?.location || 'N/A',
                        subLocation: commonArea?.subLocation || 'N/A',
                        environment: commonArea?.environment || 'N/A',
                        activityName: activity?.name || 'N/A',
                        activitySla: calculatedSla,
                        originalPlan: plan,
                    };
                })
            )
            .sort((a, b) => a.client.localeCompare(b.client) || a.location.localeCompare(b.location) || a.subLocation.localeCompare(b.subLocation) || a.environment.localeCompare(b.environment) || a.activityName.localeCompare(b.activityName));
    }, [filteredWorkPlans, commonAreas, activities]);

    const commonAreaOptions = useMemo(() => 
        commonAreas.map(a => ({ value: a.id, label: getAreaName(a.id) })), 
    [commonAreas]);

    const activityOptions = useMemo(() => 
        activities.map(a => ({ value: a.id, label: a.name })), 
    [activities]);


    return (
        <div className="p-8">
            <PageHeader title="Planejamento">
                <div className="flex items-center space-x-2">
                     <div className="bg-gray-200 p-1 rounded-lg flex items-center">
                        <button 
                            type="button"
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:bg-gray-300/50'}`}
                            aria-label="Visualização em Cards"
                        >
                            <LayoutGridIcon className="w-5 h-5"/>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:bg-gray-300/50'}`}
                             aria-label="Visualização em Tabela"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Novo Plano
                    </button>
                </div>
            </PageHeader>
            
            <div className="mb-6 flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-200 hover:text-primary-600'}`}
                >
                    <FilterIcon className="w-5 h-5 mr-2" />
                    {showFilters ? 'Ocultar Filtros' : 'Filtros e Pesquisa'}
                </button>
            </div>

            {showFilters && (
                <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div>
                            <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-1">Pesquisa Global</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="search"
                                    name="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder="Termo livre..."
                                    className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="client" className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                            <select name="client" id="client" value={filters.client} onChange={handleFilterChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5">
                                <option value="">Todos</option>
                                {uniqueClients.map(cli => <option key={cli} value={cli}>{cli}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">Local</label>
                            <select name="location" id="location" value={filters.location} onChange={handleFilterChange} disabled={!filters.client} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                                <option value="">Todos</option>
                                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="subLocation" className="block text-sm font-semibold text-gray-700 mb-1">Sublocal</label>
                            <select name="subLocation" id="subLocation" value={filters.subLocation} onChange={handleFilterChange} disabled={!filters.location} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                                <option value="">Todos</option>
                                {uniqueSubLocations.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="activityId" className="block text-sm font-semibold text-gray-700 mb-1">Atividade</label>
                            <select name="activityId" id="activityId" value={filters.activityId} onChange={handleFilterChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5">
                                <option value="">Todas</option>
                                {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={clearFilters} className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline px-4 py-2">Limpar todos os filtros</button>
                    </div>
                </div>
            )}

           {viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredWorkPlans.length > 0 ? filteredWorkPlans.map((plan) => {
                        const area = commonAreas.find(a => a.id === plan.commonAreaId);
                        if (!area) return null;
                        const plannedActivities = plan.plannedActivities || [];
                        
                        return (
                            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col transition-all duration-300 hover:shadow-md hover:ring-1 hover:ring-primary-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 relative group/header">
                                    <div className="pr-12">
                                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm leading-tight" title={area.client}>{area.client}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{area.location} {area.subLocation ? `· ${area.subLocation}` : ''}</p>
                                        <div className="mt-2 inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 uppercase tracking-wider">
                                            {area.environment}
                                        </div>
                                    </div>
                                    
                                     <div className="absolute top-3 right-2 flex flex-col items-center space-y-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => openModal(plan)} className="p-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-primary-600 hover:bg-primary-50 transition-colors" aria-label="Editar">
                                            <EditIcon className="w-4 h-4"/>
                                        </button>
                                        <button type="button" onClick={() => handleDelete(plan.id)} className="p-1.5 rounded-full bg-white shadow-sm border border-gray-100 text-red-600 hover:bg-red-50 transition-colors" aria-label="Excluir">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-2 space-y-1.5 bg-gray-50/50 flex-1 max-h-52 overflow-y-auto">
                                    {plannedActivities.length > 0 ? plannedActivities.map(pa => {
                                        const activity = activities.find(a => a.id === pa.activityId);
                                        const periodStyle = getPeriodicityStyle(pa.periodicity);
                                        return (
                                            <div key={pa.id} className="flex flex-col gap-1 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                                <p className="font-semibold text-[11px] text-gray-800 line-clamp-2 leading-snug">{activity?.name || 'Atividade desconhecida'}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${periodStyle.bg} ${periodStyle.text}`}>{pa.periodicity}</span>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center text-[10px] text-gray-400 py-6 italic">Sem atividades</div>
                                    )}
                                </div>
                                
                                <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center bg-white">
                                     <span className="text-[10px] font-medium text-gray-500">
                                        {plannedActivities.length} {plannedActivities.length === 1 ? 'item' : 'itens'}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400">{area.area}m²</span>
                                </div>
                            </div>
                        )
                    }) : (
                         <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5 text-center py-16 bg-white rounded-xl shadow-sm border">
                            <h3 className="text-xl font-semibold text-gray-700">Nenhum plano encontrado.</h3>
                            <p className="text-gray-500 mt-2">Ajuste os filtros ou crie um novo.</p>
                        </div>
                    )}
                </div>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                                  <div className="flex items-center">
                                    SLA Estimado
                                    <InfoTooltip side="bottom" text="Tempo total calculado: (SLA Fixo) + (Área × SLA Proporcional)." />
                                  </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações do Plano</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {flattenedActivities.length > 0 ? flattenedActivities.map(item => {
                                const periodStyle = getPeriodicityStyle(item.periodicity);
                                return (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.client}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.subLocation}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.environment}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.activityName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${periodStyle.bg} ${periodStyle.text}`}>{item.periodicity}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{item.activitySla.toFixed(0)} min</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center space-x-1">
                                            <button type="button" onClick={() => openModal(item.originalPlan)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors" aria-label={`Editar plano para ${item.client}`}>
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button type="button" onClick={() => handleDelete(item.originalPlan.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors" aria-label={`Excluir plano para ${item.client}`}>
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500">Nenhuma atividade planejada encontrada com os filtros atuais.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && formState && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentPlan ? 'Editar Plano de Trabalho' : 'Novo Plano de Trabalho'}</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium leading-6 text-gray-900">Área Comum</label>
                                        <div className="mt-2">
                                            <SearchableSelect 
                                                options={commonAreaOptions}
                                                value={formState.commonAreaId}
                                                onChange={handleAreaChange}
                                                disabled={!!currentPlan}
                                                placeholder="Buscar por cliente, local, sublocal ou ambiente..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-2">Atividades</h4>
                                        <div className="flex items-stretch gap-x-2 mb-4">
                                            <div className="flex-1">
                                                <SearchableSelect 
                                                    options={activityOptions}
                                                    value={selectedActivityForAdd}
                                                    onChange={setSelectedActivityForAdd}
                                                    placeholder="Buscar atividade no catálogo..."
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => addActivityToPlan(selectedActivityForAdd)} 
                                                disabled={!selectedActivityForAdd}
                                                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 whitespace-nowrap disabled:opacity-50"
                                            >
                                                Adicionar
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                            {(formState.plannedActivities || []).length > 0 ? formState.plannedActivities.map(plannedAct => {
                                                const activity = activities.find(a => a.id === plannedAct.activityId);
                                                const isStandardPeriodicity = PERIODICITY_OPTIONS.includes(plannedAct.periodicity);
                                                const isCustom = plannedAct.periodicity.startsWith('Cada ');
                                                const customDays = isCustom ? plannedAct.periodicity.split(' ')[1] : 3;

                                                const currentArea = commonAreas.find(a => a.id === formState.commonAreaId);
                                                const areaSize = currentArea?.area || 0;
                                                
                                                const calculatedSla = (activity?.sla || 0) + 
                                                    (activity?.slaCoefficient ? (activity.slaCoefficient * areaSize) : 0);

                                                return activity ? (
                                                    <div key={plannedAct.id} className="bg-gray-50 p-4 rounded-lg border">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm text-gray-800">{activity.name}</p>
                                                                <p className="text-xs text-primary-600 font-bold mt-1">
                                                                  SLA Calculado: {calculatedSla.toFixed(0)} min
                                                                  <InfoTooltip text={`Base: ${activity.sla}min + (${areaSize}m² × ${activity.slaCoefficient || 0}min)`} />
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-x-2 flex-wrap">
                                                                <div className="flex items-center gap-2">
                                                                    <select 
                                                                        value={isStandardPeriodicity ? plannedAct.periodicity : 'Personalizado'} 
                                                                        onChange={e => {
                                                                            if (e.target.value === 'Personalizado') {
                                                                                updateActivityPeriodicity(plannedAct.id, 'Cada 3 dias');
                                                                            } else {
                                                                                updateActivityPeriodicity(plannedAct.id, e.target.value as Periodicity);
                                                                            }
                                                                        }} 
                                                                        className="block w-full sm:w-40 rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                                                    >
                                                                        {PERIODICITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                                                        <option value="Personalizado">Personalizado</option>
                                                                    </select>
                                                                    
                                                                    {!isStandardPeriodicity && (
                                                                         <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1 shadow-sm">
                                                                            <span className="text-xs text-gray-500">Cada</span>
                                                                            <input 
                                                                                type="number" 
                                                                                min="1"
                                                                                value={customDays}
                                                                                onChange={(e) => updateActivityPeriodicity(plannedAct.id, `Cada ${e.target.value} dias`)}
                                                                                className="w-12 text-center text-sm border-0 border-b border-gray-200 focus:ring-0 p-0"
                                                                            />
                                                                            <span className="text-xs text-gray-500">dias</span>
                                                                         </div>
                                                                    )}
                                                                </div>

                                                                <button type="button" onClick={() => openActivityModal(activity)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors" aria-label={`Editar atividade ${activity.name}`}>
                                                                    <EditIcon className="w-5 h-5"/>
                                                                </button>
                                                                <button type="button" onClick={() => removeActivityFromPlan(plannedAct.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors" aria-label={`Remover ${activity.name}`}>
                                                                    <TrashIcon className="w-5 h-5"/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                                            {(activity.materials || []).length > 0 ? (activity.materials || []).map(mat => {
                                                                const materialDef = materials.find(m => m.id === mat.resourceId);
                                                                const currentArea = commonAreas.find(a => a.id === formState.commonAreaId);
                                                                const areaSize = currentArea?.area || 0;
                                                                
                                                                if (!materialDef) return null;
                                                                const usesCoefficient = materialDef.coefficientM2 !== undefined && materialDef.coefficientM2 !== null;

                                                                return (
                                                                    <div key={mat.resourceId} className="text-xs text-gray-600 pl-4">
                                                                        <span className="font-semibold">{materialDef.name}:</span>
                                                                        {usesCoefficient && areaSize > 0 ? (
                                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                                <span>{areaSize.toFixed(2)} m²</span>
                                                                                <span>×</span>
                                                                                <input 
                                                                                    type="number" 
                                                                                    value={mat.quantity} 
                                                                                    onChange={(e) => handleCoefficientChange(activity.id, mat.resourceId, parseFloat(e.target.value) || 0)} 
                                                                                    className="block w-20 rounded-md border-0 py-0.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                                                                                    step="0.001" min="0"
                                                                                />
                                                                                <span>=</span>
                                                                                <span className="font-bold text-primary-700">{(areaSize * mat.quantity).toFixed(3)} {materialDef.unit}</span>
                                                                            </div>
                                                                        ) : (
                                                                           <span> {mat.quantity} {materialDef.unit} (Fixo)</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }) : <p className="text-xs text-gray-500 pl-4 italic">Nenhum material associado.</p>}
                                                        </div>
                                                    </div>
                                                ) : null;
                                            }) : <p className="text-center text-gray-500 py-4">Nenhuma atividade adicionada.</p>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50/70 p-5 rounded-lg">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800">Resumo de Recursos</h3>
                                    <p className="text-xs text-gray-500 mb-4 -mt-3">Quantidades de materiais com coeficiente são calculadas com base na área de {commonAreas.find(a => a.id === formState.commonAreaId)?.area || 0}m².</p>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Equipamentos</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            {Object.keys(resourceSummary.tools).length > 0 ? Object.entries(resourceSummary.tools).map(([id, qty]) => {
                                                const tool = tools.find(t => t.id === id);
                                                return <li key={id}>{tool?.name}: {(qty as number).toFixed(2)} {tool?.unit}</li>
                                            }) : <li className="text-gray-500 list-none">Nenhum.</li>}
                                        </ul>
                                    </div>
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-gray-700 mb-2">Materiais</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            {Object.keys(resourceSummary.materials).length > 0 ? Object.entries(resourceSummary.materials).map(([id, qty]) => {
                                                const material = materials.find(m => m.id === id);
                                                return <li key={id}>{material?.name}: {(qty as number).toFixed(3)} {material?.unit}</li>
                                            }) : <li className="text-gray-500 list-none">Nenhum.</li>}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-x-4">
                                <button type="button" onClick={closeModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                                <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Salvar Plano</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isActivityModalOpen && activityToEdit && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-[60]" role="dialog" aria-modal="true">
                  <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-6">Editar Atividade</h3>
                    <form onSubmit={handleActivityFormSubmit}>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           <div className="md:col-span-2">
                              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Nome da Atividade</label>
                              <div className="mt-2">
                                <input type="text" name="name" id="name" value={activityFormState.name} onChange={handleActivityInputChange} className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                              </div>
                            </div>
                            <div>
                                <label htmlFor="sla" className="block text-sm font-medium leading-6 text-gray-900">SLA Fixo (min)</label>
                                <div className="mt-2">
                                   <input type="number" name="sla" id="sla" value={activityFormState.sla} onChange={handleActivityInputChange} className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="slaCoefficient" className="block text-sm font-medium leading-6 text-gray-900">SLA por m²</label>
                                <div className="mt-2">
                                   <input type="number" name="slaCoefficient" id="slaCoefficient" step="0.001" value={activityFormState.slaCoefficient} onChange={handleActivityInputChange} className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                                </div>
                            </div>
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Descrição</label>
                          <div className="mt-2">
                            <textarea name="description" id="description" value={activityFormState.description} onChange={handleActivityInputChange} className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" rows={3}></textarea>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pt-2">
                          {renderActivityResourceList('tools')}
                          {renderActivityResourceList('materials')}
                        </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-x-4">
                        <button type="button" onClick={closeActivityModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Salvar Alterações</button>
                      </div>
                    </form>
                  </div>
                </div>
            )}
        </div>
    );
};

export default Planning;
