
import React, { useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { ScheduledActivity, Periodicity, Activity, Resource, WorkPlan, PlannedActivity, TeamMember } from '../types';
import { CalendarIcon, ListIcon, BarChartIcon, EyeIcon, FilterIcon, PrinterIcon } from '../components/icons';
import useLocalStorage from '../hooks/useLocalStorage';

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
    'Aguardando Programação': { label: 'Aguardando Programação', color: 'text-yellow-800', bg: 'bg-yellow-100', border: 'border-yellow-400' },
    'Não Iniciada': { label: 'Não Iniciada', color: 'text-gray-800', bg: 'bg-gray-200', border: 'border-gray-400' },
    'Em Execução': { label: 'Em Execução', color: 'text-blue-800', bg: 'bg-blue-100', border: 'border-blue-400' },
    'Concluída': { label: 'Concluída', color: 'text-green-800', bg: 'bg-green-100', border: 'border-green-400' },
    'Atrasada': { label: 'Atrasada', color: 'text-red-800', bg: 'bg-red-100', border: 'border-red-400' },
};

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

const PERIODICITY_OPTIONS: string[] = ['Diário', 'Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];

const getNextDate = (currentDate: Date, periodicity: Periodicity): Date => {
    const nextDate = new Date(currentDate);
    
    // Check for custom periodicity: "Cada X dias"
    if (periodicity.startsWith('Cada ')) {
        const parts = periodicity.split(' ');
        const days = parseInt(parts[1]);
        if (!isNaN(days) && days > 0) {
            nextDate.setDate(nextDate.getDate() + days);
            return nextDate;
        }
    }

    switch (periodicity) {
        case 'Diário': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'Semanal': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'Quinzenal': nextDate.setDate(nextDate.getDate() + 15); break;
        case 'Mensal': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'Bimestral': nextDate.setMonth(nextDate.getMonth() + 2); break;
        case 'Trimestral': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case 'Semestral': nextDate.setMonth(nextDate.getMonth() + 6); break;
        case 'Anual': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
        default: nextDate.setDate(nextDate.getDate() + 1); // Fallback
    }
    return nextDate;
};

const getWeekRange = (date = new Date()): { startDate: string; endDate: string } => {
    const today = new Date(date);
    const day = today.getDay(); // Sunday - 0, Monday - 1, ...
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const startOfWeek = new Date(today.setDate(diff));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0],
    };
};

const getMonthRange = (date = new Date()): { startDate: string; endDate: string } => {
    const today = new Date(date);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
    };
};

const formatDateISO = (date: Date) => date.toISOString().split('T')[0];

const formatDateDisplay = (isoDate: string) => {
    if (!isoDate || typeof isoDate !== 'string') return '';
    const date = new Date(isoDate + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};


interface CalendarPickerProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    onClose: () => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onDateSelect, onClose }) => {
    const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    const [currentDate, setCurrentDate] = useState(initialDate);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const changeMonth = (amount: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1));
    };

    const getMonthDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: React.ReactElement[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`pad-${i}`} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isoDate = formatDateISO(date);
            const isSelected = isoDate === selectedDate;
            const isToday = isoDate === formatDateISO(new Date());

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => onDateSelect(isoDate)}
                    className={`w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50
                        ${isSelected ? 'bg-primary-600 text-white font-bold shadow' :
                        isToday ? 'bg-primary-100 text-primary-700 font-semibold' :
                        'text-gray-700 hover:bg-gray-100'}`}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();
    const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <div ref={calendarRef} className="absolute top-full mt-2 z-10 bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-72">
            <div className="flex justify-between items-center mb-3">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400">&lt;</button>
                <div className="font-semibold text-gray-800 capitalize">{monthName} de {year}</div>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-medium mb-2">
                {weekdays.map((day, i) => <div key={i}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {getMonthDays()}
            </div>
        </div>
    );
};


const Schedule: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { 
        scheduledActivities, setScheduledActivities, 
        workPlans,
        commonAreas, activities,
        teamMembers, tools, materials
    } = context;
    
    const { startDate: initialStartDate, endDate: initialEndDate } = getWeekRange();
    
    const initialFilters = {
        startDate: initialStartDate,
        endDate: initialEndDate,
        status: 'Todas' as Status | 'Todas',
        operator: '',
        activityId: '',
        client: '',
        location: '',
        subLocation: '',
        environment: '',
        periodicity: '' as Periodicity | '',
    };

    const [viewMode, setViewMode] = useLocalStorage<'table' | 'calendar' | 'dashboard'>('scheduleViewMode', 'table');
    const [filters, setFilters] = useLocalStorage('scheduleFilters', initialFilters);
    const [showFilters, setShowFilters] = useLocalStorage('scheduleShowFilters', false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<EnrichedActivity | null>(null);
    const [activeCalendar, setActiveCalendar] = useState<'startDate' | 'endDate' | null>(null);

    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('month');

    const allEnrichedActivities = useMemo<EnrichedActivity[]>(() => {
        const scheduledIds = new Set(scheduledActivities.map(sa => sa.plannedActivityId));
        const enriched: EnrichedActivity[] = [];
        const todayISO = new Date().toISOString().split('T')[0];

        // Process scheduled activities
        scheduledActivities.forEach(sa => {
            const workPlan = workPlans.find(wp => wp.id === sa.workPlanId);
            if (!workPlan) return;
            
            const plannedActivity = (workPlan.plannedActivities || []).find(pa => pa.id === sa.plannedActivityId);
            if (!plannedActivity) return; // CRITICAL FIX: Skip if planned activity was deleted from work plan
            
            const activityDef = activities.find(a => a.id === plannedActivity.activityId);
            const commonArea = commonAreas.find(ca => ca.id === workPlan.commonAreaId);

            if(!activityDef || !commonArea) return;

            let status: Status;
            if (sa.executionDate) {
                status = 'Concluída';
            } else if (sa.plannedDate < todayISO) {
                status = 'Atrasada';
            } else if (sa.plannedDate === todayISO) {
                status = 'Em Execução';
            } else {
                status = 'Não Iniciada';
            }
            
            const enrichedTools = (activityDef.tools || [])
                .map(t => {
                    const toolDef = tools.find(res => res.id === t.resourceId);
                    return toolDef ? { ...toolDef, quantity: t.quantity } : null;
                })
                .filter((t): t is Resource & { quantity: number } => t !== null);

            const enrichedMaterials = (activityDef.materials || [])
                .map(m => {
                    const materialDef = materials.find(res => res.id === m.resourceId);
                    return materialDef ? { ...materialDef, quantity: m.quantity } : null;
                })
                .filter((m): m is Resource & { quantity: number } => m !== null);

            enriched.push({
                id: sa.id,
                plannedDate: sa.plannedDate,
                executionDate: sa.executionDate,
                operatorId: sa.operatorId,
                status,
                client: commonArea.client,
                location: commonArea.location,
                subLocation: commonArea.subLocation,
                environment: commonArea.environment,
                activityId: activityDef.id,
                activityName: activityDef.name,
                activityDescription: activityDef.description,
                periodicity: plannedActivity.periodicity,
                sla: activityDef.sla,
                tools: enrichedTools,
                materials: enrichedMaterials,
                original: sa,
                workPlanId: workPlan.id,
            });
        });

        // Process unscheduled activities from work plans
        workPlans.forEach(wp => {
            if (!wp.plannedActivities) return;

            wp.plannedActivities.forEach(pa => {
                if (!scheduledIds.has(pa.id)) {
                    const activityDef = activities.find(a => a.id === pa.activityId);
                    const commonArea = commonAreas.find(ca => ca.id === wp.commonAreaId);

                    if (!activityDef || !commonArea) return;
                    
                    const enrichedTools = (activityDef.tools || [])
                        .map(t => {
                            const toolDef = tools.find(res => res.id === t.resourceId);
                            return toolDef ? { ...toolDef, quantity: t.quantity } : null;
                        })
                        .filter((t): t is Resource & { quantity: number } => t !== null);
        
                    const enrichedMaterials = (activityDef.materials || [])
                        .map(m => {
                            const materialDef = materials.find(res => res.id === m.resourceId);
                            return materialDef ? { ...materialDef, quantity: m.quantity } : null;
                        })
                        .filter((m): m is Resource & { quantity: number } => m !== null);

                     enriched.push({
                        id: pa.id,
                        plannedDate: null,
                        executionDate: null,
                        status: 'Aguardando Programação',
                        client: commonArea.client,
                        location: commonArea.location,
                        subLocation: commonArea.subLocation,
                        environment: commonArea.environment,
                        activityId: activityDef.id,
                        activityName: activityDef.name,
                        activityDescription: activityDef.description,
                        periodicity: pa.periodicity,
                        sla: activityDef.sla,
                        tools: enrichedTools,
                        materials: enrichedMaterials,
                        original: pa,
                        workPlanId: wp.id,
                    });
                }
            });
        });

        return enriched;

    }, [scheduledActivities, workPlans, activities, commonAreas, tools, materials]);

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

    const clearFilters = () => setFilters(initialFilters);

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


    const filteredActivities = useMemo(() => {
        return allEnrichedActivities.filter(act => {
            if (filters.status !== 'Todas' && act.status !== filters.status) return false;
            if (filters.operator && act.operatorId !== filters.operator) return false;
            if (filters.activityId && act.activityId !== filters.activityId) return false;
            if (filters.client && act.client !== filters.client) return false;
            if (filters.location && act.location !== filters.location) return false;
            if (filters.subLocation && act.subLocation !== filters.subLocation) return false;
            if (filters.environment && act.environment !== filters.environment) return false;
            if (filters.periodicity && act.periodicity !== filters.periodicity) return false;

            if (viewMode !== 'calendar'){
                // If filtering specifically for "Aguardando Programação", ignore date range
                if (filters.status === 'Aguardando Programação') {
                    return act.status === 'Aguardando Programação';
                }

                // For all other statuses, activity must have a date and be within range
                if (!act.plannedDate) return false;
                if (filters.startDate && act.plannedDate < filters.startDate) return false;
                if (filters.endDate && act.plannedDate > filters.endDate) return false;
            }
            
            return true;
        }).sort((a,b) => (a.plannedDate || 'z').localeCompare(b.plannedDate || 'z'));
    }, [allEnrichedActivities, filters, viewMode]);
    
    const summaryCounts = useMemo(() => {
        const counts: { [key in Status]: number } = {
            'Aguardando Programação': 0, 'Não Iniciada': 0, 'Em Execução': 0, 'Concluída': 0, 'Atrasada': 0,
        };
        allEnrichedActivities.forEach(act => counts[act.status]++);
        return counts;
    }, [allEnrichedActivities]);

    const handleSummaryClick = (status: Status) => {
        const { startDate, endDate } = getMonthRange();
        setViewMode('table');
        setFilters({
            ...initialFilters,
            startDate,
            endDate,
            status,
        });
    };

    const handleGenerateSchedule = useCallback((days: number) => {
        const newScheduled: ScheduledActivity[] = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        
        workPlans.forEach(wp => {
            if (!wp.plannedActivities) return;
            wp.plannedActivities.forEach(pa => {
                let lastExecution: ScheduledActivity | undefined = scheduledActivities
                    .filter(sa => sa.plannedActivityId === pa.id && sa.executionDate)
                    .sort((a, b) => b.executionDate!.localeCompare(a.executionDate!))[0];
                
                let nextDate = lastExecution ? getNextDate(new Date(lastExecution.executionDate!), pa.periodicity) : new Date(today);

                while (nextDate <= new Date(today.getTime() + days * 24 * 60 * 60 * 1000)) {
                    const nextDateISO = nextDate.toISOString().split('T')[0];
                    const alreadyExists = scheduledActivities.some(sa => sa.plannedActivityId === pa.id && sa.plannedDate === nextDateISO);

                    if (!alreadyExists) {
                        newScheduled.push({
                            id: `sa-${wp.id}-${pa.id}-${nextDateISO}`,
                            workPlanId: wp.id,
                            plannedActivityId: pa.id,
                            plannedDate: nextDateISO,
                            executionDate: null,
                            operatorId: lastExecution?.operatorId,
                        });
                    }
                    nextDate = getNextDate(nextDate, pa.periodicity);
                }
            });
        });

        if (newScheduled.length > 0) {
            setScheduledActivities(prev => [...prev, ...newScheduled]);
        }
        alert(`${newScheduled.length} novas atividades foram geradas.`);
        setIsGenerateModalOpen(false);
    }, [workPlans, scheduledActivities, setScheduledActivities]);

    const handleOpenPanel = (activity: EnrichedActivity) => {
        setSelectedActivity(activity);
        setIsPanelOpen(true);
    };
    
    const handleRegisterExecution = () => {
        if (!selectedActivity || !selectedActivity.plannedDate) return;
        const originalId = selectedActivity.original.id;
        const todayISO = new Date().toISOString().split('T')[0];

        // Mark current as complete
        setScheduledActivities(prev => prev.map(sa => sa.id === originalId ? {...sa, executionDate: todayISO} : sa));

        // Generate next occurrence
        const nextDate = getNextDate(new Date(selectedActivity.plannedDate), selectedActivity.periodicity);
        const nextDateISO = nextDate.toISOString().split('T')[0];
        
        const newScheduled: ScheduledActivity = {
            id: `sa-${selectedActivity.workPlanId}-${(selectedActivity.original as ScheduledActivity).plannedActivityId}-${nextDateISO}`,
            workPlanId: selectedActivity.workPlanId,
            plannedActivityId: (selectedActivity.original as ScheduledActivity).plannedActivityId,
            plannedDate: nextDateISO,
            executionDate: null,
            operatorId: selectedActivity.operatorId,
        };
        setScheduledActivities(prev => [...prev, newScheduled]);
        setIsPanelOpen(false);
    };

    const handleReassign = (operatorId: string) => {
        if (!selectedActivity) return;
        const originalId = selectedActivity.original.id;
        setScheduledActivities(prev => prev.map(sa => sa.id === originalId ? {...sa, operatorId} : sa));
        setSelectedActivity(prev => prev ? {...prev, operatorId} : null);
    };
    
    const handleReschedule = (newDate: string) => {
        if (!selectedActivity || !newDate) return;
        const originalId = selectedActivity.original.id;
        setScheduledActivities(prev => prev.map(sa => sa.id === originalId ? {...sa, plannedDate: newDate} : sa));
        setIsPanelOpen(false);
    }
    
    const handlePrint = () => {
        window.print();
    };

    const handleDateNav = (amount: number) => {
        setCurrentCalendarDate(prevDate => {
            const newDate = new Date(prevDate);
            if (calendarViewMode === 'month') {
                newDate.setMonth(newDate.getMonth() + amount);
            } else if (calendarViewMode === 'week') {
                newDate.setDate(newDate.getDate() + (amount * 7));
            } else if (calendarViewMode === 'day') {
                newDate.setDate(newDate.getDate() + amount);
            }
            return newDate;
        });
    };

    const renderCalendar = () => {
        const getCalendarTitle = () => {
            if (calendarViewMode === 'month') {
                return currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            }
            if (calendarViewMode === 'week') {
                const startOfWeek = new Date(currentCalendarDate);
                const day = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
                startOfWeek.setDate(diff);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                return `${formatDateDisplay(formatDateISO(startOfWeek))} - ${formatDateDisplay(formatDateISO(endOfWeek))}`;
            }
            return formatDateDisplay(formatDateISO(currentCalendarDate));
        };

        const getTodayButtonText = () => {
            switch (calendarViewMode) {
                case 'month': return 'Este Mês';
                case 'week': return 'Esta Semana';
                case 'day': return 'Hoje';
                default: return 'Hoje';
            }
        };

        const renderMonthView = () => {
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const startingDay = firstDayOfMonth.getDay(); // 0 for Sunday
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const grid = [];
            
            for (let i = 0; i < startingDay; i++) {
                grid.push(<div key={`empty-start-${i}`} className="border-r border-b border-gray-200"></div>);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isoDate = formatDateISO(date);
                const isToday = isoDate === formatDateISO(new Date());
                const activitiesForDay = filteredActivities.filter(a => a.plannedDate === isoDate);

                grid.push(
                    <div key={isoDate} className="border-r border-b border-gray-200 p-1.5 min-h-[120px] flex flex-col">
                        <span className={`font-semibold text-sm ${isToday ? 'bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700'}`}>{day}</span>
                        <div className="flex-grow mt-1 space-y-1 overflow-y-auto">
                            {activitiesForDay.map(act => (
                                <div key={act.id} onClick={() => handleOpenPanel(act)} className={`calendar-event text-xs p-1 rounded cursor-pointer truncate ${STATUS_CONFIG[act.status].bg} ${STATUS_CONFIG[act.status].color} border-l-4 ${STATUS_CONFIG[act.status].border}`}>
                                    {act.activityName}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
             while (grid.length % 7 !== 0) {
                grid.push(<div key={`empty-end-${grid.length}`} className="border-r border-b border-gray-200"></div>);
            }

            return <div className="grid grid-cols-7">{grid}</div>;
        };
        
        const renderWeekView = () => {
            const year = currentCalendarDate.getFullYear();
            const month = currentCalendarDate.getMonth();
            const date = currentCalendarDate.getDate();
            const dayOfWeek = currentCalendarDate.getDay(); 

            const startOfWeek = new Date(year, month, date - dayOfWeek);

            const weekDates = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(startOfWeek);
                d.setDate(d.getDate() + i);
                return d;
            });

            return (
                <div className="grid grid-cols-7 border-t border-gray-200">
                    {weekDates.map(date => {
                        const isoDate = formatDateISO(date);
                        const isToday = isoDate === formatDateISO(new Date());
                        const activitiesForDay = filteredActivities.filter(a => a.plannedDate === isoDate);
                        
                        return (
                            <div key={isoDate} className="border-r border-b border-gray-200 p-1.5 min-h-[300px] flex flex-col">
                                <span className={`font-semibold text-sm mb-2 text-center ${isToday ? 'bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : 'text-gray-700'}`}>
                                    {date.getDate()}
                                </span>
                                <div className="flex-grow space-y-1 overflow-y-auto">
                                    {activitiesForDay.map(act => (
                                        <div 
                                            key={act.id} 
                                            onClick={() => handleOpenPanel(act)} 
                                            className={`calendar-event text-xs p-1 rounded cursor-pointer ${STATUS_CONFIG[act.status].bg} ${STATUS_CONFIG[act.status].color} border-l-4 ${STATUS_CONFIG[act.status].border}`}
                                        >
                                            <p className="font-bold">{act.activityName}</p>
                                            <p className="truncate">{act.environment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        };

        const renderDayView = () => {
            const isoDate = formatDateISO(currentCalendarDate);
            const activitiesForDay = filteredActivities.filter(a => a.plannedDate === isoDate);
    
            if (activitiesForDay.length === 0) {
                return <div className="p-8 text-center text-gray-500">Nenhuma atividade programada para este dia.</div>;
            }
    
            return (
                <div className="p-4 space-y-4">
                    {activitiesForDay.map(act => (
                        <div 
                            key={act.id} 
                            onClick={() => handleOpenPanel(act)}
                            className={`p-4 rounded-lg shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow duration-200 ${STATUS_CONFIG[act.status].border} bg-white`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{act.activityName}</p>
                                    <p className="text-sm text-gray-600">{`${act.location} - ${act.environment}`}</p>
                                    <p className="text-xs text-gray-500 mt-1">Operador: {teamMembers.find(t => t.id === act.operatorId)?.name || 'Não atribuído'}</p>
                                </div>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_CONFIG[act.status].bg} ${STATUS_CONFIG[act.status].color}`}>
                                    {STATUS_CONFIG[act.status].label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        };

        return (
            <div id="printable-calendar" className="bg-white rounded-lg shadow-md border">
                <header className="p-4 flex justify-between items-center border-b">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-md shadow-sm">
                            <button
                                onClick={() => handleDateNav(-1)}
                                className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
                            >
                                &lt;
                            </button>
                            <button
                                onClick={() => setCurrentCalendarDate(new Date())}
                                className="relative -ml-px inline-flex items-center bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
                            >
                                {getTodayButtonText()}
                            </button>
                            <button
                                onClick={() => handleDateNav(1)}
                                className="relative -ml-px inline-flex items-center rounded-r-md bg-white px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
                            >
                                &gt;
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 capitalize">{getCalendarTitle()}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-gray-200 p-1 rounded-lg flex items-center">
                            { (['month', 'week', 'day'] as const).map(mode => (
                                <button key={mode} onClick={() => setCalendarViewMode(mode)} className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors ${calendarViewMode === mode ? 'bg-white text-primary-600 shadow' : 'text-gray-700 hover:text-primary-600'}`}>{mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}</button>
                            ))}
                        </div>
                        <button onClick={handlePrint} className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-md" aria-label="Imprimir Calendário">
                           <PrinterIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </header>
                {calendarViewMode !== 'day' && <div className="grid grid-cols-7 text-center font-semibold text-sm text-gray-600 border-b"><div className="py-2 border-r">Dom</div><div className="py-2 border-r">Seg</div><div className="py-2 border-r">Ter</div><div className="py-2 border-r">Qua</div><div className="py-2 border-r">Qui</div><div className="py-2 border-r">Sex</div><div className="py-2">Sáb</div></div>}
                
                {calendarViewMode === 'month' && renderMonthView()}
                {calendarViewMode === 'week' && renderWeekView()}
                {calendarViewMode === 'day' && renderDayView()}
            </div>
        );
    }
    
    const renderContent = () => {
        if (viewMode === 'calendar') return renderCalendar();
        if (viewMode === 'dashboard') return <div className="text-center p-10 bg-white rounded-lg shadow">Dashboard de indicadores em desenvolvimento.</div>;
        
        return (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sublocal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ambiente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodicidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Planejada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operador</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredActivities.length > 0 ? filteredActivities.map(item => {
                             const periodStyle = getPeriodicityStyle(item.periodicity);
                             return (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.activityName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.client}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.subLocation}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.environment}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${periodStyle.bg} ${periodStyle.text}`}>{item.periodicity}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.plannedDate ? new Date(item.plannedDate + 'T00:00:00').toLocaleDateString() : '—'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teamMembers.find(t => t.id === item.operatorId)?.name || 'Não atribuído'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_CONFIG[item.status].bg} ${STATUS_CONFIG[item.status].color}`}>
                                        {STATUS_CONFIG[item.status].label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleOpenPanel(item)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors" aria-label="Ver detalhes">
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        )}) : (
                            <tr><td colSpan={10} className="text-center py-10 text-gray-500">Nenhuma atividade encontrada para os filtros selecionados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="p-8">
            <PageHeader title="Agenda de Atividades">
                <div id="header-actions" className="flex items-center space-x-2">
                    <button onClick={() => setIsGenerateModalOpen(true)} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        Gerar Agenda
                    </button>
                </div>
            </PageHeader>

            <div className="mb-6 non-printable">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                >
                    <FilterIcon className="w-5 h-5 mr-2" />
                    {showFilters ? 'Ocultar Filtros Avançados' : 'Mostrar Filtros Avançados'}
                </button>
                {showFilters && (
                    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {/* Row 1 */}
                           {viewMode !== 'calendar' && (
                            <>
                                <div className="relative">
                                    <label htmlFor="startDate-filter" className="block text-sm font-medium text-gray-700">Data Inicial</label>
                                    <input
                                        type="text"
                                        id="startDate-filter"
                                        name="startDate"
                                        readOnly
                                        value={formatDateDisplay(filters.startDate)}
                                        onClick={() => setActiveCalendar(activeCalendar === 'startDate' ? null : 'startDate')}
                                        className="mt-1 block w-full cursor-pointer rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                    />
                                    {activeCalendar === 'startDate' && (
                                        <CalendarPicker
                                            selectedDate={filters.startDate}
                                            onDateSelect={(date) => {
                                                handleFilterChange({ target: { name: 'startDate', value: date } } as React.ChangeEvent<HTMLInputElement>);
                                                setActiveCalendar(null);
                                            }}
                                            onClose={() => setActiveCalendar(null)}
                                        />
                                    )}
                                </div>
                                <div className="relative">
                                    <label htmlFor="endDate-filter" className="block text-sm font-medium text-gray-700">Data Final</label>
                                     <input
                                        type="text"
                                        id="endDate-filter"
                                        name="endDate"
                                        readOnly
                                        value={formatDateDisplay(filters.endDate)}
                                        onClick={() => setActiveCalendar(activeCalendar === 'endDate' ? null : 'endDate')}
                                        className="mt-1 block w-full cursor-pointer rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                    />
                                    {activeCalendar === 'endDate' && (
                                        <CalendarPicker
                                            selectedDate={filters.endDate}
                                            onDateSelect={(date) => {
                                                handleFilterChange({ target: { name: 'endDate', value: date } } as React.ChangeEvent<HTMLInputElement>);
                                                setActiveCalendar(null);
                                            }}
                                            onClose={() => setActiveCalendar(null)}
                                        />
                                    )}
                                </div>
                            </>
                           )}
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
                                <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                    <option>Todas</option>
                                    {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="operator-filter" className="block text-sm font-medium text-gray-700">Operador</label>
                                <select id="operator-filter" name="operator" value={filters.operator} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                    <option value="">Todos</option>
                                    {teamMembers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                             {/* Row 2 */}
                             <div>
                                <label htmlFor="activityId-filter" className="block text-sm font-medium text-gray-700">Atividade</label>
                                <select id="activityId-filter" name="activityId" value={filters.activityId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                    <option value="">Todas</option>
                                    {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="client-filter" className="block text-sm font-medium text-gray-700">Cliente</label>
                                <select id="client-filter" name="client" value={filters.client} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                    <option value="">Todos</option>
                                    {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="location-filter" className="block text-sm font-medium text-gray-700">Local</label>
                                <select id="location-filter" name="location" value={filters.location} onChange={handleFilterChange} disabled={!filters.client} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 disabled:bg-gray-100">
                                    <option value="">Todos</option>
                                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="subLocation-filter" className="block text-sm font-medium text-gray-700">Sublocal</label>
                                <select id="subLocation-filter" name="subLocation" value={filters.subLocation} onChange={handleFilterChange} disabled={!filters.location} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 disabled:bg-gray-100">
                                    <option value="">Todos</option>
                                    {uniqueSubLocations.map(sl => <option key={sl} value={sl}>{sl}</option>)}
                                </select>
                            </div>
                             {/* Row 3 */}
                            <div>
                                <label htmlFor="environment-filter" className="block text-sm font-medium text-gray-700">Ambiente</label>
                                <select id="environment-filter" name="environment" value={filters.environment} onChange={handleFilterChange} disabled={!filters.subLocation} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 disabled:bg-gray-100">
                                    <option value="">Todos</option>
                                    {uniqueEnvironments.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="periodicity-filter" className="block text-sm font-medium text-gray-700">Periodicidade</label>
                                <select id="periodicity-filter" name="periodicity" value={filters.periodicity} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                    <option value="">Todas</option>
                                    {PERIODICITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="mt-4 flex justify-end">
                            <button onClick={clearFilters} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Limpar Filtros</button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 non-printable">
                {Object.entries(summaryCounts).map(([status, count]) => {
                    const config = STATUS_CONFIG[status as Status];
                    return <div key={status} onClick={() => handleSummaryClick(status as Status)} className={`p-4 rounded-lg shadow cursor-pointer transition-transform hover:scale-105 ${config.bg.replace('100', '200')}`}>
                        <h4 className={`font-bold ${config.color}`}>{status}</h4>
                        <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                    </div>
                })}
            </div>
            
            <div id="view-switcher" className="mb-4 flex justify-end non-printable">
                <div className="bg-gray-200 p-1 rounded-lg flex items-center">
                    <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-primary-600 shadow' : 'text-gray-700 hover:text-primary-600'}`} aria-label="Visualização em Tabela"><ListIcon className="w-5 h-5"/></button>
                    <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-primary-600 shadow' : 'text-gray-700 hover:text-primary-600'}`} aria-label="Visualização em Calendário"><CalendarIcon className="w-5 h-5"/></button>
                    <button onClick={() => setViewMode('dashboard')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'dashboard' ? 'bg-white text-primary-600 shadow' : 'text-gray-700 hover:text-primary-600'}`} aria-label="Visualização em Dashboard"><BarChartIcon className="w-5 h-5"/></button>
                </div>
            </div>

            {renderContent()}

            {isGenerateModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Gerar Agenda Futura</h3>
                        <p className="text-sm mb-4">Selecione por quantos dias deseja gerar as próximas atividades baseadas nos planos de trabalho.</p>
                        <div className="flex justify-around">
                             <button onClick={() => handleGenerateSchedule(7)} className="px-4 py-2 bg-blue-500 text-white rounded">7 Dias</button>
                             <button onClick={() => handleGenerateSchedule(15)} className="px-4 py-2 bg-blue-500 text-white rounded">15 Dias</button>
                             <button onClick={() => handleGenerateSchedule(30)} className="px-4 py-2 bg-blue-500 text-white rounded">30 Dias</button>
                        </div>
                        <button onClick={() => setIsGenerateModalOpen(false)} className="mt-6 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                    </div>
                </div>
            )}
            
            {isPanelOpen && selectedActivity && (
                 <div className="fixed inset-0 z-40 non-printable">
                    <div className="absolute inset-0 bg-gray-800 opacity-50" onClick={() => setIsPanelOpen(false)}></div>
                    <div className="absolute right-0 top-0 h-full bg-white w-full max-w-md shadow-xl p-6 overflow-y-auto">
                        <button onClick={() => setIsPanelOpen(false)} className="absolute top-4 right-4 text-3xl text-gray-500">&times;</button>
                        <h3 className="text-xl font-bold mb-1">{selectedActivity.activityName}</h3>
                        <p className="text-sm text-gray-600 mb-4">{`${selectedActivity.client} / ${selectedActivity.location} / ${selectedActivity.subLocation}`}</p>
                        <p className="text-sm text-gray-500 mb-4 -mt-3 font-semibold">{selectedActivity.environment}</p>

                        <p className="text-sm text-gray-500 mb-4">{selectedActivity.activityDescription}</p>

                        <div className="space-y-2 mb-6">
                            {selectedActivity.plannedDate && <p><strong>Data Planejada:</strong> {new Date(selectedActivity.plannedDate + 'T00:00:00').toLocaleDateString()}</p>}
                            <p><strong>Periodicidade:</strong> <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${getPeriodicityStyle(selectedActivity.periodicity).bg} ${getPeriodicityStyle(selectedActivity.periodicity).text}`}>{selectedActivity.periodicity}</span></p>
                            <p><strong>Operador:</strong> {teamMembers.find(t => t.id === selectedActivity.operatorId)?.name || 'Não atribuído'}</p>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-bold mb-2">Recursos Necessários</h4>
                            <h5 className="font-semibold text-sm">Equipamentos:</h5>
                            <ul className="list-disc pl-5 text-sm">{selectedActivity.tools.map(t => <li key={t.id}>{t.name} (x{t.quantity})</li>)}</ul>
                            <h5 className="font-semibold text-sm mt-2">Materiais:</h5>
                            <ul className="list-disc pl-5 text-sm">{selectedActivity.materials.map(m => <li key={m.id}>{m.name} (x{m.quantity})</li>)}</ul>
                        </div>
                        
                         {selectedActivity.status !== 'Aguardando Programação' && (
                            <div className="space-y-3">
                                <button onClick={handleRegisterExecution} disabled={selectedActivity.status === 'Concluída'} className="w-full py-2 px-4 bg-green-600 text-white rounded disabled:bg-gray-400">Registrar Execução</button>
                                <input type="date" onChange={e => handleReschedule(e.target.value)} defaultValue={selectedActivity.plannedDate || undefined} className="w-full p-2 border rounded" />
                                <select onChange={e => handleReassign(e.target.value)} value={selectedActivity.operatorId || ''} className="w-full p-2 border rounded">
                                    <option value="">Reatribuir Operador</option>
                                    {teamMembers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                         )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Schedule;
