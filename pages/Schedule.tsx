
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
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
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

    // --- CALENDAR LOGIC ---

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
        const emptySlots = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); // Monday start
        for (let i = 0; i < emptySlots; i++) days.push(<div key={`empty-${i}`} className="border-r border-b min-h-[100px] bg-gray-50/30"></div>);

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatDateISO(new Date(year, month, d, 12, 0, 0));
            const dayActivities = filteredActivities.filter(a => a.plannedDate === dateStr);
            days.push(
                <div key={dateStr} className="border-r border-b min-h-[100px] p-2 hover:bg-gray-50 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full ${dateStr === formatDateISO(new Date()) ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>{d}</span>
                    </div>
                    <div className="space-y-1">
                        {dayActivities.slice(0, 3).map(a => (
                            <div key={a.id} onClick={() => { setSelectedActivity(a); setIsPanelOpen(true); }} className={`text-[10px] p-1 rounded border truncate cursor-pointer font-medium ${STATUS_CONFIG[a.status].bg} ${STATUS_CONFIG[a.status].color} ${STATUS_CONFIG[a.status].border}`}>{a.activityName}</div>
                        ))}
                        {dayActivities.length > 3 && <div className="text-[9px] text-gray-400 font-medium pl-1">+ {dayActivities.length - 3} atividades</div>}
                    </div>
                </div>
            );
        }
        return <div className="grid grid-cols-7 border-l border-t bg-white">{days}</div>;
    };

    const renderWeekView = () => {
        const { startDate } = getWeekRange(currentCalendarDate);
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = createSafeDate(startDate); d.setDate(d.getDate() + i);
            const dateStr = formatDateISO(d);
            const dayActivities = filteredActivities.filter(a => a.plannedDate === dateStr);
            weekDays.push(
                <div key={dateStr} className="border-r min-h-[400px] flex flex-col bg-white">
                    <div className={`p-3 border-b text-center ${dateStr === formatDateISO(new Date()) ? 'bg-primary-50/50' : 'bg-gray-50/50'}`}>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                        <span className={`text-lg font-bold ${dateStr === formatDateISO(new Date()) ? 'text-primary-600' : 'text-gray-700'}`}>{d.getDate()}</span>
                    </div>
                    <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                        {dayActivities.map(a => (
                            <div key={a.id} onClick={() => { setSelectedActivity(a); setIsPanelOpen(true); }} className={`text-[10px] p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${STATUS_CONFIG[a.status].bg} ${STATUS_CONFIG[a.status].color} ${STATUS_CONFIG[a.status].border}`}>
                                <div className="font-bold line-clamp-1">{a.activityName}</div>
                                <div className="text-[9px] opacity-70 mt-0.5">{a.client}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return <div className="grid grid-cols-7 border-l border-b">{weekDays}</div>;
    };

    const renderDayView = () => {
        const dateStr = formatDateISO(currentCalendarDate);
        const dayActivities = filteredActivities.filter(a => a.plannedDate === dateStr);
        return (
            <div className="p-6 bg-white min-h-[400px]">
                <div className="mb-6 border-b pb-4">
                    <h4 className="text-xl font-bold text-gray-800 capitalize">{currentCalendarDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                    <p className="text-sm text-gray-500 font-medium mt-1">{dayActivities.length} atividades no cronograma</p>
                </div>
                {dayActivities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayActivities.map(a => (
                            <div key={a.id} onClick={() => { setSelectedActivity(a); setIsPanelOpen(true); }} className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all ${STATUS_CONFIG[a.status].bg} ${STATUS_CONFIG[a.status].border}`}>
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-2 ${STATUS_CONFIG[a.status].color} bg-white/50 border ${STATUS_CONFIG[a.status].border}`}>{a.status}</span>
                                <h5 className={`text-sm font-bold mb-1 ${STATUS_CONFIG[a.status].color}`}>{a.activityName}</h5>
                                <div className="text-xs opacity-70 font-medium">{a.client} · {a.environment}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300 italic"><p className="text-sm">Nenhuma atividade para este dia</p></div>
                )}
            </div>
        );
    };

    const calendarHeaderTitle = useMemo(() => {
        if (calendarViewMode === 'month') return <><span className="capitalize">{currentCalendarDate.toLocaleString('pt-BR', { month: 'long' })}</span><span className="text-primary-600 ml-2 font-bold">{currentCalendarDate.getFullYear()}</span></>;
        if (calendarViewMode === 'week') {
            const { startDate, endDate } = getWeekRange(currentCalendarDate);
            const start = createSafeDate(startDate); const end = createSafeDate(endDate);
            return <span className="text-lg font-bold text-gray-700">{start.getDate()} {start.toLocaleString('pt-BR', { month: 'short' })} — {end.getDate()} {end.toLocaleString('pt-BR', { month: 'short' })}, {end.getFullYear()}</span>;
        }
        return <span className="text-lg font-bold text-gray-800 capitalize">{currentCalendarDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>;
    }, [calendarViewMode, currentCalendarDate]);

    return (
        <div className="p-8">
            <PageHeader title="Agenda">
                <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
                        <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-200'}`}><ListIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:bg-gray-200'}`}><CalendarIcon className="w-5 h-5"/></button>
                    </div>
                    <button onClick={() => setIsGenerateModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-all shadow-sm">Gerar Agenda</button>
                </div>
            </PageHeader>
            
            <div className="mb-6 flex justify-end">
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center text-xs font-bold px-4 py-2 rounded-lg border transition-all ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-500 border-gray-200 hover:text-primary-600 shadow-sm'}`}><FilterIcon className="w-4 h-4 mr-2" />{showFilters ? 'Ocultar filtros' : 'Filtros'}</button>
            </div>

            {showFilters && (
                <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Busca</label>
                        <input type="text" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} placeholder="Termo..." className="block w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Status</label>
                        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as any})} className="block w-full rounded-lg border bg-gray-50 text-sm py-2 px-2">
                            <option value="Todas">Todos</option>
                            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Cliente</label>
                        <select value={filters.client} onChange={e => setFilters({...filters, client: e.target.value})} className="block w-full rounded-lg border bg-gray-50 text-sm py-2 px-2">
                            <option value="">Todos</option>
                            {[...new Set(commonAreas.map(a => a.client))].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {viewMode === 'calendar' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <header className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gray-100 p-1 rounded-lg border">
                                <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded transition-all text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
                                <button onClick={() => setCurrentCalendarDate(new Date())} className="px-3 py-1 bg-white text-primary-700 font-bold text-[10px] uppercase rounded shadow-sm hover:bg-primary-50 mx-1 border border-primary-50">Hoje</button>
                                <button onClick={handleNext} className="p-1.5 hover:bg-white rounded transition-all text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
                            </div>
                            <h3 className="text-md font-bold text-gray-700">{calendarHeaderTitle}</h3>
                        </div>
                        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 border">
                            {(['month', 'week', 'day'] as const).map(m => (
                                <button key={m} onClick={() => setCalendarViewMode(m)} className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${calendarViewMode === m ? 'bg-white text-primary-600 shadow-sm border' : 'text-gray-400 hover:text-primary-500'}`}>{m === 'month' ? 'Mês' : m === 'week' ? 'Semana' : 'Dia'}</button>
                            ))}
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto">
                        {calendarViewMode !== 'day' && <div className="grid grid-cols-7 text-center font-bold text-[10px] py-3 bg-gray-50/50 border-b border-gray-100 text-gray-400 uppercase"><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div><div>Dom</div></div>}
                        {calendarViewMode === 'month' && renderMonthView()}
                        {calendarViewMode === 'week' && renderWeekView()}
                        {calendarViewMode === 'day' && renderDayView()}
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4 text-left">Atividade</th>
                                <th className="px-6 py-4 text-left">Local</th>
                                <th className="px-6 py-4 text-left">Data</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredActivities.length > 0 ? filteredActivities.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4"><div className="text-sm font-bold text-gray-800">{item.activityName}</div><div className="text-[10px] text-gray-400 font-medium">{item.periodicity}</div></td>
                                    <td className="px-6 py-4"><div className="text-xs font-bold text-gray-700">{item.client}</div><div className="text-[10px] text-gray-400">{item.environment}</div></td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatDateDisplay(item.plannedDate || '')}</td>
                                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[item.status].bg} ${STATUS_CONFIG[item.status].color} ${STATUS_CONFIG[item.status].border}`}>{item.status}</span></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedActivity(item); setIsPanelOpen(true); }} className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-all"><EyeIcon className="w-5 h-5"/></button></td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center py-20 text-gray-400 text-sm font-medium italic">Nenhum registro encontrado</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Side Panel */}
            {isPanelOpen && selectedActivity && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in" onClick={() => setIsPanelOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 flex flex-col border-l border-gray-100 animate-in slide-in-from-right">
                        <button onClick={() => setIsPanelOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-600 text-2xl transition-all">&times;</button>
                        <div className="mb-8 pt-4">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[selectedActivity.status].bg} ${STATUS_CONFIG[selectedActivity.status].color} ${STATUS_CONFIG[selectedActivity.status].border}`}>{selectedActivity.status}</span>
                            <h3 className="text-xl font-bold text-gray-800 mt-4 leading-tight">{selectedActivity.activityName}</h3>
                            <p className="text-sm text-gray-500 mt-2 font-medium">{selectedActivity.activityDescription}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col gap-3 mb-8">
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Local</span><span className="text-sm font-bold text-gray-700">{selectedActivity.client} · {selectedActivity.location}</span></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Data</span><span className="text-sm font-bold text-gray-700">{formatDateDisplay(selectedActivity.plannedDate || 'Aguardando')}</span></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-400 uppercase">Ambiente</span><span className="text-sm font-bold text-gray-700">{selectedActivity.environment}</span></div>
                        </div>
                        <div className="mt-auto space-y-3">
                            <button className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all active:scale-95">Salvar alterações</button>
                            <button className="w-full py-3 bg-white text-red-500 border border-red-50 rounded-xl font-bold text-xs hover:bg-red-50 transition-all">Remover da agenda</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
