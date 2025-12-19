
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { PrinterIcon, ClipboardListIcon } from '../components/icons';
import SearchableSelect from '../components/SearchableSelect';

const DailyWorkOrders: React.FC = () => {
    const { teamMembers, scheduledActivities, workPlans, commonAreas, activities, materials, tools } = useContext(AppContext)!;
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const [year, month, day] = isoString.split('-');
        return `${day}/${month}/${year}`;
    };

    const employeeOptions = useMemo(() => 
        teamMembers.filter(m => m.isActive).map(m => ({ value: m.id, label: `${m.name} (${m.role})` })), 
    [teamMembers]);

    const orderDetails = useMemo(() => {
        if (!selectedEmployeeId || !selectedDate) return null;
        const employee = teamMembers.find(t => t.id === selectedEmployeeId);
        if (!employee) return null;
        const tasks = scheduledActivities.filter(sa => sa.plannedDate === selectedDate && sa.operatorId === selectedEmployeeId).map(sa => {
            const wp = workPlans.find(p => p.id === sa.workPlanId);
            const area = commonAreas.find(ca => ca.id === wp?.commonAreaId);
            const pa = wp?.plannedActivities?.find(p => p.id === sa.plannedActivityId);
            const act = activities.find(a => a.id === pa?.activityId);
            if (!area || !act) return null;
            return {
                id: sa.id, time: "08:00 - 17:00", areaName: `${area.client} - ${area.environment}`,
                activityName: act.name, description: act.description
            };
        }).filter(t => t !== null);
        return { employee, date: selectedDate, tasks };
    }, [selectedDate, selectedEmployeeId, teamMembers, scheduledActivities, workPlans, commonAreas, activities]);

    return (
        <div className="p-8 pb-20">
            <div className="non-printable">
                <PageHeader title="Ordem de Serviço">
                     <button onClick={() => window.print()} disabled={!orderDetails || orderDetails.tasks.length === 0} className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-md transition-colors ${!orderDetails || orderDetails.tasks.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}><PrinterIcon className="w-5 h-5 mr-2" />Imprimir OS</button>
                </PageHeader>
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Data</label>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm text-sm py-1.5 focus:ring-primary-600" />
                    </div>
                    <div className="flex-1">
                         <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Colaborador</label>
                         <SearchableSelect options={employeeOptions} value={selectedEmployeeId} onChange={setSelectedEmployeeId} placeholder="Pesquisar..." />
                    </div>
                </div>
            </div>

            {orderDetails ? (
                <div id="printable-area" className="bg-white shadow-lg p-10 max-w-[210mm] mx-auto min-h-[297mm] rounded-lg border border-gray-200">
                    <header className="border-b-2 border-gray-900 pb-5 mb-8 flex justify-between">
                        <h1 className="text-2xl font-bold uppercase text-gray-900">Ordem de Serviço Diária</h1>
                        <span className="text-xl font-bold text-gray-800">{formatDate(orderDetails.date)}</span>
                    </header>
                    <div className="bg-gray-50 p-6 rounded-lg mb-8 grid grid-cols-2 gap-6 border border-gray-200">
                        <div><span className="text-[10px] font-bold text-gray-400 uppercase block">Colaborador</span><span className="text-lg font-bold text-gray-900">{orderDetails.employee.name}</span></div>
                        <div><span className="text-[10px] font-bold text-gray-400 uppercase block">Função</span><span className="text-lg font-medium text-gray-700">{orderDetails.employee.role}</span></div>
                    </div>
                    <div className="space-y-6">
                        {orderDetails.tasks.length > 0 ? orderDetails.tasks.map((task: any) => (
                            <div key={task.id} className="border border-gray-200 rounded-lg p-6">
                                <div className="flex justify-between mb-2">
                                    <h4 className="text-lg font-bold text-gray-900">{task.activityName}</h4>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded border border-gray-200">{task.time}</span>
                                </div>
                                <p className="text-sm text-primary-700 font-bold mb-4">{task.areaName}</p>
                                <div className="text-sm text-gray-600 italic border-l-4 border-primary-200 pl-4 py-1">{task.description}</div>
                            </div>
                        )) : <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">Sem tarefas agendadas para esta data.</div>}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-400 bg-white rounded-lg border-2 border-dashed border-gray-200 shadow-md non-printable">
                    <ClipboardListIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-sm font-medium">Selecione data e colaborador para visualizar a Ordem de Serviço</p>
                </div>
            )}
        </div>
    );
};

export default DailyWorkOrders;
