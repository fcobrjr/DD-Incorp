
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { CalendarIcon, LayoutGridIcon, SparklesIcon } from '../components/icons';
import { ScheduleShift, GovernanceSchedule } from '../types';

const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
};

const formatDateISO = (d: Date) => d.toISOString().split('T')[0];

const GovernanceSchedulePage: React.FC = () => {
    const { 
        governanceParameters, 
        governanceWeeklyPlans, 
        teamMembers,
        governanceSchedules,
        setGovernanceSchedules 
    } = useContext(AppContext)!;

    const [selectedWeekStart, setSelectedWeekStart] = useState<string>(formatDateISO(getMonday(new Date())));
    const [currentSchedule, setCurrentSchedule] = useState<GovernanceSchedule | null>(null);
    const [shifts, setShifts] = useState<ScheduleShift[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Load schedule when week changes
    useEffect(() => {
        const existingSchedule = governanceSchedules.find(s => s.weekStartDate === selectedWeekStart);
        if (existingSchedule) {
            setCurrentSchedule(existingSchedule);
            setShifts(existingSchedule.shifts);
        } else {
            setCurrentSchedule(null);
            setShifts([]);
        }
        setIsDirty(false);
    }, [selectedWeekStart, governanceSchedules]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(e.target.value);
        if (!isNaN(date.getTime())) {
            const monday = getMonday(date);
            setSelectedWeekStart(formatDateISO(monday));
        }
    };

    // --- THE SUGGESTION ENGINE ---
    const generateSchedule = () => {
        const plan = governanceWeeklyPlans.find(p => p.weekStartDate === selectedWeekStart);
        
        if (!plan || !plan.calculatedDemand) {
            alert("Não há planejamento salvo para esta semana. Por favor, calcule a demanda no Planejamento Semanal primeiro.");
            return;
        }

        if (shifts.length > 0) {
            if (!window.confirm("Já existem turnos gerados/editados. Deseja sobrescrever com uma nova sugestão?")) return;
        }

        const newShifts: ScheduleShift[] = [];
        const params = governanceParameters;
        
        // 1. Get eligible staff
        const eligibleStaff = teamMembers.filter(m => m.sector === 'Governança' && m.isActive);

        // Helper to track hours per person for this week generation
        const weeklyHoursTracker: {[key: string]: number} = {};
        eligibleStaff.forEach(m => weeklyHoursTracker[m.id] = 0);

        // 2. Iterate Days
        plan.days.forEach((day, index) => {
            const date = day.date;
            const demand = plan.calculatedDemand?.find(d => d.date === date);
            const neededMaids = demand ? Math.ceil(demand.requiredMaids) : 0;
            
            if (neededMaids === 0) return;

            // 3. Filter Daily Eligibility
            let dailyCandidates = eligibleStaff.filter(m => {
                // Check if day is unavailable
                if (m.unavailableDays?.some(ud => ud.toLowerCase() === day.dayOfWeek.toLowerCase())) return false;
                
                // Check Max Hours (simple check against contract)
                const max = m.governanceMaxWeeklyHours || m.maxWeeklyHours || 44;
                if (weeklyHoursTracker[m.id] >= max) return false;

                // Restriction check (very basic string match for now)
                if (day.dayType === 'Feriado' && params.preferEffectiveOnHolidays && m.contractType === 'Intermitente' && params.allowIntermittentOnHolidays === false) return false;

                return true;
            });

            // 4. Sort Candidates (Prioritization Logic)
            dailyCandidates.sort((a, b) => {
                // Priority to Effective on Holidays if configured
                if (day.dayType === 'Feriado' && params.preferEffectiveOnHolidays) {
                    if (a.contractType === 'Efetivo' && b.contractType !== 'Efetivo') return -1;
                    if (b.contractType === 'Efetivo' && a.contractType !== 'Efetivo') return 1;
                }
                
                // Balance hours: give to who has less hours accumulated so far
                return weeklyHoursTracker[a.id] - weeklyHoursTracker[b.id];
            });

            // 5. Assign Shifts
            // Basic logic: Assign standard shift to top N candidates
            // Alternation logic is simulated by the 'weeklyHoursTracker' sorting which rotates staff naturally
            const shiftDuration = params.standardShiftDuration || 8;
            
            for (let i = 0; i < neededMaids; i++) {
                if (i < dailyCandidates.length) {
                    const candidate = dailyCandidates[i];
                    
                    // Default times (Mock logic - would be smarter in v2)
                    const startTime = "08:00";
                    const endTime = "17:00"; // Assuming 1h break included in 9h span for 8h work? Or just 8h raw.
                    // Let's assume standard 8h work + 1h break = 9h span
                    
                    newShifts.push({
                        id: `shift-${date}-${candidate.id}-${Date.now()}`,
                        teamMemberId: candidate.id,
                        date: date,
                        startTime,
                        endTime,
                        breakDuration: 60,
                        totalHours: shiftDuration,
                        activity: 'Limpeza UH'
                    });
                    
                    weeklyHoursTracker[candidate.id] += shiftDuration;
                }
            }
        });

        setShifts(newShifts);
        setIsDirty(true);
        alert(`Motor de Sugestão: ${newShifts.length} turnos gerados baseados na demanda.`);
    };

    const handleShiftChange = (memberId: string, date: string, field: 'startTime' | 'endTime', value: string) => {
        setShifts(prev => {
            const existingIndex = prev.findIndex(s => s.teamMemberId === memberId && s.date === date);
            const newShifts = [...prev];

            if (existingIndex >= 0) {
                // Update existing
                const shift = { ...newShifts[existingIndex], [field]: value };
                // Recalculate duration if both present
                if (shift.startTime && shift.endTime) {
                    const start = new Date(`2000-01-01T${shift.startTime}`);
                    const end = new Date(`2000-01-01T${shift.endTime}`);
                    let diffMs = end.getTime() - start.getTime();
                    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // overnight
                    const diffHrs = (diffMs / (1000 * 60 * 60)) - (shift.breakDuration / 60);
                    shift.totalHours = parseFloat(diffHrs.toFixed(2));
                }
                // Remove if both empty
                if (!shift.startTime && !shift.endTime) {
                    newShifts.splice(existingIndex, 1);
                } else {
                    newShifts[existingIndex] = shift;
                }
            } else {
                // Create new (only if value provided)
                if (value) {
                    const params = governanceParameters;
                    newShifts.push({
                        id: `shift-${date}-${memberId}-${Date.now()}`,
                        teamMemberId: memberId,
                        date: date,
                        startTime: field === 'startTime' ? value : '',
                        endTime: field === 'endTime' ? value : '',
                        breakDuration: 60,
                        totalHours: 0, // Will calc when both filled
                        activity: 'Limpeza UH'
                    });
                }
            }
            return newShifts;
        });
        setIsDirty(true);
    };

    const handleSave = () => {
        const endDate = new Date(selectedWeekStart + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 6);

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

    // --- RENDERING HELPERS ---
    const getWeekDays = () => {
        const start = new Date(selectedWeekStart + 'T00:00:00');
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return {
                date: formatDateISO(d),
                label: DAYS_OF_WEEK[i].split('-')[0], // Segunda, Terça...
                fullLabel: DAYS_OF_WEEK[i]
            };
        });
    };

    const weekDays = useMemo(() => getWeekDays(), [selectedWeekStart]);
    
    // Get planned demand to compare
    const plannedDemand = useMemo(() => {
        return governanceWeeklyPlans.find(p => p.weekStartDate === selectedWeekStart)?.calculatedDemand || [];
    }, [selectedWeekStart, governanceWeeklyPlans]);

    const staff = useMemo(() => {
        return teamMembers.filter(m => m.sector === 'Governança' && m.isActive).sort((a,b) => a.name.localeCompare(b.name));
    }, [teamMembers]);

    // Calculate Scheduled Count per Day
    const getScheduledCount = (date: string) => {
        return shifts.filter(s => s.date === date && s.startTime && s.endTime).length;
    };

    return (
        <div className="p-8 pb-20">
            <PageHeader title="Escala Semanal (Governança)">
                <div className="flex items-center space-x-3">
                     <button 
                        onClick={generateSchedule}
                        className="flex items-center px-4 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 text-sm font-medium transition-colors"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Gerar Sugestão
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={!isDirty && !currentSchedule}
                        className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                            isDirty 
                            ? 'bg-primary-600 hover:bg-primary-700' 
                            : 'bg-primary-400 cursor-not-allowed'
                        }`}
                    >
                        Salvar Escala
                    </button>
                </div>
            </PageHeader>

            <div className="space-y-6">
                 {/* Week Selector */}
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Semana de Referência</label>
                        <input 
                            type="date" 
                            value={selectedWeekStart} 
                            onChange={handleDateChange} 
                            className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                        />
                    </div>
                </div>

                {/* MATRIX VIEW */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] border-r border-gray-200 bg-gray-50 sticky left-0 z-20">
                                    Colaborador
                                </th>
                                {weekDays.map(d => {
                                    const demand = plannedDemand.find(pd => pd.date === d.date);
                                    const planned = demand ? Math.ceil(demand.requiredMaids) : 0;
                                    const scheduled = getScheduledCount(d.date);
                                    const statusColor = scheduled < planned ? 'text-red-600' : scheduled > planned ? 'text-orange-600' : 'text-green-600';

                                    return (
                                        <th key={d.date} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] border-r border-gray-200">
                                            <div className="font-bold text-gray-700">{d.label}</div>
                                            <div className="text-[10px] text-gray-400 font-normal">{new Date(d.date + 'T00:00:00').getDate()}/{new Date(d.date + 'T00:00:00').getMonth()+1}</div>
                                            <div className={`mt-1 text-[11px] font-bold ${statusColor}`}>
                                                Escalado: {scheduled} / {planned}
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staff.map(member => {
                                // Calculate total hours for this member in this schedule
                                const memberTotalHours = shifts
                                    .filter(s => s.teamMemberId === member.id && s.totalHours > 0)
                                    .reduce((acc, curr) => acc + curr.totalHours, 0);

                                return (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-white sticky left-0 z-10">
                                            <div>{member.name}</div>
                                            <div className="text-xs text-gray-500">{member.contractType}</div>
                                        </td>
                                        {weekDays.map(d => {
                                            const shift = shifts.find(s => s.teamMemberId === member.id && s.date === d.date);
                                            return (
                                                <td key={d.date} className="px-2 py-2 border-r border-gray-200 text-center relative group">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <input 
                                                            type="time" 
                                                            value={shift?.startTime || ''} 
                                                            onChange={(e) => handleShiftChange(member.id, d.date, 'startTime', e.target.value)}
                                                            className="block w-24 text-xs rounded border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-0.5 text-center h-6"
                                                        />
                                                        <input 
                                                            type="time" 
                                                            value={shift?.endTime || ''} 
                                                            onChange={(e) => handleShiftChange(member.id, d.date, 'endTime', e.target.value)}
                                                            className="block w-24 text-xs rounded border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-0.5 text-center h-6"
                                                        />
                                                    </div>
                                                    {/* Visual Indicator of break or hours */}
                                                    {shift?.totalHours ? (
                                                        <div className="text-[10px] text-gray-400 mt-1">{shift.totalHours}h</div>
                                                    ) : null}
                                                </td>
                                            );
                                        })}
                                        <td className="px-2 py-3 text-center text-sm font-bold text-gray-700">
                                            {memberTotalHours}h
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GovernanceSchedulePage;
