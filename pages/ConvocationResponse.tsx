
import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { CheckCircleIcon, XCircleIcon, ClockIcon, AlertTriangleIcon } from '../components/icons';

const ConvocationResponse: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { governanceConvocations, setGovernanceConvocations, teamMembers } = useContext(AppContext)!;
    
    const [convocation, setConvocation] = useState(governanceConvocations.find(c => c.id === id));
    const [reason, setReason] = useState('');
    const [viewState, setViewState] = useState<'initial' | 'confirm-reject' | 'success'>('initial');

    useEffect(() => {
        // Sync with context if it changes
        const found = governanceConvocations.find(c => c.id === id);
        setConvocation(found);
    }, [id, governanceConvocations]);

    if (!convocation) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Convocação não encontrada</h2>
                    <p className="text-gray-600">O link pode estar inválido ou expirado.</p>
                </div>
            </div>
        );
    }

    const member = teamMembers.find(m => m.id === convocation.teamMemberId);
    const deadline = new Date(convocation.deadlineAt);
    const isExpired = new Date() > deadline || convocation.status === 'Expirada';
    const isResponded = convocation.status === 'Aceita' || convocation.status === 'Recusada';

    const handleAccept = () => {
        if (!window.confirm("Confirmar o aceite desta jornada de trabalho?")) return;
        
        setGovernanceConvocations(prev => prev.map(c => 
            c.id === convocation.id 
                ? { ...c, status: 'Aceita', respondedAt: new Date().toISOString() } 
                : c
        ));
        setViewState('success');
    };

    const handleReject = () => {
        if (!reason.trim()) {
            alert("Por favor, informe um motivo para a recusa.");
            return;
        }

        setGovernanceConvocations(prev => prev.map(c => 
            c.id === convocation.id 
                ? { ...c, status: 'Recusada', respondedAt: new Date().toISOString(), rejectionReason: reason } 
                : c
        ));
        setViewState('success');
    };

    if (viewState === 'success' || isResponded) {
         const finalStatus = isResponded ? convocation.status : (viewState === 'success' && reason ? 'Recusada' : 'Aceita');
         return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full border-t-4 border-primary-600">
                    {finalStatus === 'Aceita' ? (
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    ) : (
                        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {finalStatus === 'Aceita' ? 'Convocação Aceita!' : 'Convocação Recusada'}
                    </h2>
                    <p className="text-gray-600 mb-6">Sua resposta foi registrada com sucesso.</p>
                    {finalStatus === 'Aceita' && (
                        <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm mb-4">
                            Você está confirmado para o dia <strong>{new Date(convocation.shiftDate + 'T00:00:00').toLocaleDateString()}</strong>.
                        </div>
                    )}
                </div>
            </div>
         );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Convocação Expirada</h2>
                    <p className="text-gray-600">O prazo para responder a esta convocação já encerrou.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                <div className="bg-primary-700 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">Convocação de Trabalho</h1>
                    <p className="text-primary-100 mt-1">Intermitente</p>
                </div>
                
                <div className="p-8">
                    <div className="text-center mb-8">
                        <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">Olá, {member?.name}</p>
                        <h3 className="text-xl font-bold text-gray-800 mt-2">Você recebeu uma nova oferta de jornada.</h3>
                        {convocation.operationalJustification && (
                            <p className="text-sm text-gray-500 mt-2 italic">"{convocation.operationalJustification}"</p>
                        )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                            <span className="text-gray-500 text-sm">Data</span>
                            <span className="text-gray-900 font-bold">{new Date(convocation.shiftDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                            <span className="text-gray-500 text-sm">Horário</span>
                            <span className="text-gray-900 font-bold">{convocation.shiftStartTime} - {convocation.shiftEndTime}</span>
                        </div>
                         <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                            <span className="text-gray-500 text-sm">Setor</span>
                            <span className="text-gray-900 font-medium">{member?.sector}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Responder até</span>
                            <span className="text-red-600 font-bold text-sm">{new Date(convocation.deadlineAt).toLocaleString()}</span>
                        </div>
                    </div>

                    {viewState === 'initial' && (
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setViewState('confirm-reject')}
                                className="py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Recusar
                            </button>
                            <button 
                                onClick={handleAccept}
                                className="py-3 px-4 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
                            >
                                Aceitar Convocação
                            </button>
                        </div>
                    )}

                    {viewState === 'confirm-reject' && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Motivo da Recusa (Obrigatório)</label>
                            <textarea 
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                                rows={3}
                                placeholder="Ex: Consulta médica, compromisso pessoal..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            ></textarea>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setViewState('initial')}
                                    className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-900"
                                >
                                    Voltar
                                </button>
                                <button 
                                    onClick={handleReject}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                >
                                    Confirmar Recusa
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConvocationResponse;
