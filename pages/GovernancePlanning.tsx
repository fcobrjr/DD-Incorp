
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { DailyOperationalData, DailyDemand, GovernanceWeeklyPlan, DayType } from '../types';
import { BarChartIcon, CalendarIcon } from '../components/icons';

const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

const formatDateISO = (d: Date) => d.toISOString().split('T')[0];

const GovernancePlanning: React.FC = () => {
    const { governanceParameters, governanceWeeklyPlans, setGovernanceWeeklyPlans } = useContext(AppContext)!;
    
    // Default to current week Monday
    const [selectedWeekStart, setSelectedWeekStart] = useState<string>(formatDateISO(getMonday(new Date())));
    
    // Form state for inputs
    const [dailyData, setDailyData] = useState<DailyOperationalData[]>([]);
    const [calculatedDemands, setCalculatedDemands] = useState<DailyDemand[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Load or initialize data when week changes
    useEffect(() => {
        const existingPlan = governanceWeeklyPlans.find(p => p.weekStartDate === selectedWeekStart);
        
        if (existingPlan) {
            setDailyData(existingPlan.days);
            setCalculatedDemands(existingPlan.calculatedDemand || []);
        } else {
            // Initialize new empty week
            const startDate = new Date(selectedWeekStart + 'T00:00:00');
            const newDays: DailyOperationalData[] = DAYS_OF_WEEK.map((dayName, index) => {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + index);
                return {
                    date: formatDateISO(currentDate),
                    dayOfWeek: dayName,
                    occupancy: 0,
                    vacantDirty: 0,
                    stay: 0,
                    dayType: 'Normal'
                };
            });
            setDailyData(newDays);
            setCalculatedDemands([]);
        }
        setIsDirty(false);
    }, [selectedWeekStart, governanceWeeklyPlans]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = new Date(e.target.value);
        if(!isNaN(date.getTime())) {
             const monday = getMonday(date);
             setSelectedWeekStart(formatDateISO(monday));
        }
    };
    
    const handleInputChange = (index: number, field: keyof DailyOperationalData, value: any) => {
        setDailyData(prev => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
        setIsDirty(true);
        // Clear calculations when data changes to force recalculation
        if (calculatedDemands.length > 0) setCalculatedDemands([]); 
    };

    const handleCalculate = () => {
        const params = governanceParameters;
        const results: DailyDemand[] = dailyData.map(day => {
            // 1. Minutos Totais
            const totalMinutes = 
                (day.vacantDirty * params.defaultCleaningSpeedVacantDirty) + 
                (day.stay * params.defaultCleaningSpeedStay);
            
            // 2. Ajuste Feriado
            let multiplier = 1;
            if (day.dayType === 'Feriado') multiplier = params.holidayDemandMultiplier;
            if (day.dayType === 'Véspera') multiplier = params.holidayEveDemandMultiplier;
            
            const adjustedMinutes = totalMinutes * multiplier;
            
            // 3. Horas Totais
            const totalHours = adjustedMinutes / 60;
            
            // 4. Horas Efetivas (Necessárias para cobrir a demanda dada a eficiência)
            // Workload = Adjusted Hours. Efficiency = 80%. Needed Scheduled Hours = Workload / 0.8
            const efficiencyDecimal = (params.efficiencyTarget || 100) / 100;
            const requiredHoursWithEfficiency = efficiencyDecimal > 0 ? totalHours / efficiencyDecimal : totalHours;
            
            // 5. Camareiras
            const shiftDuration = params.standardShiftDuration || 8;
            const requiredMaids = shiftDuration > 0 ? requiredHoursWithEfficiency / shiftDuration : 0;

            return {
                date: day.date,
                totalMinutes,
                adjustedMinutes,
                totalHours,
                requiredHoursWithEfficiency,
                requiredMaids
            };
        });

        setCalculatedDemands(results);
    };

    const handleSave = () => {
        // Ensure calculations are up to date
        if (calculatedDemands.length === 0 && dailyData.some(d => d.vacantDirty > 0 || d.stay > 0)) {
            alert('Por favor, clique em "Calcular Demanda" antes de salvar.');
            return;
        }

        const endDate = new Date(selectedWeekStart + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 6);

        const newPlan: GovernanceWeeklyPlan = {
            id: `plan-${selectedWeekStart}`,
            weekStartDate: selectedWeekStart,
            weekEndDate: formatDateISO(endDate),
            days: dailyData,
            calculatedDemand: calculatedDemands,
            updatedAt: new Date().toISOString()
        };

        setGovernanceWeeklyPlans(prev => {
            const others = prev.filter(p => p.weekStartDate !== selectedWeekStart);
            return [...others, newPlan];
        });
        
        setIsDirty(false);
        alert('Planejamento salvo com sucesso!');
    };

    const getWeekRangeDisplay = () => {
        if (!selectedWeekStart) return '';
        const start = new Date(selectedWeekStart + 'T00:00:00');
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`;
    };

    // Summary Calculations
    const totalWeeklyHours = calculatedDemands.reduce((acc, curr) => acc + curr.requiredHoursWithEfficiency, 0);
    const avgDailyMaids = calculatedDemands.length > 0 
        ? calculatedDemands.reduce((acc, curr) => acc + curr.requiredMaids, 0) / 7 
        : 0;

    return (
        <div className="p-8 pb-20">
            <PageHeader title="Planejamento Semanal (Governança)">
                 <div className="flex items-center space-x-3">
                    <button 
                        onClick={handleCalculate}
                        className="flex items-center px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors"
                    >
                        <BarChartIcon className="w-5 h-5 mr-2" />
                        Calcular Demanda
                    </button>
                    <button 
                        onClick={handleSave} 
                        className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                            isDirty || calculatedDemands.length > 0
                            ? 'bg-primary-600 hover:bg-primary-700' 
                            : 'bg-primary-400 cursor-not-allowed'
                        }`}
                    >
                        Salvar Planejamento
                    </button>
                </div>
            </PageHeader>

            <div className="space-y-8 max-w-7xl mx-auto">
                
                {/* 1. Seleção da Semana */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                         <h3 className="text-lg font-bold text-gray-800 flex items-center mb-1">
                            <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
                            Seleção da Semana
                        </h3>
                        <p className="text-sm text-gray-500">O planejamento é sempre de Segunda a Domingo.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Início (Segunda)</label>
                            <input 
                                type="date" 
                                value={selectedWeekStart} 
                                onChange={handleDateChange} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white" 
                            />
                        </div>
                        <div className="h-8 border-l border-gray-300 mx-2"></div>
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase">Período Selecionado</label>
                             <div className="mt-2 text-sm font-medium text-gray-900">{getWeekRangeDisplay()}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Tabela de Input */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-700">Previsão Operacional</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dia / Data</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ocupação (%)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vago Sujo (Qtd)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estada (Qtd)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Dia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dailyData.map((day, idx) => (
                                    <tr key={day.date} className={day.dayOfWeek === 'Domingo' || day.dayOfWeek === 'Sábado' ? 'bg-gray-50/50' : ''}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{day.dayOfWeek}</div>
                                            <div className="text-xs text-gray-500">{new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="number" 
                                                min="0" max="100" 
                                                value={day.occupancy} 
                                                onChange={(e) => handleInputChange(idx, 'occupancy', parseFloat(e.target.value))}
                                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={day.vacantDirty} 
                                                onChange={(e) => handleInputChange(idx, 'vacantDirty', parseInt(e.target.value))}
                                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={day.stay} 
                                                onChange={(e) => handleInputChange(idx, 'stay', parseInt(e.target.value))}
                                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select 
                                                value={day.dayType} 
                                                onChange={(e) => handleInputChange(idx, 'dayType', e.target.value)}
                                                className={`block w-32 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                                                    day.dayType === 'Feriado' ? 'text-red-600 font-bold bg-red-50' : 
                                                    day.dayType === 'Véspera' ? 'text-orange-600 font-medium bg-orange-50' : ''
                                                }`}
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="Véspera">Véspera</option>
                                                <option value="Feriado">Feriado</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Resultados Calculados */}
                {calculatedDemands.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md border border-blue-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 flex justify-between items-center">
                            <h3 className="font-bold text-blue-900">Resumo da Demanda Calculada</h3>
                            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                Baseado nos parâmetros atuais
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dia</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Totais</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Ajustados</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Carga Bruta (h)</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50/50">Carga Necessária (h)</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-primary-700 uppercase tracking-wider bg-primary-50/50">Camareiras</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {calculatedDemands.map((demand, idx) => (
                                        <tr key={demand.date}>
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{DAYS_OF_WEEK[idx].split('-')[0]}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 text-right">{Math.round(demand.totalMinutes)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 text-right">{Math.round(demand.adjustedMinutes)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 text-right">{demand.totalHours.toFixed(1)}</td>
                                            <td className="px-4 py-3 text-sm text-blue-700 font-semibold text-right bg-blue-50/30">{demand.requiredHoursWithEfficiency.toFixed(1)}</td>
                                            <td className="px-4 py-3 text-sm text-primary-700 font-bold text-right bg-primary-50/30">{demand.requiredMaids.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Footer / Totals */}
                                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL SEMANAL</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-800">{totalWeeklyHours.toFixed(1)} h</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-primary-800">Média: {avgDailyMaids.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GovernancePlanning;
