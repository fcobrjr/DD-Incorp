
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { DailyOperationalData, DailyDemand, GovernanceWeeklyPlan } from '../types';
import { BarChartIcon, CalendarIcon, LayoutGridIcon, ToolIcon, AlertTriangleIcon } from '../components/icons';

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
    const [calculatedDemands, setCalculatedDemands] = useState<DailyDemand[]>([]);

    useEffect(() => {
        const existingPlan = governanceWeeklyPlans.find(p => p.weekStartDate === selectedWeekStart);
        if (existingPlan) {
            setDailyData(existingPlan.days);
            setCalculatedDemands(existingPlan.calculatedDemand || []);
        } else {
            const startDate = createSafeDate(selectedWeekStart);
            setDailyData(DAYS_OF_WEEK.map((day, i) => {
                const date = new Date(startDate); date.setDate(startDate.getDate() + i);
                return { date: formatDateISO(date), dayOfWeek: day, occupancy: 0, vacantDirty: 0, stay: 0, dayType: 'Normal' };
            }));
            setCalculatedDemands([]);
        }
    }, [selectedWeekStart, governanceWeeklyPlans]);

    return (
        <div className="p-8 pb-20">
            <PageHeader title="Planejamento Gov.">
                <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow-sm transition-colors"><BarChartIcon className="w-5 h-5 mr-2"/>Calcular</button>
            </PageHeader>

            <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <CalendarIcon className="w-6 h-6 text-primary-600" />
                        <span className="font-bold text-gray-700">Semana: {selectedWeekStart}</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ocupação (%)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vago Sujo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estada</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dailyData.length > 0 ? dailyData.map((day) => (
                                <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{day.dayOfWeek}</td>
                                    <td className="px-6 py-4"><input type="number" value={day.occupancy} className="w-20 border-gray-300 rounded shadow-sm sm:text-sm focus:ring-primary-600"/></td>
                                    <td className="px-6 py-4"><input type="number" value={day.vacantDirty} className="w-20 border-gray-300 rounded shadow-sm sm:text-sm focus:ring-primary-600"/></td>
                                    <td className="px-6 py-4"><input type="number" value={day.stay} className="w-20 border-gray-300 rounded shadow-sm sm:text-sm focus:ring-primary-600"/></td>
                                    <td className="px-6 py-4"><select className="border-gray-300 rounded shadow-sm text-sm focus:ring-primary-600"><option>Normal</option></select></td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">Nenhum dado planejado para esta semana.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GovernancePlanning;
