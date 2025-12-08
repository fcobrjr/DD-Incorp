
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
    const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
    const [operationalJustification, setOperationalJustification] = useState('');

    // --- Helper Logic ---
    const getShiftDeadline = (date: string, time: string) => {
        const shiftDateTime = new Date(`${date}T${time || '08:00'}:00`);
        // Deadline is 72 hours before shift
        return new Date(shiftDateTime.getTime() - (72 * 60 * 60 * 1000));
    };

    const isWithinDeadline = (date: string, time: string) => {
        const deadline = getShiftDeadline(date, time);
        return new Date() < deadline;
    };

    const formatDateTime = (isoStr: string) => {
        return new Date(isoStr).toLocaleString('pt-BR');
    };

    // --- Data Preparation ---
    const availableShifts = useMemo(() => {
        // Flatten all shifts from all schedules
        const allShifts = governanceSchedules.flatMap(s => s.shifts.map(shift => ({...shift, scheduleId: s.id})));
        
        // Filter out shifts that already have a convocation
        return allShifts.filter(shift => {
            // Find team member to check if Intermittent (though logic can apply to all, prompt emphasizes intermittent)
            const member = teamMembers.find(m => m.id === shift.teamMemberId);
            if (!member || !member.isActive) return false;

            // Optional: Filter only for Intermittent if desired, but let's allow all for now as per "Convocações da Governança" general title
            // if (member.contractType !== 'Intermitente') return false; 

            // Check if already in convocations
            const exists = governanceConvocations.some(c => c.shiftId === shift.id);
            return !exists;
        }).sort((a,b) => a.date.localeCompare(b.date));
    }, [governanceSchedules, governanceConvocations, teamMembers]);

    const historyItems = useMemo(() => {
        return [...governanceConvocations].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    }, [governanceConvocations]);

    // --- Actions ---
    const toggleShiftSelection = (shiftId: string) => {
        setSelectedShifts(prev => 
            prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]
        );
    };

    const handleSelectAll = () => {
        if (selectedShifts.length === availableShifts.length) {
            setSelectedShifts([]);
        } else {
            // Only select valid ones (within deadline)
            const validIds = availableShifts
                .filter(s => isWithinDeadline(s.date, s.startTime))
                .map(s => s.id);
            setSelectedShifts(validIds);
        }
    };

    const handleSendConvocations = () => {
        if (selectedShifts.length === 0) return;

        const newConvocations: Convocation[] = [];
        const now = new Date().toISOString();

        selectedShifts.forEach(shiftId => {
            const shift = availableShifts.find(s => s.id === shiftId);
            if (!shift) return;

            const deadline = getShiftDeadline(shift.date, shift.startTime).toISOString();

            newConvocations.push({
                id: `conv-${Date.now()}-${shift.id}`,
                scheduleId: shift.scheduleId,
                shiftId: shift.id,
                teamMemberId: shift.teamMemberId,
                shiftDate: shift.date,
                shiftStartTime: shift.startTime,
                shiftEndTime: shift.endTime,
                sentAt: now,
                deadlineAt: deadline,
                status: 'Pendente',
                operationalJustification: operationalJustification || 'Demanda Operacional Prevista'
            });
        });

        setGovernanceConvocations(prev => [...prev, ...newConvocations]);
        setSelectedShifts([]);
        setOperationalJustification('');
        alert(`${newConvocations.length} convocações enviadas com sucesso!`);
        setActiveTab('history');
    };

    // --- Render ---
    return (
        <div className="p-8 pb-20">
            <PageHeader title="Gestão de Convocações">
                 <div className="bg-blue-50 text-blue-800 text-sm px-4 py-2 rounded-lg flex items-center border border-blue-100">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Regra Jurídica: Antecedência mínima de 72h obrigatória.
                </div>
            </PageHeader>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`pb-3 px-6 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pending' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pendentes de Envio ({availableShifts.length})
                </button>
                <button
                    className={`pb-3 px-6 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('history')}
                >
                    Histórico ({historyItems.length})
                </button>
            </div>

            {activeTab === 'pending' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                         <div className="w-full md:w-1/2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Justificativa Operacional (Opcional)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Alta ocupação no feriado..." 
                                value={operationalJustification}
                                onChange={e => setOperationalJustification(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-9" 
                            />
                        </div>
                        <button 
                            onClick={handleSendConvocations}
                            disabled={selectedShifts.length === 0}
                            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors flex items-center ${
                                selectedShifts.length > 0 ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'
                            }`}
                        >
                            <MailIcon className="w-4 h-4 mr-2" />
                            Enviar Convocações ({selectedShifts.length})
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedShifts.length > 0 && selectedShifts.length === availableShifts.filter(s => isWithinDeadline(s.date, s.startTime)).length}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data do Turno</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prazo Limite (72h)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Legal</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {availableShifts.length > 0 ? availableShifts.map(shift => {
                                    const member = teamMembers.find(m => m.id === shift.teamMemberId);
                                    const canSend = isWithinDeadline(shift.date, shift.startTime);
                                    const deadline = getShiftDeadline(shift.date, shift.startTime);

                                    return (
                                        <tr key={shift.id} className={!canSend ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedShifts.includes(shift.id)}
                                                    onChange={() => toggleShiftSelection(shift.id)}
                                                    disabled={!canSend}
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{member?.name || 'Desconhecido'}</div>
                                                <div className="text-xs text-gray-500">{member?.contractType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(shift.date + 'T00:00:00').toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {shift.startTime} - {shift.endTime}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {deadline.toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {canSend ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Dentro do Prazo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Prazo Expirado
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">Nenhum turno pendente de convocação.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jornada</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enviado Em</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prazo Resposta</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {historyItems.length > 0 ? historyItems.map(item => {
                                    const member = teamMembers.find(m => m.id === item.teamMemberId);
                                    
                                    // Check expiration (if pending and now > deadline)
                                    const isExpired = item.status === 'Pendente' && new Date() > new Date(item.deadlineAt);
                                    const displayStatus = isExpired ? 'Expirada' : item.status;

                                    const statusColors: Record<string, string> = {
                                        'Pendente': 'bg-yellow-100 text-yellow-800',
                                        'Aceita': 'bg-green-100 text-green-800',
                                        'Recusada': 'bg-red-100 text-red-800',
                                        'Expirada': 'bg-gray-100 text-gray-800'
                                    };

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[displayStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                    {displayStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{member?.name}</div>
                                                <div className="text-xs text-gray-500">{member?.sector}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>{new Date(item.shiftDate + 'T00:00:00').toLocaleDateString()}</div>
                                                <div>{item.shiftStartTime} - {item.shiftEndTime}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDateTime(item.sentAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDateTime(item.deadlineAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {displayStatus === 'Pendente' && (
                                                    <Link 
                                                        to={`/convocation-response/${item.id}`} 
                                                        className="text-primary-600 hover:text-primary-900 underline"
                                                        target="_blank"
                                                    >
                                                        Link do Colaborador
                                                    </Link>
                                                )}
                                                {displayStatus === 'Recusada' && (
                                                     <span className="text-xs text-red-600 block max-w-[150px] truncate" title={item.rejectionReason}>
                                                        Motivo: {item.rejectionReason || 'N/ão informado'}
                                                     </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">Histórico vazio.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GovernanceConvocation;
