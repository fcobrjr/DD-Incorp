import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { WorkPlan, PlannedActivity } from '../types';
import { TrashIcon, EditIcon, PlusIcon, LayoutGridIcon, ListIcon } from '../components/icons';
import PageHeader from '../components/PageHeader';

const Planning: React.FC = () => {
    const {
        commonAreas,
        activities,
        teamMembers,
        tools,
        materials,
        workPlans,
        setWorkPlans
    } = useContext(AppContext)!;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<WorkPlan | null>(null);
    const [formState, setFormState] = useState<WorkPlan | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    const openModal = (plan: WorkPlan | null = null) => {
        setCurrentPlan(plan);
        setFormState(plan ? { ...plan } : {
            id: Date.now().toString(),
            commonAreaId: '',
            date: new Date().toISOString().split('T')[0],
            plannedActivities: [],
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentPlan(null);
        setFormState(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const addActivityToPlan = (activityId: string) => {
        if (!formState || !activityId || formState.plannedActivities.some(p => p.activityId === activityId)) return;
        
        const newPlannedActivity: PlannedActivity = {
            id: `${Date.now()}-${activityId}`,
            activityId,
        };
        setFormState(prev => prev ? { ...prev, plannedActivities: [...prev.plannedActivities, newPlannedActivity] } : null);
    };

    const removeActivityFromPlan = (plannedActivityId: string) => {
        setFormState(prev => prev ? { ...prev, plannedActivities: prev.plannedActivities.filter(p => p.id !== plannedActivityId) } : null);
    };
    
    const assignTeamMember = (plannedActivityId: string, teamMemberId: string) => {
        setFormState(prev => prev ? {
            ...prev,
            plannedActivities: prev.plannedActivities.map(p => 
                p.id === plannedActivityId ? { ...p, assignedTeamMemberId: teamMemberId || undefined } : p
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
            setWorkPlans(prev => [...prev, formState]);
        }
        closeModal();
    };
    
    const handleDelete = (planId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este plano de trabalho?")) {
            setWorkPlans(prev => prev.filter(p => p.id !== planId));
        }
    };
    
    const resourceSummary = useMemo(() => {
        if (!formState) return { tools: {}, materials: {} };

        const summary = {
            tools: new Map<string, number>(),
            materials: new Map<string, number>()
        };

        formState.plannedActivities.forEach(plannedActivity => {
            const activity = activities.find(a => a.id === plannedActivity.activityId);
            if (!activity) return;

            activity.tools.forEach(tool => {
                summary.tools.set(tool.resourceId, (summary.tools.get(tool.resourceId) || 0) + tool.quantity);
            });
            activity.materials.forEach(material => {
                summary.materials.set(material.resourceId, (summary.materials.get(material.resourceId) || 0) + material.quantity);
            });
        });

        return {
            tools: Object.fromEntries(summary.tools),
            materials: Object.fromEntries(summary.materials)
        };
    }, [formState, activities]);

    const getAreaName = (areaId: string): string => {
        const area = commonAreas.find(a => a.id === areaId);
        return area ? `${area.client} - ${area.environment} (${area.location})` : 'Área Desconhecida';
    }

    const flattenedActivities = useMemo(() => {
        return workPlans
            .flatMap(plan =>
                plan.plannedActivities.map(pa => {
                    const commonArea = commonAreas.find(ca => ca.id === plan.commonAreaId);
                    const activity = activities.find(a => a.id === pa.activityId);
                    const teamMember = teamMembers.find(tm => tm.id === pa.assignedTeamMemberId);
                    return {
                        id: pa.id,
                        planDate: plan.date,
                        areaName: commonArea ? `${commonArea.client} - ${commonArea.environment}` : 'N/A',
                        activityName: activity?.name || 'N/A',
                        activitySla: activity?.sla || 0,
                        memberName: teamMember?.name || 'Não atribuído',
                        originalPlan: plan,
                    };
                })
            )
            .sort((a, b) => new Date(a.planDate).getTime() - new Date(b.planDate).getTime());
    }, [workPlans, commonAreas, activities, teamMembers]);


    return (
        <div className="p-8">
            <PageHeader title="Planejamento">
                <div className="flex items-center space-x-2">
                     <div className="bg-gray-200 p-1 rounded-lg flex items-center">
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:bg-gray-300/50'}`}
                            aria-label="Visualização em Cards"
                        >
                            <LayoutGridIcon className="w-5 h-5"/>
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-primary-600 shadow' : 'text-gray-600 hover:bg-gray-300/50'}`}
                             aria-label="Visualização em Tabela"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Novo Plano de Trabalho
                    </button>
                </div>
            </PageHeader>
            
            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workPlans.length > 0 ? workPlans.map(plan => (
                        <div key={plan.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{getAreaName(plan.commonAreaId)}</h3>
                                <p className="text-sm text-gray-500 mb-1">Data: {new Date(plan.date).toLocaleDateString()}</p>
                                <p className="text-sm text-primary-600 font-medium">{plan.plannedActivities.length} atividade(s) planejada(s)</p>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-end items-center gap-x-3">
                                <button onClick={() => openModal(plan)} className="text-primary-600 hover:text-primary-800" aria-label={`Editar plano para ${getAreaName(plan.commonAreaId)}`}>
                                    <EditIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => handleDelete(plan.id)} className="text-red-600 hover:text-red-800" aria-label={`Excluir plano para ${getAreaName(plan.commonAreaId)}`}>
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-700">Nenhum plano de trabalho criado.</h3>
                            <p className="text-gray-500 mt-2">Clique em "Novo Plano de Trabalho" para começar.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área Comum</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membro da Equipe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA (min)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {flattenedActivities.length > 0 ? flattenedActivities.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.planDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.areaName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.activityName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.memberName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.activitySla}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(item.originalPlan)} className="text-primary-600 hover:text-primary-900" aria-label={`Editar plano para ${item.areaName}`}>
                                            <EditIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma atividade planejada.</td>
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
                                {/* Left Column: Plan Details & Activities */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="commonAreaId" className="block text-sm font-medium leading-6 text-gray-900">Área Comum</label>
                                            <div className="mt-2">
                                                <select id="commonAreaId" name="commonAreaId" value={formState.commonAreaId} onChange={handleFormChange} className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required>
                                                    <option value="">Selecione uma área...</option>
                                                    {commonAreas.map(area => <option key={area.id} value={area.id}>{getAreaName(area.id)}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">Data do Plano</label>
                                            <div className="mt-2">
                                                <input type="date" name="date" id="date" value={formState.date} onChange={handleFormChange} className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity Management */}
                                    <div>
                                        <h4 className="font-medium text-gray-800 mb-2">Atividades</h4>
                                        <div className="flex items-stretch gap-x-2 mb-4">
                                            <select id="activity-select" defaultValue="" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                                <option value="" disabled>Selecione para adicionar...</option>
                                                {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                                            </select>
                                            <button type="button" onClick={() => addActivityToPlan((document.getElementById('activity-select') as HTMLSelectElement).value)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 whitespace-nowrap">Adicionar</button>
                                        </div>
                                        
                                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                            {formState.plannedActivities.length > 0 ? formState.plannedActivities.map(plannedAct => {
                                                const activity = activities.find(a => a.id === plannedAct.activityId);
                                                return activity ? (
                                                    <div key={plannedAct.id} className="bg-gray-50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <p className="font-medium text-sm text-gray-800 flex-1">{activity.name}</p>
                                                        <div className="flex items-center gap-x-3">
                                                            <select value={plannedAct.assignedTeamMemberId || ''} onChange={e => assignTeamMember(plannedAct.id, e.target.value)} className="block w-full sm:w-48 rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                                                <option value="">Atribuir a...</option>
                                                                {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                                                            </select>
                                                            <button type="button" onClick={() => removeActivityFromPlan(plannedAct.id)} className="text-red-500 hover:text-red-700" aria-label={`Remover ${activity.name}`}>
                                                                <TrashIcon className="w-5 h-5"/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            }) : <p className="text-center text-gray-500 py-4">Nenhuma atividade adicionada.</p>}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Column: Resource Summary */}
                                <div className="bg-gray-50/70 p-5 rounded-lg">
                                    <h3 className="text-lg font-bold mb-4 text-gray-800">Resumo de Recursos</h3>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Equipamentos</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            {Object.keys(resourceSummary.tools).length > 0 ? Object.entries(resourceSummary.tools).map(([id, qty]) => {
                                                const tool = tools.find(t => t.id === id);
                                                return <li key={id}>{tool?.name}: {qty} {tool?.unit}</li>
                                            }) : <li className="text-gray-500 list-none">Nenhum.</li>}
                                        </ul>
                                    </div>
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-gray-700 mb-2">Materiais</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            {Object.keys(resourceSummary.materials).length > 0 ? Object.entries(resourceSummary.materials).map(([id, qty]) => {
                                                const material = materials.find(m => m.id === id);
                                                return <li key={id}>{material?.name}: {qty} {material?.unit}</li>
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
        </div>
    );
};

export default Planning;