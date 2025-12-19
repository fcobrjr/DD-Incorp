
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { ScheduledActivity, Periodicity, Resource, PlannedActivity } from '../types';
import { CalendarIcon, ListIcon, EyeIcon, FilterIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon, TrashIcon } from '../components/icons';
import useLocalStorage from '../hooks/useLocalStorage';
import SearchableSelect from '../components/SearchableSelect';

type Status = 'Aguardando Programação' | 'Não Iniciada' | 'Em Execução' | 'Concluída' | 'Atrasada';

type EnrichedActivity = {
    id: string;
    plannedDate: string | null;
    executionDate: string | null;
    operatorId?: string;
    status: Status;
    client: string;
    location: string;
    subLocation: string;
    environment: string;
    activityId: string;
    activityName: string;
    activityDescription: string;
    periodicity: Periodicity;
    sla: number;
    tools: (Resource & { quantity: number })[];
    materials: (Resource & { quantity: number })[];
    original: ScheduledActivity | PlannedActivity; 
    workPlanId: string;
};

const STATUS_CONFIG: { [key in Status]: { label: string; color: string; bg: string; border: string; } } = {
    'Aguardando Programação': { label: 'Aguardando Programação', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'Não Iniciada': { label: 'Não Iniciada', color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' },
    'Em Execução': { label: 'Em Execução', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    'Concluída': { label: 'Concluída', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    'Atrasada': { label: 'Atrasada', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const createSafeDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};

const formatDateDisplay = (isoDate: string) => {
    if (!isoDate || typeof isoDate !== 'string') return '';
    const date = createSafeDate(isoDate);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR');
};

const getWeekRange = (date: Date): { startDate: string; endDate: string } => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1); 
    const startOfWeek = new Date(d);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(12, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startDate: formatDateISO(startOfWeek), endDate: formatDateISO(endOfWeek) };
};

const Schedule: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { 
        scheduledActivities, setScheduledActivities, 
        workPlans, commonAreas, activities, teamMembers, tools, materials
    } = context;
    
    const [viewMode, setViewMode] = useLocalStorage<'table' | 'calendar'>('scheduleViewMode', 'calendar');
    const [filters, setFilters] = useLocalStorage('scheduleFilters', {
        search: '',
        startDate: formatDateISO(new Date()),
        endDate: formatDateISO(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        status: 'Todas' as Status | 'Todas',
        operator: '',
        client: '',
    });
    const [showFilters, setShowFilters] = useLocalStorage('scheduleShowFilters', false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<EnrichedActivity | null>(null);
    
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('month');

    const allEnrichedActivities = useMemo<EnrichedActivity[]>(() => {
        const scheduledIds = new Set(scheduledActivities.map(sa => sa.plannedActivityId));
        const enriched: EnrichedActivity[] = [];
        const todayISO = new Date().toISOString().split('T')[0];

        scheduledActivities.forEach(sa => {
            const workPlan = workPlans.find(wp => wp.id === sa.workPlanId);
            const commonArea = commonAreas.find(ca => ca.id === workPlan?.commonAreaId);
            const plannedActivity = workPlan?.plannedActivities?.find(pa => pa.id === sa.plannedActivityId);
            const activityDef = activities.find(a => a.id === plannedActivity?.activityId);
            if(!activityDef || !commonArea || !workPlan) return;

            let status: Status = sa.executionDate ? 'Concluída' : (sa.plannedDate < todayISO ? 'Atrasada' : (sa.plannedDate === todayISO ? 'Em Execução' : 'Não Iniciada'));
            const sla = (activityDef.sla || 0) + (activityDef.slaCoefficient ? (activityDef.slaCoefficient * commonArea.area) : 0);

            enriched.push({
                id: sa.id, plannedDate: sa.plannedDate, executionDate: sa.executionDate, operatorId: sa.operatorId,
                status, client: commonArea.client, location: commonArea.location, subLocation: commonArea.subLocation,
                environment: commonArea.environment, activityId: activityDef.id, activityName: activityDef.name,
                activityDescription: activityDef.description, periodicity: plannedActivity!.periodicity, sla,
                tools: (activityDef.tools || []).map(t => ({ ...tools.find(res => res.id === t.resourceId)!, quantity: t.quantity })).filter(t => t.id),
                materials: (activityDef.materials || []).map(m => ({ ...materials.find(res => res.id === m.resourceId)!, quantity: m.quantity })).filter(m => m.id),
                original: sa, workPlanId: workPlan.id,
            });
        });

        workPlans.forEach(wp => {
            (wp.plannedActivities || []).forEach(pa => {
                if (!scheduledIds.has(pa.id)) {
                    const activityDef = activities.find(a => a.id === pa.activityId);
                    const commonArea = commonAreas.find(ca => ca.id === wp.commonAreaId);
                    if (!activityDef || !commonArea) return;
                    const sla = (activityDef.sla || 0) + (activityDef.slaCoefficient ? (activityDef.slaCoefficient * commonArea.area) : 0);
                    enriched.push({
                        id: pa.id, plannedDate: null, executionDate: null, status: 'Aguardando Programação',
                        client: commonArea.client, location: commonArea.location, subLocation: commonArea.subLocation,
                        environment: commonArea.environment, activityId: activityDef.id, activityName: activityDef.name,
                        activityDescription: activityDef.description, periodicity: pa.periodicity, sla,
                        tools: (activityDef.tools || []).map(t => ({ ...tools.find(res => res.id === t.resourceId)!, quantity: t.quantity })).filter(t => t.id),
                        materials: (activityDef.materials || []).map(m => ({ ...materials.find(res => res.id === m.resourceId)!, quantity: m.quantity })).filter(m => m.id),
                        original: pa, workPlanId: wp.id,
                    });
                }
            });
        });
        return enriched;
    }, [scheduledActivities, workPlans, activities, commonAreas, tools, materials]);

    const filteredActivities = useMemo(() => {
        return allEnrichedActivities.filter(act => {
            if (filters.search && !act.activityName.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.status !== 'Todas' && act.status !== filters.status) return false;
            if (filters.client && act.client !== filters.client) return false;
            if (viewMode === 'table') {
                if (!act.plannedDate) return false;
                if (filters.startDate && act.plannedDate < filters.startDate) return false;
                if (filters.endDate && act.plannedDate > filters.endDate) return false;
            }
            return true;
        }).sort((a,b) => (a.plannedDate || '9999').localeCompare(b.plannedDate || '9999'));
    }, [allEnrichedActivities, filters, viewMode]);

    const handlePrev = () => {
        const d = new Date(currentCalendarDate);
        if (calendarViewMode === 'month') d.setMonth(d.getMonth() - 1);
        else if (calendarViewMode === 'week') d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCurrentCalendarDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentCalendarDate);
        if (calendarViewMode === 'month') d.setMonth(d.getMonth() + 1);
        else if (calendarViewMode === 'week') d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCurrentCalendarDate(d);
    };

    const renderMonthView = () => {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const emptySlots = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
        for (let i = 0; i < emptySlots; i++) days.push(<div key={`empty-${i}`} className="border-r border-b border-gray-200 min-h-[100px] bg-gray-50/30"></div>);
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatDateISO(new Date(year, month, d, 12, 0, 0));
            const dayActivities = filteredActivities.filter(a => a.plannedDate === dateStr);
            days.push(
                <div key={dateStr} className="border-r border-b border-gray-200 min-h-[100px] p-2 hover:bg-gray-50 transition-colors group">
                    <span className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full ${dateStr === formatDateISO(new Date()) ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>{d}</span>
                    <div className="mt-1 space-y-1">
                        {dayActivities.slice(0, 3).map(a => (
                            <div key={a.id} onClick={() => { setSelectedActivity(a); setIsPanelOpen(true); }} className={`text-[10px] p-1 rounded border truncate cursor-pointer font-semibold ${STATUS_CONFIG[a.status].bg} ${STATUS_CONFIG[a.status].color} ${STATUS_CONFIG[a.status].border}`}>{a.activityName}</div>
                        ))}
                    </div>
                </div>
            );
        }
        return <div className="grid grid-cols-7 border-l border-t border-gray-200 bg-white">{days}</div>;
    };

    const renderWeekView = () => {
        const range = getWeekRange(currentCalendarDate);
        const start = createSafeDate(range.startDate);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const dateStr = formatDateISO(d);
            const dayActivities = filteredActivities.filter(a => a.plannedDate === dateStr);
            days.push(
                <div key={dateStr} className="border-r border-b border-gray-200 min-h-[400px] p-2 bg-white hover:bg-gray-50 transition-colors">
                    <div className="text-center mb-4">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold ${dateStr === formatDateISO(new Date()) ? 'bg-primary-600 text-white' : 'text-gray-700'}`}>{d.getDate()}</span>
                    </div>
                    <div className="space-y-2">
                        {dayActivities.map(a => (
                            <div key={a.id} onClick={() => { setSelectedActivity(a); setIsPanelOpen(true); }} className={`text-[11px] p-2 rounded border cursor-pointer font-semibold shadow-sm hover:shadow transition-all ${STATUS_CONFIG[a.status].bg} ${STATUS_CONFIG[a.status].color} ${STATUS_CONFIG[a.status].border}`}>
                                {a.activityName}
                                <span className="block text-[9px] mt-1 opacity-70 truncate">{a.client}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return <div className="grid grid-cols-7 border-l border-t border-gray-200">{days}</div>;
    };

    const renderDayView = () => {
        const dateStr = formatDateISO(currentCalendarDate);
        const dayActivities = filteredActivities.filter(a => a.plannedDate === dateStr);
        return (
            <div className="p-6 bg-white min-h-[400px]">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-xl font-bold text-gray-900">{currentCalendarDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                        <p className="text-sm text-gray-500">{dayActivities.length} tarefas programadas</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayActivities.length > 0 ? dayActivities.map(a => (
                        <div key={a.id} onClick={() => { setSelectedActivity(a); setIsPanelOpen(true); }} className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${STATUS_CONFIG[a.status].bg} ${STATUS_CONFIG[a.status].color} ${STATUS_CONFIG[a.status].border}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold">{a.activityName}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/50 border border-current">{a.status}</span>
                            </div>
                            <p className="text-xs opacity-80 mb-3">{a.client} • {a.environment}</p>
                            <div className="flex items-center text-[10px] font-bold">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                SLA: {a.sla} min
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-20 text-gray-400">Nenhuma atividade para este dia.</div>
                    )}
                </div>
            </div>
        );
    };

    const currentRangeText = useMemo(() => {
        const formatDateShort = (d: Date) => {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            return `${day}/${month}/${year}`;
        };

        if (calendarViewMode === 'month') {
            return currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        }
        if (calendarViewMode === 'week') {
            const range = getWeekRange(currentCalendarDate);
            const start = createSafeDate(range.startDate);
            const end = createSafeDate(range.endDate);
            return `Semana de ${formatDateShort(start)} a ${formatDateShort(end)}`;
        }
        return currentCalendarDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    }, [currentCalendarDate, calendarViewMode]);

    return (
        <div className="p-8">
            <PageHeader title="Agenda">
                <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
                        <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-200'}`}><ListIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-200'}`}><CalendarIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </PageHeader>
            
            <div className="mb-6 flex justify-end">
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-200 hover:text-primary-600'}`}><FilterIcon className="w-5 h-5 mr-2" />{showFilters ? 'Ocultar Filtros' : 'Filtros'}</button>
            </div>

            {showFilters && (
                <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Busca</label>
                        <input type="text" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Termo..." className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-primary-500" />
                    </div>
                </div>
            )}

            {viewMode === 'calendar' ? (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
                    <header className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded transition-all text-gray-400"> <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={handleNext} className="p-1.5 hover:bg-white rounded transition-all text-gray-400"> <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
                        </div>
                        <h3 className="text-md font-bold text-gray-700 capitalize">
                            {currentRangeText}
                        </h3>
                        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 border border-gray-200">
                            <button onClick={() => setCalendarViewMode('month')} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${calendarViewMode === 'month' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Mês</button>
                            <button onClick={() => setCalendarViewMode('week')} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${calendarViewMode === 'week' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Semana</button>
                            <button onClick={() => setCalendarViewMode('day')} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${calendarViewMode === 'day' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Dia</button>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto">
                        {calendarViewMode === 'month' && (
                            <>
                                <div className="grid grid-cols-7 text-center font-bold text-[10px] py-3 bg-gray-50/50 border-b border-gray-100 text-gray-400 uppercase"><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div><div>Dom</div></div>
                                {renderMonthView()}
                            </>
                        )}
                        {calendarViewMode === 'week' && renderWeekView()}
                        {calendarViewMode === 'day' && renderDayView()}
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredActivities.length > 0 ? filteredActivities.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.activityName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.client}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateDisplay(item.plannedDate || '')}</td>
                                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CONFIG[item.status].bg} ${STATUS_CONFIG[item.status].color} ${STATUS_CONFIG[item.status].border}`}>{item.status}</span></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedActivity(item); setIsPanelOpen(true); }} className="text-primary-600 p-2 hover:bg-primary-100 rounded-full transition-colors"><EyeIcon className="w-5 h-5"/></button></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma atividade agendada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Schedule;
