
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { DailyOperationalData, DailyDemand, GovernanceWeeklyPlan } from '../types';
import { BarChartIcon, CalendarIcon, LayoutGridIcon, ToolIcon, AlertTriangleIcon } from '../components/icons';

const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

// --- ISO 8601 HELPER FUNCTIONS ---

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

const getISOWeekInfo = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { week: weekNo, year: date.getUTCFullYear() };
};

const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Interface auxiliar para manipular inputs que podem estar vazios temporariamente
interface DailyInputState extends Omit<DailyOperationalData, 'occupancy' | 'vacantDirty' | 'stay' | 'uhOccupied'> {
    occupancy: string | number;
    uhOccupied: string | number;
    vacantDirty: string | number;
    stay: string | number;
    // UI States for validation
    error?: string;
    warning?: string;
}

const GovernancePlanning: React.FC = () => {
    const { governanceParameters, governanceWeeklyPlans, setGovernanceWeeklyPlans } = useContext(AppContext)!;
    
    const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => formatDateISO(getSafeMonday(new Date())));
    
    // State
    const [weeklyMaintenance, setWeeklyMaintenance] = useState<number>(0);
    const [dailyData, setDailyData] = useState<DailyInputState[]>([]);
    const [calculatedDemands, setCalculatedDemands] = useState<DailyDemand[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Initialization
    useEffect(() => {
        const existingPlan = governanceWeeklyPlans.find(p => p.weekStartDate === selectedWeekStart);
        
        if (existingPlan) {
            setWeeklyMaintenance(existingPlan.weeklyMaintenanceRooms || 0);
            setDailyData(existingPlan.days.map(d => ({
                ...d,
                occupancy: d.occupancy,
                uhOccupied: d.uhOccupied !== undefined ? d.uhOccupied : '', 
                vacantDirty: d.vacantDirty,
                stay: d.stay,
                error: undefined,
                warning: undefined
            })));
            setCalculatedDemands(existingPlan.calculatedDemand || []);
        } else {
            setWeeklyMaintenance(0);
            const startDate = createSafeDate(selectedWeekStart);
            const newDays: DailyInputState[] = DAYS_OF_WEEK.map((dayName, index) => {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + index);
                return {
                    date: formatDateISO(currentDate),
                    dayOfWeek: dayName,
                    occupancy: '', 
                    uhOccupied: '', 
                    vacantDirty: '',
                    stay: '',
                    dayType: 'Normal'
                };
            });
            setDailyData(newDays);
            setCalculatedDemands([]);
        }
        setIsDirty(false);
    }, [selectedWeekStart, governanceWeeklyPlans]);

    const changeWeek = (direction: 'next' | 'prev') => {
        const currentMonday = createSafeDate(selectedWeekStart);
        const daysToAdd = direction === 'next' ? 7 : -7;
        currentMonday.setDate(currentMonday.getDate() + daysToAdd);
        setSelectedWeekStart(formatDateISO(currentMonday));
    };

    // --- CORE LOGIC: Compute Row State ---
    const computeRow = (
        day: DailyInputState, 
        fieldChanged: keyof DailyInputState | 'maintenance', 
        totalApartments: number, 
        weeklyMaintenance: number
    ): DailyInputState => {
        const updatedDay = { ...day, error: undefined, warning: undefined };
        const baseRooms = Math.max(0, totalApartments - weeklyMaintenance);

        // Helper to get number or null
        const getVal = (key: 'occupancy' | 'uhOccupied' | 'vacantDirty' | 'stay'): number | null => {
            const v = updatedDay[key];
            return (v === '' || v === null || isNaN(Number(v))) ? null : Number(v);
        };

        // --- 1. Bilateral Logic: Occupancy <-> UH ---
        if (fieldChanged === 'occupancy') {
            const occ = getVal('occupancy');
            if (occ !== null) {
                if (occ < 0 || occ > 100) {
                    updatedDay.error = "Ocupação deve ser entre 0 e 100%";
                } else {
                    updatedDay.uhOccupied = Math.floor(baseRooms * (occ / 100));
                }
            } else {
                updatedDay.uhOccupied = '';
            }
        } 
        else if (fieldChanged === 'uhOccupied') {
            const uh = getVal('uhOccupied');
            if (uh !== null) {
                if (baseRooms > 0) {
                    updatedDay.occupancy = parseFloat(((uh / baseRooms) * 100).toFixed(2));
                } else {
                    updatedDay.occupancy = 0;
                }
            } else {
                updatedDay.occupancy = '';
            }
        }

        // --- 2. Triangulation: Fill UH if Vacant + Stay are set but UH is empty ---
        let uh = getVal('uhOccupied');
        const vago = getVal('vacantDirty');
        const stay = getVal('stay');

        if (uh === null && vago !== null && stay !== null && (fieldChanged === 'vacantDirty' || fieldChanged === 'stay')) {
            const calculatedUH = baseRooms - vago - stay;
            if (calculatedUH >= 0) {
                updatedDay.uhOccupied = calculatedUH;
                uh = calculatedUH; // Update local var
                if (baseRooms > 0) {
                    updatedDay.occupancy = parseFloat(((calculatedUH / baseRooms) * 100).toFixed(2));
                }
            } else {
                updatedDay.error = "Cálculo impossível: ajuste os valores para evitar resultado negativo.";
            }
        }

        // --- 3. Compensation Logic: Fill Missing Vago OR Stay ---
        if (uh !== null) {
            // Se preencheu ocupação/UH e falta um dos outros dois, calcula o restante
            if (stay !== null && (vago === null || fieldChanged === 'uhOccupied' || fieldChanged === 'occupancy')) {
                // Prioridade: Manter Estada fixa, calcular Vago se possível
                // Mas se o campo alterado foi Estada, não recalculamos Vago aqui (já estaria coberto pela logica de consistencia abaixo ou input manual)
                // Aqui focamos no preenchimento automático
                if (vago === null) {
                     const calcVago = baseRooms - uh - stay;
                     if (calcVago >= 0) updatedDay.vacantDirty = calcVago;
                }
            } else if (vago !== null && (stay === null || fieldChanged === 'uhOccupied' || fieldChanged === 'occupancy')) {
                if (stay === null) {
                    const calcStay = baseRooms - uh - vago;
                    if (calcStay >= 0) updatedDay.stay = calcStay;
                }
            }
        }

        // --- 4. Validation & Consistency Check ---
        const finalUH = getVal('uhOccupied') || 0;
        const finalVago = getVal('vacantDirty') || 0;
        const finalStay = getVal('stay') || 0;
        const totalUsed = finalUH + finalVago + finalStay;

        if (totalUsed > baseRooms) {
            updatedDay.error = `Consistência inválida: Soma (${totalUsed}) excede a capacidade (${baseRooms}).`;
        }

        return updatedDay;
    };

    const handleInputChange = (index: number, field: keyof DailyInputState, value: string) => {
        setDailyData(prev => {
            const newData = [...prev];
            const currentDay = { ...newData[index] };

            if (field === 'dayType') {
                currentDay.dayType = value as any;
            } else {
                (currentDay as any)[field] = value === '' ? '' : parseFloat(value);
            }

            const totalApartments = governanceParameters.totalApartments || 144;
            const computedDay = computeRow(currentDay, field, totalApartments, weeklyMaintenance);

            newData[index] = computedDay;
            return newData;
        });
        setIsDirty(true);
        if (calculatedDemands.length > 0) setCalculatedDemands([]); 
    };

    const handleWeeklyMaintenanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const num = val === '' ? 0 : parseInt(val);
        setWeeklyMaintenance(isNaN(num) ? 0 : num);
        setIsDirty(true);
        setCalculatedDemands([]);
        
        setDailyData(prev => {
            const totalApartments = governanceParameters.totalApartments || 144;
            return prev.map(day => {
                return computeRow({...day}, 'maintenance', totalApartments, isNaN(num) ? 0 : num);
            });
        });
    };

    const handleCalculate = () => {
        const params = governanceParameters;
        if (dailyData.some(d => d.error)) {
            alert("Existem erros de consistência na tabela. Corrija antes de calcular.");
            return;
        }

        const results: DailyDemand[] = dailyData.map(day => {
            const vacantDirty = day.vacantDirty === '' ? 0 : Number(day.vacantDirty);
            const stay = day.stay === '' ? 0 : Number(day.stay);

            // 1. Minutos Totais
            const totalMinutes = 
                (vacantDirty * params.defaultCleaningSpeedVacantDirty) + 
                (stay * params.defaultCleaningSpeedStay);
            
            // 2. Ajuste Feriado
            let multiplier = 1;
            if (day.dayType === 'Feriado') multiplier = params.holidayDemandMultiplier;
            if (day.dayType === 'Véspera') multiplier = params.holidayEveDemandMultiplier;
            
            const adjustedMinutes = totalMinutes * multiplier;
            
            // 3. Horas Totais
            const totalHours = adjustedMinutes / 60;
            
            // 4. Horas Efetivas
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
        if (dailyData.some(d => d.error)) {
            alert("Não é possível salvar com erros de consistência.");
            return;
        }

        const cleanDailyData: DailyOperationalData[] = dailyData.map(d => ({
            ...d,
            occupancy: d.occupancy === '' ? 0 : Number(d.occupancy),
            uhOccupied: d.uhOccupied === '' ? 0 : Number(d.uhOccupied),
            vacantDirty: d.vacantDirty === '' ? 0 : Number(d.vacantDirty),
            stay: d.stay === '' ? 0 : Number(d.stay)
        }));

        const endDate = createSafeDate(selectedWeekStart);
        endDate.setDate(endDate.getDate() + 6);

        const newPlan: GovernanceWeeklyPlan = {
            id: `plan-${selectedWeekStart}`,
            weekStartDate: selectedWeekStart,
            weekEndDate: formatDateISO(endDate),
            weeklyMaintenanceRooms: weeklyMaintenance,
            days: cleanDailyData,
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

    const renderTableRow = (day: DailyInputState, idx: number, baseRooms: number) => {
        return (
            <tr key={day.date} className={day.dayOfWeek === 'Domingo' || day.dayOfWeek === 'Sábado' ? 'bg-gray-50/50' : ''}>
                <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{day.dayOfWeek}</div>
                    <div className="text-xs text-gray-500">{new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                </td>
                
                {/* Ocupação (%) */}
                <td className="px-4 py-3">
                    <div className="flex flex-col">
                        <div className="flex items-center">
                            <input 
                                type="number" 
                                min="0" max="100" 
                                step="0.01"
                                value={day.occupancy} 
                                placeholder="%"
                                onChange={(e) => handleInputChange(idx, 'occupancy', e.target.value)}
                                className={`block w-20 rounded-md shadow-sm sm:text-sm ${day.error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}`}
                            />
                        </div>
                    </div>
                </td>

                {/* Uh ocupadas (Input Bidirecional) */}
                <td className="px-4 py-3 bg-blue-50/10">
                    <input 
                        type="number"
                        min="0"
                        max={baseRooms}
                        value={day.uhOccupied}
                        placeholder={day.occupancy === '' ? '—' : ''}
                        onChange={(e) => handleInputChange(idx, 'uhOccupied', e.target.value)}
                        className="block w-20 rounded-md border-blue-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-blue-700 font-semibold"
                    />
                </td>

                {/* Vago Sujo */}
                <td className="px-4 py-3">
                    <input 
                        type="number" 
                        min="0"
                        value={day.vacantDirty} 
                        onChange={(e) => handleInputChange(idx, 'vacantDirty', e.target.value)}
                        className="block w-24 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                    />
                </td>

                {/* Estada */}
                <td className="px-4 py-3">
                    <input 
                        type="number" 
                        min="0"
                        value={day.stay} 
                        onChange={(e) => handleInputChange(idx, 'stay', e.target.value)}
                        className="block w-24 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                    />
                </td>

                {/* Tipo de Dia & Avisos */}
                <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <select 
                                value={day.dayType} 
                                onChange={(e) => handleInputChange(idx, 'dayType', e.target.value)}
                                className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                                    day.dayType === 'Feriado' ? 'text-red-600 font-bold bg-red-50' : 
                                    day.dayType === 'Véspera' ? 'text-orange-600 font-medium bg-orange-50' : ''
                                }`}
                            >
                                <option value="Normal">Normal</option>
                                <option value="Véspera">Véspera</option>
                                <option value="Feriado">Feriado</option>
                            </select>
                            {day.error && (
                                <div className="group relative">
                                    <AlertTriangleIcon className="w-5 h-5 text-red-500 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-red-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                        {day.error}
                                    </div>
                                </div>
                            )}
                        </div>
                        {day.error && <span className="text-[10px] text-red-600 font-medium leading-tight max-w-[150px]">{day.error}</span>}
                    </div>
                </td>
            </tr>
        );
    };

    const weekInfo = (() => {
        if (!selectedWeekStart) return { label: '', range: '' };
        const start = createSafeDate(selectedWeekStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const isoInfo = getISOWeekInfo(start);
        return {
            label: `Semana ${isoInfo.week} - ${isoInfo.year}`,
            range: `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`
        };
    })();

    const totalWeeklyHours = calculatedDemands.reduce((acc, curr) => acc + curr.requiredHoursWithEfficiency, 0);
    const avgDailyMaids = calculatedDemands.length > 0 
        ? calculatedDemands.reduce((acc, curr) => acc + curr.requiredMaids, 0) / 7 
        : 0;

    const totalApartments = governanceParameters.totalApartments || 144;
    const availableRooms = Math.max(0, totalApartments - (weeklyMaintenance || 0));

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
                
                {/* 1. Header ISO & Constants */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                         <h3 className="text-lg font-bold text-gray-800 flex items-center mb-1">
                            <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
                            Controle Semanal
                        </h3>
                        <p className="text-sm text-gray-500">Navegue pelas semanas de Segunda a Domingo.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Week Navigator */}
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 h-16 overflow-hidden shadow-sm">
                            <button 
                                onClick={() => changeWeek('prev')}
                                className="h-full px-3 hover:bg-gray-200 text-gray-500 border-r border-gray-200 transition-colors"
                            >
                                &lt;
                            </button>
                            <div className="px-6 text-center">
                                <span className="block text-sm font-bold text-primary-700 uppercase tracking-wide">
                                    {weekInfo.label}
                                </span>
                                <span className="block text-xs text-gray-500 font-medium mt-0.5">
                                    {weekInfo.range}
                                </span>
                            </div>
                            <button 
                                onClick={() => changeWeek('next')}
                                className="h-full px-3 hover:bg-gray-200 text-gray-500 border-l border-gray-200 transition-colors"
                            >
                                &gt;
                            </button>
                        </div>

                        {/* Total Quartos */}
                        <div className="flex items-center gap-2 bg-gray-50 p-2 px-4 rounded-lg border border-gray-200 h-16">
                             <div className="bg-primary-100 p-1.5 rounded-full">
                                <LayoutGridIcon className="w-5 h-5 text-primary-600"/>
                             </div>
                             <div>
                                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total Quartos</span>
                                <span className="block text-lg font-bold text-gray-800 leading-tight">{totalApartments}</span>
                             </div>
                        </div>

                        {/* Maintenance & Base */}
                        <div className="flex items-center gap-2 bg-red-50 p-2 px-4 rounded-lg border border-red-100 h-16">
                             <div className="bg-red-100 p-1.5 rounded-full">
                                <ToolIcon className="w-5 h-5 text-red-600"/>
                             </div>
                             <div className="flex flex-col">
                                <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wide whitespace-nowrap">Em Manutenção</label>
                                <div className="flex items-baseline gap-2">
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={weeklyMaintenance}
                                        onChange={handleWeeklyMaintenanceChange}
                                        className="block w-16 py-0 px-1 bg-transparent border-0 border-b border-red-300 focus:ring-0 text-lg font-bold text-red-800 leading-tight" 
                                    />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 2. Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-700">Previsão Operacional</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Dia</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Ocupação (%)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider bg-blue-50/50 w-36">Uh ocupadas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Vago Sujo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Estada</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Tipo de Dia</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dailyData.map((day, idx) => renderTableRow(day, idx, availableRooms))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Results */}
                {calculatedDemands.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md border border-blue-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 flex justify-between items-center">
                            <h3 className="font-bold text-blue-900">Demanda Calculada</h3>
                            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                Baseado nos parâmetros (Eficiência {governanceParameters.efficiencyTarget}%)
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
                                        <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50/50">Carga Nec. (h)</th>
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
                                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL SEMANAL</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-800">{totalWeeklyHours.toFixed(1)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-primary-800">{avgDailyMaids.toFixed(2)} (média/dia)</td>
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
