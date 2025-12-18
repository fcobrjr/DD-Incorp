
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { PrinterIcon, ClipboardListIcon } from '../components/icons';
import SearchableSelect from '../components/SearchableSelect';

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

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const [year, month, day] = isoString.split('-');
        return `${day}/${month}/${year}`;
    };

    const employeeOptions = useMemo(() => 
        teamMembers
            .filter(m => m.isActive)
            .map(m => ({ value: m.id, label: `${m.name} (${m.role})` })), 
    [teamMembers]);

    const orderDetails = useMemo(() => {
        if (!selectedEmployeeId || !selectedDate) return null;
        const employee = teamMembers.find(t => t.id === selectedEmployeeId);
        if (!employee) return null;

        const tasks = scheduledActivities.filter(sa => 
            sa.plannedDate === selectedDate && 
            sa.operatorId === selectedEmployeeId
        ).map(sa => {
            const workPlan = workPlans.find(wp => wp.id === sa.workPlanId);
            const commonArea = commonAreas.find(ca => ca.id === workPlan?.commonAreaId);
            const plannedActivity = workPlan?.plannedActivities?.find(pa => pa.id === sa.plannedActivityId);
            const activityDef = activities.find(a => a.id === plannedActivity?.activityId);

            if (!workPlan || !commonArea || !activityDef) return null;

            const taskMaterials = (activityDef.materials || []).map(matRef => {
                const matDef = materials.find(m => m.id === matRef.resourceId);
                if (!matDef) return null;
                const qty = (matDef.coefficientM2 && matDef.coefficientM2 > 0 && commonArea.area > 0) 
                    ? matRef.quantity * commonArea.area 
                    : matRef.quantity;
                return { name: matDef.name, unit: matDef.unit, quantity: qty };
            }).filter(Boolean);

            const taskTools = (activityDef.tools || []).map(toolRef => {
                const toolDef = tools.find(t => t.id === toolRef.resourceId);
                return toolDef ? { name: toolDef.name, quantity: toolRef.quantity } : null;
            }).filter(Boolean);

            return {
                id: sa.id,
                time: "08:00 - 17:00",
                areaName: `${commonArea.client} - ${commonArea.environment}`,
                subLocation: `${commonArea.location} ${commonArea.subLocation ? `(${commonArea.subLocation})` : ''}`,
                activityName: activityDef.name,
                description: activityDef.description,
                materials: taskMaterials,
                tools: taskTools
            };
        }).filter(t => t !== null);

        return { employee, date: selectedDate, tasks };
    }, [selectedDate, selectedEmployeeId, teamMembers, scheduledActivities, workPlans, commonAreas, activities, materials, tools]);

    return (
        <div className="p-8 pb-20">
            <div className="non-printable">
                <PageHeader title="Ordem de Serviço">
                     <button 
                        onClick={() => window.print()}
                        disabled={!orderDetails || orderDetails.tasks.length === 0}
                        className={`flex items-center px-5 py-2 rounded-lg text-white text-sm font-bold shadow-md transition-colors ${
                            !orderDetails || orderDetails.tasks.length === 0 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                    >
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Imprimir OS
                    </button>
                </PageHeader>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Data</label>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="block w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-primary-500 text-sm" />
                    </div>
                    <div className="flex-1">
                         <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Colaborador</label>
                         <SearchableSelect options={employeeOptions} value={selectedEmployeeId} onChange={setSelectedEmployeeId} placeholder="Pesquisar por nome ou cargo..." />
                    </div>
                </div>
            </div>

            {orderDetails ? (
                <div id="printable-area" className="bg-white shadow-xl p-10 max-w-[210mm] mx-auto min-h-[297mm] print:shadow-none print:p-0 print:w-full">
                    <header className="border-b-2 border-gray-900 pb-5 mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 uppercase">Ordem de Serviço Diária</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">Planejamento e Gestão de Áreas Comuns</p>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px] font-bold text-gray-400 uppercase">Data de Execução</div>
                             <div className="text-xl font-bold text-gray-800">{formatDate(orderDetails.date)}</div>
                        </div>
                    </header>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 mb-8 grid grid-cols-2 gap-6 print:bg-white print:border-gray-200">
                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Colaborador</span>
                            <span className="block text-lg font-bold text-gray-900">{orderDetails.employee.name}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Função</span>
                            <span className="block text-lg font-medium text-gray-700">{orderDetails.employee.role}</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {orderDetails.tasks.length > 0 ? orderDetails.tasks.map((task: any) => (
                            <div key={task.id} className="border border-gray-200 rounded-xl p-6 break-inside-avoid shadow-sm print:shadow-none">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">{task.activityName}</h4>
                                        <p className="text-sm text-primary-700 font-bold">{task.areaName}</p>
                                        <p className="text-xs text-gray-400 font-medium">{task.subLocation}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg border">{task.time}</span>
                                </div>
                                
                                <div className="text-sm text-gray-600 mb-6 italic border-l-4 border-primary-200 pl-4 bg-gray-50/50 p-2 rounded-r-lg">{task.description}</div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {task.materials.length > 0 && (
                                        <div className="bg-white border border-gray-100 p-4 rounded-lg">
                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-3 pb-2 border-b">Materiais de Insumo</h5>
                                            <ul className="text-xs space-y-2">
                                                {task.materials.map((m: any, i: number) => (
                                                    <li key={i} className="flex justify-between items-center"><span className="text-gray-600">{m.name}</span><span className="font-bold text-gray-900">{m.quantity.toFixed(2)} {m.unit}</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {task.tools.length > 0 && (
                                        <div className="bg-white border border-gray-100 p-4 rounded-lg">
                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-3 pb-2 border-b">Equipamentos Necessários</h5>
                                            <ul className="text-xs space-y-2">
                                                {task.tools.map((t: any, i: number) => (
                                                    <li key={i} className="flex justify-between items-center"><span className="text-gray-600">{t.name}</span><span className="font-bold text-gray-900">{t.quantity} un</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-dashed border-gray-200 flex flex-col gap-3">
                                    <div className="flex items-center gap-3"><div className="h-5 w-5 border-2 border-gray-300 rounded-md"></div><span className="text-[10px] font-bold text-gray-400 uppercase">Confirmar Conclusão</span></div>
                                    <div className="text-[10px] text-gray-300">Observações: __________________________________________________________________________________</div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 border-2 border-dashed rounded-2xl">
                                <ClipboardListIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-medium">Sem tarefas agendadas para esta data.</p>
                            </div>
                        )}
                    </div>

                    {orderDetails.tasks.length > 0 && (
                        <footer className="mt-16 pt-10 border-t-2 border-gray-900 flex justify-between gap-20 print:mt-10">
                            <div className="flex-1 text-center"><div className="border-b border-gray-400 mb-2 h-10"></div><p className="text-[10px] font-bold uppercase text-gray-400">Assinatura Operador</p></div>
                            <div className="flex-1 text-center"><div className="border-b border-gray-400 mb-2 h-10"></div><p className="text-[10px] font-bold uppercase text-gray-400">Assinatura Supervisor</p></div>
                        </footer>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-300 bg-white rounded-2xl border-2 border-dashed border-gray-100 non-printable shadow-sm">
                    <ClipboardListIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-sm font-medium">Selecione data e colaborador para visualizar a Ordem de Serviço</p>
                </div>
            )}
        </div>
    );
};

export default DailyWorkOrders;
