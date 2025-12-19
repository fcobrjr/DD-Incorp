
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { CalendarIcon, LayoutGridIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, ClockIcon, AlertTriangleIcon } from '../components/icons';
import { ScheduleShift, GovernanceSchedule } from '../types';

const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const createSafeDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};

const getSafeMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    return monday;
};

const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const GovernanceSchedulePage: React.FC = () => {
    const { 
        governanceParameters, 
        governanceWeeklyPlans, 
        teamMembers,
        governanceSchedules,
        setGovernanceSchedules,
        governanceConvocations
    } = useContext(AppContext)!;

    const [selectedWeekStart, setSelectedWeekStart] = useState<string>(formatDateISO(getSafeMonday(new Date())));
    const [shifts, setShifts] = useState<ScheduleShift[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const existingSchedule = governanceSchedules.find(s => s.weekStartDate === selectedWeekStart);
        if (existingSchedule) {
            setShifts(existingSchedule.shifts);
        } else {
            setShifts([]);
        }
        setIsDirty(false);
    }, [selectedWeekStart, governanceSchedules]);

    const changeWeek = (direction: 'next' | 'prev') => {
        const currentMonday = createSafeDate(selectedWeekStart);
        const daysToAdd = direction === 'next' ? 7 : -7;
        currentMonday.setDate(currentMonday.getDate() + daysToAdd);
        setSelectedWeekStart(formatDateISO(currentMonday));
    };

    const handleSave = () => {
        const newSchedule: GovernanceSchedule = {
            id: `sched-${selectedWeekStart}`,
            weekStartDate: selectedWeekStart,
            shifts: shifts,
            updatedAt: new Date().toISOString()
        };
        setGovernanceSchedules(prev => {
            const others = prev.filter(s => s.weekStartDate !== selectedWeekStart);
            return [...others, newSchedule];
        });
        setIsDirty(false);
        alert('Escala salva com sucesso!');
    };

    const weekDays = useMemo(() => {
        const start = createSafeDate(selectedWeekStart);
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return {
                date: formatDateISO(d),
                label: DAYS_OF_WEEK[i].split('-')[0]
            };
        });
    }, [selectedWeekStart]);

    const staff = useMemo(() => {
        return teamMembers.filter(m => m.sector === 'Governança' && m.isActive).sort((a,b) => a.name.localeCompare(b.name));
    }, [teamMembers]);

    const weekLabel = useMemo(() => {
        const start = createSafeDate(selectedWeekStart);
        const day = String(start.getDate()).padStart(2, '0');
        const month = String(start.getMonth() + 1).padStart(2, '0');
        const year = String(start.getFullYear()).slice(-2);
        return `Semana de ${day}/${month}/${year}`;
    }, [selectedWeekStart]);

    return (
        <div className="p-8 pb-20">
            <PageHeader title="Escala Semanal">
                <div className="flex items-center space-x-3">
                    <button className="flex items-center px-4 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 text-sm font-semibold transition-colors shadow-sm">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Gerar Sugestão
                    </button>
                    <button onClick={handleSave} disabled={!isDirty} className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors shadow-sm ${isDirty ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-400 cursor-not-allowed'}`}>
                        Salvar Escala
                    </button>
                </div>
            </PageHeader>

            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 overflow-hidden h-10">
                        <button onClick={() => changeWeek('prev')} className="px-3 hover:bg-gray-200 text-gray-500 border-r border-gray-200 transition-colors h-full">&lt;</button>
                        <div className="px-6 text-sm font-bold text-gray-700 uppercase">{weekLabel}</div>
                        <button onClick={() => changeWeek('next')} className="px-3 hover:bg-gray-200 text-gray-500 border-l border-gray-200 transition-colors h-full">&gt;</button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] border-r border-gray-200 sticky left-0 bg-gray-50 z-20">Colaborador</th>
                                {weekDays.map(d => (
                                    <th key={d.date} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] border-r border-gray-200">{d.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staff.length > 0 ? staff.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-white sticky left-0 z-10">{member.name}</td>
                                    {weekDays.map(d => (
                                        <td key={d.date} className="px-2 py-2 border-r border-gray-200 text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                <input type="time" className="block w-24 text-xs rounded border-gray-300 shadow-sm focus:ring-primary-600 focus:border-primary-600 p-0.5 text-center h-6"/>
                                                <input type="time" className="block w-24 text-xs rounded border-gray-300 shadow-sm focus:ring-primary-600 focus:border-primary-600 p-0.5 text-center h-6"/>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500">Nenhum colaborador de governança cadastrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GovernanceSchedulePage;
