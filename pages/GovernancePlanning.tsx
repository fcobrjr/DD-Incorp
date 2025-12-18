
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { DailyOperationalData, DailyDemand, GovernanceWeeklyPlan, DayType } from '../types';
import { BarChartIcon, ClockIcon, HomeIcon, AlertTriangleIcon, CalendarIcon } from '../components/icons';

const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const createSafeDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};

const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getSafeMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday;
};

const GovernancePlanning: React.FC = () => {
    const { governanceParameters, governanceWeeklyPlans, setGovernanceWeeklyPlans } = useContext(AppContext)!;
    const [selectedWeekStart, setSelectedWeekStart] = useState<string>(formatDateISO(getSafeMonday(new Date())));
    
    const [dailyData, setDailyData] = useState<DailyOperationalData[]>([]);
    const [maintenanceRooms, setMaintenanceRooms] = useState<number>(0);
    const [calculatedDemands, setCalculatedDemands] = useState<DailyDemand[]>([]);

    // Carrega dados iniciais da semana
    useEffect(() => {
        const existingPlan = governanceWeeklyPlans.find(p => p.weekStartDate === selectedWeekStart);
        if (existingPlan) {
            setDailyData(existingPlan.days);
            setMaintenanceRooms(existingPlan.weeklyMaintenanceRooms || 0);
            setCalculatedDemands(existingPlan.calculatedDemand || []);
        } else {
            const startDate = createSafeDate(selectedWeekStart);
            setDailyData(DAYS_OF_WEEK.map((day, i) => {
                const date = new Date(startDate); date.setDate(startDate.getDate() + i);
                return { 
                    date: formatDateISO(date), 
                    dayOfWeek: day, 
                    occupancy: 0, 
                    uhOccupied: 0,
                    vacantDirty: 0, 
                    stay: 0, 
                    dayType: 'Normal' 
                };
            }));
            setMaintenanceRooms(0);
            setCalculatedDemands([]);
        }
    }, [selectedWeekStart, governanceWeeklyPlans]);

    // Recálculo automático de toda a tabela quando houver qualquer alteração
    useEffect(() => {
        if (dailyData.length > 0) {
            runRecalculation();
        }
    }, [dailyData, maintenanceRooms, governanceParameters]);

    const runRecalculation = () => {
        const totalUHs = governanceParameters.totalApartments;
        const availableUHs = Math.max(1, totalUHs - maintenanceRooms);

        const updatedDaily = dailyData.map(day => {
            const uhOccupied = day.vacantDirty + day.stay;
            const occupancy = (uhOccupied / availableUHs) * 100;
            return { ...day, uhOccupied, occupancy };
        });

        // Só atualiza o estado se houver mudança real para evitar loops infinitos
        if (JSON.stringify(updatedDaily) !== JSON.stringify(dailyData)) {
            setDailyData(updatedDaily);
            return;
        }

        const demands: DailyDemand[] = dailyData.map(day => {
            const speedVD = governanceParameters.defaultCleaningSpeedVacantDirty;
            const speedStay = governanceParameters.defaultCleaningSpeedStay;
            
            let totalMinutes = (day.vacantDirty * speedVD) + (day.stay * speedStay);
            
            let multiplier = 1;
            if (day.dayType === 'Feriado') multiplier = governanceParameters.holidayDemandMultiplier;
            else if (day.dayType === 'Véspera') multiplier = governanceParameters.holidayEveDemandMultiplier;
            
            const adjustedMinutes = totalMinutes * multiplier;
            const totalHours = adjustedMinutes / 60;
            const efficiency = governanceParameters.efficiencyTarget / 100;
            const requiredHoursWithEfficiency = totalHours / efficiency;
            const requiredMaids = requiredHoursWithEfficiency / governanceParameters.standardShiftDuration;

            return {
                date: day.date,
                totalMinutes,
                adjustedMinutes,
                totalHours,
                requiredHoursWithEfficiency,
                requiredMaids: Math.ceil(requiredMaids * 10) / 10
            };
        });

        setCalculatedDemands(demands);
    };

    const changeWeek = (direction: 'next' | 'prev') => {
        const currentMonday = createSafeDate(selectedWeekStart);
        const daysToAdd = direction === 'next' ? 7 : -7;
        currentMonday.setDate(currentMonday.getDate() + daysToAdd);
        setSelectedWeekStart(formatDateISO(currentMonday));
    };

    const weekLabel = useMemo(() => {
        const start = createSafeDate(selectedWeekStart);
        const day = String(start.getDate()).padStart(2, '0');
        const month = String(start.getMonth() + 1).padStart(2, '0');
        const year = String(start.getFullYear()).slice(-2);
        return `Semana de ${day}/${month}/${year}`;
    }, [selectedWeekStart]);

    const handleDataChange = (date: string, field: keyof DailyOperationalData, value: any) => {
        setDailyData(prev => prev.map(d => d.date === date ? { ...d, [field]: value } : d));
    };

    const handleSavePlan = () => {
        const newPlan: GovernanceWeeklyPlan = {
            id: `plan-${selectedWeekStart}`,
            weekStartDate: selectedWeekStart,
            weekEndDate: dailyData[6].date,
            weeklyMaintenanceRooms: maintenanceRooms,
            days: dailyData,
            calculatedDemand: calculatedDemands,
            updatedAt: new Date().toISOString()
        };

        setGovernanceWeeklyPlans(prev => {
            const others = prev.filter(p => p.weekStartDate !== selectedWeekStart);
            return [...others, newPlan];
        });

        alert('Planejamento de governança salvo com sucesso!');
    };

    return (
        <div className="p-8 pb-20">
            <PageHeader title="Planejamento Gov.">
                <button 
                    onClick={handleSavePlan}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow-sm transition-colors"
                >
                    <BarChartIcon className="w-5 h-5 mr-2"/>
                    Salvar Planejamento
                </button>
            </PageHeader>

            <div className="space-y-6">
                {/* Navegação e Info Geral */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex items-center justify-between col-span-1 md:col-span-2">
                        <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 overflow-hidden h-10">
                            <button onClick={() => changeWeek('prev')} className="px-3 hover:bg-gray-200 text-gray-500 border-r border-gray-200 transition-colors h-full">&lt;</button>
                            <div className="px-6 text-sm font-bold text-gray-700 uppercase">{weekLabel}</div>
                            <button onClick={() => changeWeek('next')} className="px-3 hover:bg-gray-200 text-gray-500 border-l border-gray-200 transition-colors h-full">&gt;</button>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                <HomeIcon className="w-4 h-4 mr-2" />
                                Total UHs: {governanceParameters.totalApartments}
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase mt-1 mr-2 italic">Capacidade Fixa do Hotel</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex flex-col justify-center">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">UHs em Manutenção (Semana)</label>
                        <input 
                            type="number" 
                            value={maintenanceRooms} 
                            onChange={(e) => setMaintenanceRooms(Math.max(0, Number(e.target.value)))}
                            className="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-primary-600 font-bold text-red-600 bg-red-50/30"
                        />
                        <p className="text-[9px] text-gray-400 mt-1 italic leading-tight">Afeta o cálculo da Taxa de Ocupação Operacional.</p>
                    </div>
                </div>

                {/* Tabela de Input Operacional */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2 text-primary-500" />
                            Previsão de Fluxo Operacional
                        </h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dia</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">UHs Vago Sujo (C.O)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">UHs Estada (S.O)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ocupado</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50/50">Ocupação %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Dia</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dailyData.map((day) => (
                                <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{day.dayOfWeek}</div>
                                        <div className="text-[10px] text-gray-400">{new Date(day.date + 'T12:00:00').toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <input 
                                            type="number" 
                                            value={day.vacantDirty} 
                                            onChange={(e) => handleDataChange(day.date, 'vacantDirty', Math.max(0, Number(e.target.value)))}
                                            className="w-24 border-gray-300 rounded shadow-sm sm:text-sm focus:ring-primary-600 text-center font-semibold"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <input 
                                            type="number" 
                                            value={day.stay} 
                                            onChange={(e) => handleDataChange(day.date, 'stay', Math.max(0, Number(e.target.value)))}
                                            className="w-24 border-gray-300 rounded shadow-sm sm:text-sm focus:ring-primary-600 text-center font-semibold"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-gray-700">
                                            {day.uhOccupied || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center bg-blue-50/30">
                                        <span className={`text-sm font-black ${(day.occupancy || 0) > 90 ? 'text-red-600' : 'text-primary-700'}`}>
                                            {Math.min(100, Math.round(day.occupancy || 0))}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={day.dayType} 
                                            onChange={(e) => handleDataChange(day.date, 'dayType', e.target.value as DayType)}
                                            className="border-gray-300 rounded shadow-sm text-sm focus:ring-primary-600 w-full"
                                        >
                                            <option value="Normal">Normal</option>
                                            <option value="Feriado">Feriado</option>
                                            <option value="Véspera">Véspera</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Resultados do Dimensionamento */}
                {calculatedDemands.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg border border-primary-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-4 border-b border-primary-100 bg-primary-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-primary-800 flex items-center">
                                <BarChartIcon className="w-5 h-5 mr-2" />
                                Resultados em Tempo Real (Necessidade Operacional)
                            </h3>
                            <div className="flex items-center text-[10px] font-bold text-primary-600 bg-white px-3 py-1 rounded-full border border-primary-200">
                                Eficiência Meta: {governanceParameters.efficiencyTarget}%
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-7 divide-x divide-gray-100">
                            {calculatedDemands.map((demand, idx) => (
                                <div key={demand.date} className={`p-4 text-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">{DAYS_OF_WEEK[idx].split('-')[0]}</div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-2xl font-black text-gray-900 leading-none">{demand.requiredMaids}</div>
                                        <div className="text-[9px] font-bold text-gray-500 uppercase mt-1">Camareiras</div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400">Tempo:</span>
                                            <span className="font-bold text-gray-700">{Math.round(demand.totalHours)}h</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-400">Com Efic.:</span>
                                            <span className="font-bold text-primary-600">{Math.round(demand.requiredHoursWithEfficiency)}h</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {calculatedDemands.length === 0 && (
                    <div className="p-12 text-center bg-white rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center">
                        <AlertTriangleIcon className="w-12 h-12 text-gray-300 mb-4" />
                        <h4 className="text-lg font-bold text-gray-400">Aguardando dados de entrada</h4>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Informe os volumes de limpeza para visualizar o dimensionamento automático.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GovernancePlanning;
