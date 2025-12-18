
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { GovernanceParameters } from '../types';
import { DEFAULT_GOVERNANCE_PARAMETERS } from '../data/sampleData';
import { SlidersIcon } from '../components/icons';

const GovernanceParametersPage: React.FC = () => {
    const { governanceParameters, setGovernanceParameters } = useContext(AppContext)!;
    const [formState, setFormState] = useState<GovernanceParameters>(governanceParameters);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setFormState(governanceParameters);
    }, [governanceParameters]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let newValue: any = value;

        if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            newValue = parseFloat(value);
        }

        setFormState(prev => {
            const updated = { ...prev, [name]: newValue };
            setIsDirty(JSON.stringify(updated) !== JSON.stringify(governanceParameters));
            return updated;
        });
    };

    const handleSave = () => {
        setGovernanceParameters(formState);
        setIsDirty(false);
        alert('Parâmetros salvos com sucesso!');
    };

    const handleResetParams = () => {
        if (window.confirm('Tem certeza que deseja restaurar os padrões de configuração?')) {
            setFormState(DEFAULT_GOVERNANCE_PARAMETERS);
            setGovernanceParameters(DEFAULT_GOVERNANCE_PARAMETERS);
            setIsDirty(false);
        }
    };

    return (
        <div className="p-8 pb-20">
            <PageHeader title="Parâmetros da Governança">
                <div className="flex items-center space-x-3">
                    <button onClick={handleResetParams} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                        Restaurar Padrões
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={!isDirty}
                        className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors shadow-sm ${
                            isDirty 
                            ? 'bg-primary-600 hover:bg-primary-700' 
                            : 'bg-primary-300 cursor-not-allowed'
                        }`}
                    >
                        <SlidersIcon className="w-5 h-5 mr-2" />
                        Salvar Parâmetros
                    </button>
                </div>
            </PageHeader>

            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* 1. Tempos Médios */}
                <section className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm">1</span>
                            Tempos Médios de Limpeza (Padrão)
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 ml-11">Valores usados quando não especificado no cadastro do colaborador.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-11">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vago Sujo (min)</label>
                            <input 
                                type="number" 
                                name="defaultCleaningSpeedVacantDirty" 
                                value={formState.defaultCleaningSpeedVacantDirty} 
                                onChange={handleInputChange} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Estada (min)</label>
                            <input 
                                type="number" 
                                name="defaultCleaningSpeedStay" 
                                value={formState.defaultCleaningSpeedStay} 
                                onChange={handleInputChange} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" 
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Regras de Feriados */}
                <section className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                     <div className="border-b border-gray-200 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3 text-sm">2</span>
                            Regras de Feriados
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-11">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Multiplicador de Demanda (Feriado)</label>
                            <input type="number" step="0.1" name="holidayDemandMultiplier" value={formState.holidayDemandMultiplier} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Multiplicador de Demanda (Véspera)</label>
                            <input type="number" step="0.1" name="holidayEveDemandMultiplier" value={formState.holidayEveDemandMultiplier} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <input type="checkbox" id="allowIntermittentOnHolidays" name="allowIntermittentOnHolidays" checked={formState.allowIntermittentOnHolidays} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                            <label htmlFor="allowIntermittentOnHolidays" className="text-sm font-medium text-gray-700">Permitir Intermitentes em Feriados</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <input type="checkbox" id="preferEffectiveOnHolidays" name="preferEffectiveOnHolidays" checked={formState.preferEffectiveOnHolidays} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                            <label htmlFor="preferEffectiveOnHolidays" className="text-sm font-medium text-gray-700">Dar preferência a Efetivos</label>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700">Observações de Feriado (RH)</label>
                             <textarea name="holidayNotes" value={formState.holidayNotes} onChange={handleInputChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm"></textarea>
                        </div>
                    </div>
                </section>

                {/* 3. Regras Intermitentes */}
                <section className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 text-sm">3</span>
                            Colaboradores Intermitentes
                        </h3>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-11">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mínimo Horas/Semana</label>
                            <input type="number" name="intermittentMinWeeklyHours" value={formState.intermittentMinWeeklyHours} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Máximo Horas/Semana</label>
                            <input type="number" name="intermittentMaxWeeklyHours" value={formState.intermittentMaxWeeklyHours} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Máx Dias Consecutivos</label>
                             <input type="number" name="intermittentMaxConsecutiveDays" value={formState.intermittentMaxConsecutiveDays} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Intervalo entre Semanas (semanas)</label>
                            <input type="number" name="intermittentWeeksInterval" value={formState.intermittentWeeksInterval} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Folga Obrigatória (a cada X semanas)</label>
                            <input type="number" name="intermittentMandatoryOffWeeks" value={formState.intermittentMandatoryOffWeeks} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-600 sm:text-sm" />
                        </div>
                     </div>
                </section>
            </div>
        </div>
    );
};

export default GovernanceParametersPage;
