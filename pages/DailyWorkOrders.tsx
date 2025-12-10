
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { PrinterIcon, ClipboardListIcon } from '../components/icons';

const DailyWorkOrders: React.FC = () => {
    const { 
        teamMembers, 
        scheduledActivities, 
        workPlans, 
        commonAreas, 
        activities, 
        materials, 
        tools 
    } = useContext(AppContext)!;

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    // --- Helper Functions ---
    const formatTime = (isoString: string) => {
        // Usually ScheduledActivity doesn't have time yet unless it comes from Governance Schedule shifts.
        // For standard "Agenda", we imply full day or no specific time. 
        // If we had a Time field in ScheduledActivity, we'd use it here.
        return "08:00 - 17:00"; // Placeholder standard shift
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const [year, month, day] = isoString.split('-');
        return `${day}/${month}/${year}`;
    };

    // --- Data Processing ---
    const orderDetails = useMemo(() => {
        if (!selectedEmployeeId || !selectedDate) return null;

        const employee = teamMembers.find(t => t.id === selectedEmployeeId);
        if (!employee) return null;

        // 1. Find scheduled tasks for this operator on this date
        const relevantTasks = scheduledActivities.filter(sa => 
            sa.plannedDate === selectedDate && 
            sa.operatorId === selectedEmployeeId
        );

        // 2. Enrich tasks with details
        const tasks = relevantTasks.map(sa => {
            const workPlan = workPlans.find(wp => wp.id === sa.workPlanId);
            const commonArea = commonAreas.find(ca => ca.id === workPlan?.commonAreaId);
            
            // Find the planned activity definition to link to the Activity master data
            const plannedActivity = workPlan?.plannedActivities?.find(pa => pa.id === sa.plannedActivityId);
            const activityDef = activities.find(a => a.id === plannedActivity?.activityId);

            if (!workPlan || !commonArea || !activityDef) return null;

            // 3. Calculate Materials for this specific task
            const taskMaterials = (activityDef.materials || []).map(matRef => {
                const matDef = materials.find(m => m.id === matRef.resourceId);
                if (!matDef) return null;
                
                let qty = matRef.quantity;
                // If the material definition has a coefficient, multiply by area size
                if (matDef.coefficientM2 && matDef.coefficientM2 > 0 && commonArea.area > 0) {
                    qty = matRef.quantity * commonArea.area;
                }
                
                return {
                    name: matDef.name,
                    unit: matDef.unit,
                    quantity: qty
                };
            }).filter(Boolean);

            // 4. Calculate Tools
            const taskTools = (activityDef.tools || []).map(toolRef => {
                const toolDef = tools.find(t => t.id === toolRef.resourceId);
                if (!toolDef) return null;
                return {
                    name: toolDef.name,
                    quantity: toolRef.quantity
                };
            }).filter(Boolean);

            return {
                id: sa.id,
                time: formatTime(sa.plannedDate),
                areaName: `${commonArea.client} - ${commonArea.environment}`,
                subLocation: `${commonArea.location} ${commonArea.subLocation ? `(${commonArea.subLocation})` : ''}`,
                activityName: activityDef.name,
                description: activityDef.description,
                materials: taskMaterials,
                tools: taskTools
            };
        }).filter(t => t !== null) as NonNullable<typeof tasks[0]>[];

        return {
            employee,
            date: selectedDate,
            tasks
        };

    }, [selectedDate, selectedEmployeeId, teamMembers, scheduledActivities, workPlans, commonAreas, activities, materials, tools]);


    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 pb-20">
            {/* Screen Header - Hidden on Print */}
            <div className="non-printable">
                <PageHeader title="Ordem de Serviço Diária">
                     <button 
                        onClick={handlePrint}
                        disabled={!orderDetails || orderDetails.tasks.length === 0}
                        className={`flex items-center px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                            !orderDetails || orderDetails.tasks.length === 0 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                    >
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Imprimir OS
                    </button>
                </PageHeader>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data da Execução</label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={e => setSelectedDate(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                    </div>
                    <div className="flex-1">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                         <select 
                            value={selectedEmployeeId} 
                            onChange={e => setSelectedEmployeeId(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">Selecione um funcionário...</option>
                            {teamMembers.filter(m => m.isActive).map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Print Layout / Preview */}
            {orderDetails ? (
                <div id="printable-area" className="bg-white shadow-lg p-8 max-w-[210mm] mx-auto min-h-[297mm] print:shadow-none print:p-0 print:w-full print:max-w-none print:min-h-0">
                    
                    {/* OS Header */}
                    <header className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Ordem de Serviço Diária</h1>
                            <p className="text-sm text-gray-600 mt-1">Gestão de Facilities & Áreas Comuns</p>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-semibold text-gray-500 uppercase">Data</div>
                             <div className="text-xl font-bold text-gray-900">{formatDate(orderDetails.date)}</div>
                        </div>
                    </header>

                    {/* Employee Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 print:bg-white print:border-gray-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase">Colaborador</span>
                                <span className="block text-lg font-bold text-gray-900">{orderDetails.employee.name}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase">Função / Cargo</span>
                                <span className="block text-lg text-gray-800">{orderDetails.employee.role}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tasks Table */}
                    {orderDetails.tasks.length > 0 ? (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-300 pb-2 mb-4">Cronograma de Atividades</h3>
                            
                            <div className="space-y-6">
                                {orderDetails.tasks.map((task, idx) => (
                                    <div key={task.id} className="border border-gray-300 rounded-lg p-4 break-inside-avoid">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900">{task.activityName}</h4>
                                                <p className="text-sm text-gray-700 font-medium">{task.areaName}</p>
                                                <p className="text-xs text-gray-500">{task.subLocation}</p>
                                            </div>
                                            <div className="text-right">
                                                 <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded print:border print:border-gray-300">
                                                    {task.time}
                                                 </span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 mb-4 italic border-l-2 border-gray-300 pl-3">
                                            {task.description}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Materials */}
                                            {(task.materials && task.materials.length > 0) && (
                                                <div className="bg-gray-50 p-2 rounded print:bg-white print:border print:border-gray-200">
                                                    <h5 className="text-xs font-bold text-gray-700 uppercase mb-1 border-b border-gray-200 pb-1">Materiais</h5>
                                                    <ul className="text-xs space-y-1">
                                                        {task.materials.map((m, i) => (
                                                            <li key={i} className="flex justify-between">
                                                                <span>{m?.name}</span>
                                                                <span className="font-semibold">{m?.quantity.toFixed(2)} {m?.unit}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {/* Tools */}
                                            {(task.tools && task.tools.length > 0) && (
                                                <div className="bg-gray-50 p-2 rounded print:bg-white print:border print:border-gray-200">
                                                    <h5 className="text-xs font-bold text-gray-700 uppercase mb-1 border-b border-gray-200 pb-1">Equipamentos</h5>
                                                    <ul className="text-xs space-y-1">
                                                        {task.tools.map((t, i) => (
                                                            <li key={i} className="flex justify-between">
                                                                <span>{t?.name}</span>
                                                                <span className="font-semibold">{t?.quantity} un</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-gray-400 rounded-sm"></div>
                                                <span className="text-xs text-gray-500 uppercase">Concluído</span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-400">Observações: ________________________________________________________________</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                            <ClipboardListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Nenhuma atividade agendada para este colaborador nesta data.</p>
                        </div>
                    )}

                    {/* Signatures Footer - Only visible if tasks exist */}
                    {orderDetails.tasks.length > 0 && (
                        <footer className="mt-12 pt-8 border-t-2 border-gray-800 break-inside-avoid">
                            <div className="grid grid-cols-2 gap-16">
                                <div className="text-center">
                                    <div className="border-b border-gray-400 mb-2 h-8"></div>
                                    <p className="text-xs font-bold uppercase text-gray-600">Assinatura do Colaborador</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-b border-gray-400 mb-2 h-8"></div>
                                    <p className="text-xs font-bold uppercase text-gray-600">Assinatura do Supervisor</p>
                                </div>
                            </div>
                            <div className="mt-8 text-center text-[10px] text-gray-400">
                                Gerado automaticamente pelo sistema Planner de Áreas Comuns em {new Date().toLocaleString()}
                            </div>
                        </footer>
                    )}

                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 non-printable">
                    <ClipboardListIcon className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="text-lg">Selecione uma data e um colaborador para gerar a OS.</p>
                </div>
            )}
        </div>
    );
};

export default DailyWorkOrders;
