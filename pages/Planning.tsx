
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { WorkPlan, PlannedActivity } from '../types';
import { TrashIcon } from '../components/icons';

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

    const [selectedAreaId, setSelectedAreaId] = useState<string>('');
    const [currentPlan, setCurrentPlan] = useState<WorkPlan | null>(null);

    const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const areaId = e.target.value;
        setSelectedAreaId(areaId);
        if (areaId) {
            // For simplicity, we create a new plan each time. A real app might load existing plans.
            setCurrentPlan({
                id: Date.now().toString(),
                commonAreaId: areaId,
                date: new Date().toISOString().split('T')[0],
                plannedActivities: [],
            });
        } else {
            setCurrentPlan(null);
        }
    };

    const addActivityToPlan = (activityId: string) => {
        if (!currentPlan || !activityId || currentPlan.plannedActivities.some(p => p.activityId === activityId)) return;
        const newPlannedActivity: PlannedActivity = {
            id: Date.now().toString(),
            activityId,
        };
        setCurrentPlan(prev => prev ? { ...prev, plannedActivities: [...prev.plannedActivities, newPlannedActivity] } : null);
    };

    const removeActivityFromPlan = (plannedActivityId: string) => {
        setCurrentPlan(prev => prev ? { ...prev, plannedActivities: prev.plannedActivities.filter(p => p.id !== plannedActivityId) } : null);
    };
    
    const assignTeamMember = (plannedActivityId: string, teamMemberId: string) => {
        setCurrentPlan(prev => prev ? {
            ...prev,
            plannedActivities: prev.plannedActivities.map(p => 
                p.id === plannedActivityId ? { ...p, assignedTeamMemberId: teamMemberId || undefined } : p
            )
        } : null);
    };
    
    const resourceSummary = useMemo(() => {
        if (!currentPlan) return { tools: {}, materials: {} };

        const summary = {
            tools: new Map<string, number>(),
            materials: new Map<string, number>()
        };

        currentPlan.plannedActivities.forEach(plannedActivity => {
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
    }, [currentPlan, activities]);

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Planejamento de Atividades</h2>
            
            <div className="mb-6">
                <label htmlFor="common-area-select" className="block text-sm font-medium text-gray-700 mb-1">Selecione uma Área Comum</label>
                <select 
                    id="common-area-select"
                    value={selectedAreaId}
                    onChange={handleAreaChange}
                    className="w-full max-w-lg p-2 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="">-- Escolha uma área para planejar --</option>
                    {commonAreas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                </select>
            </div>

            {currentPlan && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna de Atividades do Plano */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Plano de Trabalho para: <span className="text-primary-600">{commonAreas.find(a=>a.id === selectedAreaId)?.name}</span></h3>
                        
                        <div className="flex gap-2 mb-6">
                           <select id="activity-select" defaultValue="" className="flex-grow p-2 border rounded-md">
                                <option value="" disabled>Selecione uma atividade para adicionar</option>
                                {activities.map(act => (
                                     <option key={act.id} value={act.id}>{act.name}</option>
                                ))}
                           </select>
                           <button onClick={() => addActivityToPlan((document.getElementById('activity-select') as HTMLSelectElement).value)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Adicionar</button>
                        </div>

                        <div className="space-y-4">
                            {currentPlan.plannedActivities.length > 0 ? currentPlan.plannedActivities.map(plannedAct => {
                                const activity = activities.find(a => a.id === plannedAct.activityId);
                                if (!activity) return null;
                                return (
                                    <div key={plannedAct.id} className="border p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{activity.name}</p>
                                            <p className="text-sm text-gray-500">{activity.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <select 
                                                value={plannedAct.assignedTeamMemberId || ''}
                                                onChange={e => assignTeamMember(plannedAct.id, e.target.value)}
                                                className="p-2 border rounded-md"
                                            >
                                                <option value="">Não atribuído</option>
                                                {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                                            </select>
                                            <button onClick={() => removeActivityFromPlan(plannedAct.id)} className="text-red-500 hover:text-red-700">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                )
                            }) : <p className="text-center text-gray-500 py-6">Nenhuma atividade adicionada ao plano.</p>}
                        </div>
                    </div>

                    {/* Coluna de Resumo de Recursos */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Resumo de Recursos</h3>
                        
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Equipamentos Necessários</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.keys(resourceSummary.tools).length > 0 ? Object.entries(resourceSummary.tools).map(([id, qty]) => {
                                    const tool = tools.find(t => t.id === id);
                                    return <li key={id}>{tool?.name}: {qty} {tool?.unit}</li>
                                }) : <li className="text-gray-500">Nenhum equipamento necessário.</li>}
                            </ul>
                        </div>
                        
                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-700 mb-2">Materiais Necessários</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {Object.keys(resourceSummary.materials).length > 0 ? Object.entries(resourceSummary.materials).map(([id, qty]) => {
                                    const material = materials.find(m => m.id === id);
                                    return <li key={id}>{material?.name}: {qty} {material?.unit}</li>
                                }) : <li className="text-gray-500">Nenhum material necessário.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planning;
