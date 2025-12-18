
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { MailIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from '../components/icons';
import { Convocation, ScheduleShift, ConvocationStatus } from '../types';
import { Link } from 'react-router-dom';

const GovernanceConvocation: React.FC = () => {
    const { 
        governanceSchedules, 
        teamMembers, 
        governanceConvocations, 
        setGovernanceConvocations 
    } = useContext(AppContext)!;

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    const historyItems = useMemo(() => {
        return [...governanceConvocations].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    }, [governanceConvocations]);

    return (
        <div className="p-8 pb-20">
            <PageHeader title="Gestão de Convocações">
                 <div className="bg-blue-50 text-blue-800 text-sm px-4 py-2 rounded-lg flex items-center border border-blue-200 font-medium">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Regra Jurídica: Antecedência mínima de 72h obrigatória.
                </div>
            </PageHeader>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`pb-3 px-6 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'pending' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pendentes de Envio
                </button>
                <button
                    className={`pb-3 px-6 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('history')}
                >
                    Histórico ({historyItems.length})
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jornada</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {activeTab === 'history' && historyItems.length > 0 ? historyItems.map(item => {
                                const member = teamMembers.find(m => m.id === item.teamMemberId);
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member?.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.shiftDate} {item.shiftStartTime}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link to={`/convocation-response/${item.id}`} className="text-primary-600 hover:text-primary-900 font-semibold" target="_blank">Link</Link>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">Nenhum registro encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GovernanceConvocation;
