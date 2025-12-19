
import React from 'react';
import PageHeader from '../components/PageHeader';

interface SystemNode {
    id: string;
    title: string;
    type: 'page' | 'modal' | 'action' | 'component';
    description: string;
    children?: SystemNode[];
}

const SYSTEM_MAP: SystemNode[] = [
    {
        id: 'home',
        title: 'Áreas Comuns (Home)',
        type: 'page',
        description: 'Página inicial e listagem de áreas cadastradas.',
        children: [
            { id: 'modal-area', title: 'Modal: Editar/Criar Área', type: 'modal', description: 'Formulário para cadastro de cliente, local, ambiente e área (m²).' },
            { id: 'modal-preview', title: 'Modal: Visualização', type: 'modal', description: 'Visualização somente leitura dos detalhes da área e atividades planejadas.' },
            { id: 'action-ai', title: 'Ação: Sugestão IA', type: 'action', description: 'Integração com Gemini para sugerir atividades baseadas no nome do ambiente.' },
            { id: 'action-import', title: 'Ação: Importar Excel', type: 'action', description: 'Importação em massa de áreas via planilha .xlsx.' },
             { id: 'action-export', title: 'Ação: Exportar Template', type: 'action', description: 'Download do modelo de planilha para importação.' }
        ]
    },
    {
        id: 'planning',
        title: 'Planejamento',
        type: 'page',
        description: 'Gerenciamento de Planos de Trabalho por Área Comum.',
        children: [
             { id: 'view-toggle', title: 'Componente: Alternar Visão', type: 'component', description: 'Alterna entre visualização de Cards e Tabela.' },
            { id: 'modal-plan', title: 'Modal: Plano de Trabalho', type: 'modal', description: 'Associação de atividades a uma área com definição de periodicidade.', 
                children: [
                     { id: 'nested-modal-act', title: 'Modal: Editar Atividade', type: 'modal', description: 'Edição rápida de recursos (materiais/equipamentos) dentro do plano.' }
                ]
            },
            { id: 'calc-resources', title: 'Lógica: Cálculo de Recursos', type: 'component', description: 'Cálculo automático de materiais baseados no coeficiente/m² da área selecionada.' }
        ]
    },
    {
        id: 'schedule',
        title: 'Agenda',
        type: 'page',
        description: 'Calendário de execuções e status de atividades.',
        children: [
            { id: 'modal-generate', title: 'Modal: Gerar Agenda', type: 'modal', description: 'Algoritmo para projetar atividades futuras baseadas na periodicidade.' },
            { id: 'panel-details', title: 'Painel Lateral: Detalhes', type: 'modal', description: 'Detalhes da execução, reagendamento e marcação de conclusão.' },
             { id: 'comp-calendar', title: 'Componente: Calendário', type: 'component', description: 'Visualizações de Mês, Semana e Dia com filtros de status.' }
        ]
    },
    {
        id: 'daily-work-orders',
        title: 'OS Diária',
        type: 'page',
        description: 'Geração e impressão de Ordens de Serviço por colaborador.',
        children: [
             { id: 'filter-employee', title: 'Filtros: Data/Colaborador', type: 'component', description: 'Seleção do dia e funcionário para filtrar tarefas.' },
             { id: 'calc-mat', title: 'Lógica: Cálculo Consumo', type: 'component', description: 'Cálculo de materiais necessários por tarefa baseado na área m².' },
             { id: 'print-layout', title: 'Layout Impressão', type: 'component', description: 'Estilização específica (@media print) para folha A4 limpa.' }
        ]
    },
    {
        id: 'activities',
        title: 'Atividades',
        type: 'page',
        description: 'Catálogo global de atividades de manutenção/limpeza.',
        children: [
            { id: 'modal-activity', title: 'Modal: Cadastro Atividade', type: 'modal', description: 'Definição de SLA, descrição e associação padrão de ferramentas e materiais.' }
        ]
    },
    {
        id: 'resources',
        title: 'Recursos (Equip. & Materiais)',
        type: 'page',
        description: 'Gestão de inventário de ferramentas e insumos.',
        children: [
            { id: 'modal-tool', title: 'Modal: Equipamento', type: 'modal', description: 'Cadastro simples de ferramentas (unidade).' },
            { id: 'modal-material', title: 'Modal: Material', type: 'modal', description: 'Cadastro de materiais com coeficiente de consumo por m².' }
        ]
    },
    {
        id: 'team',
        title: 'Equipes',
        type: 'page',
        description: 'Gestão de usuários e operadores.',
        children: [
            { id: 'modal-member', title: 'Modal: Membro', type: 'modal', description: 'Cadastro de nome e função do colaborador.' }
        ]
    },
    {
        id: 'governance-parameters',
        title: 'Parâmetros Gov.',
        type: 'page',
        description: 'Configuração de regras operacionais, jurídicas e tempos médios.',
        children: [
            { id: 'form-times', title: 'Form: Tempos Médios', type: 'component', description: 'Configuração de tempos padrão para Vago Sujo e Estada.' },
            { id: 'form-holidays', title: 'Form: Feriados', type: 'component', description: 'Regras de multiplicadores e permissões para feriados.' },
            { id: 'form-intermittent', title: 'Form: Intermitentes', type: 'component', description: 'Regras jurídicas para contratos intermitentes.' },
            { id: 'action-restore', title: 'Ação: Restaurar Padrões', type: 'action', description: 'Reseta todos os parâmetros para os valores iniciais do sistema.' }
        ]
    },
    {
        id: 'governance-planning',
        title: 'Planejamento Gov.',
        type: 'page',
        description: 'Planejamento semanal de demanda para o setor de governança.',
        children: [
            { id: 'week-selector', title: 'Seletor de Semana', type: 'component', description: 'Lógica para selecionar e travar semanas (Seg-Dom).' },
            { id: 'table-input', title: 'Tabela de Input', type: 'component', description: 'Entrada de Ocupação, Vago Sujo, Estada e Tipo de Dia.' },
            { id: 'calc-engine', title: 'Motor de Cálculo', type: 'action', description: 'Cálculo de horas necessárias baseado nos parâmetros e inputs.' },
            { id: 'table-results', title: 'Tabela de Resultados', type: 'component', description: 'Exibição de Minutos Totais, Horas e Camareiras necessárias.' }
        ]
    },
    {
        id: 'governance-schedule',
        title: 'Escala Gov.',
        type: 'page',
        description: 'Geração automática e gestão visual da escala semanal.',
        children: [
            { id: 'engine-schedule', title: 'Motor de Sugestão', type: 'action', description: 'Algoritmo que distribui turnos baseados na demanda calculada e restrições da equipe.' },
            { id: 'matrix-view', title: 'Grade de Horários', type: 'component', description: 'Matriz Colaborador x Dia para visualização e edição rápida de horários.' },
            { id: 'indicators', title: 'Indicadores', type: 'component', description: 'Comparativo visual entre Planejado vs Realizado (Escalado) por dia.' }
        ]
    },
    {
        id: 'governance-convocations',
        title: 'Convocações',
        type: 'page',
        description: 'Gestão jurídica de convites de trabalho para intermitentes.',
        children: [
             { id: 'validator-72h', title: 'Validador 72h', type: 'action', description: 'Bloqueia envio se data atual for muito próxima da jornada.' },
             { id: 'list-pending', title: 'Lista Pendentes', type: 'component', description: 'Listagem de turnos da escala ainda não enviados.' },
             { id: 'page-response', title: 'Pág: Resposta Colaborador', type: 'page', description: 'Tela externa (simulada) para aceite ou recusa com justificativa.' },
             { id: 'history-status', title: 'Histórico', type: 'component', description: 'Rastreio de status: Pendente, Aceita, Recusada, Expirada.' }
        ]
    }
];

const Blueprint: React.FC = () => {
    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <PageHeader title="Mapa do Sistema (Blueprint)">
                <div className="text-sm text-gray-500">
                    Visão estrutural de todas as páginas e componentes interativos.
                </div>
            </PageHeader>

            <div className="flex gap-4 mb-8 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Página
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span> Modal
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Ação/Lógica
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span> Componente UI
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {SYSTEM_MAP.map((node) => (
                    <div key={node.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-blue-50 p-4 border-b border-blue-100">
                            <h3 className="text-lg font-bold text-blue-900 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
                                {node.title}
                            </h3>
                            <p className="text-xs text-blue-700 mt-1">{node.description}</p>
                        </div>
                        
                        <div className="p-4 flex-1">
                            {node.children && node.children.length > 0 ? (
                                <ul className="space-y-4 relative">
                                    {/* Linha vertical conectora */}
                                    <div className="absolute left-2.5 top-2 bottom-4 w-0.5 bg-gray-100"></div>
                                    
                                    {node.children.map((child) => (
                                        <li key={child.id} className="relative pl-8">
                                            {/* Linha horizontal conectora */}
                                            <div className="absolute left-2.5 top-3 w-4 h-0.5 bg-gray-200"></div>
                                            
                                            <div className={`p-3 rounded-lg border text-sm ${
                                                child.type === 'modal' ? 'bg-amber-50 border-amber-200' : 
                                                child.type === 'action' ? 'bg-green-50 border-green-200' :
                                                child.type === 'component' ? 'bg-purple-50 border-purple-200' :
                                                'bg-gray-50 border-gray-200'
                                            }`}>
                                                <div className="font-semibold flex items-center justify-between">
                                                   <span className={`${
                                                        child.type === 'modal' ? 'text-amber-900' : 
                                                        child.type === 'action' ? 'text-green-900' :
                                                        child.type === 'component' ? 'text-purple-900' :
                                                        'text-gray-900'
                                                   }`}>
                                                        {child.title}
                                                   </span>
                                                </div>
                                                <p className="text-gray-600 mt-1 text-xs leading-relaxed">{child.description}</p>

                                                {child.children && (
                                                    <div className="mt-3 pl-3 border-l-2 border-gray-300">
                                                        {child.children.map(subChild => (
                                                            <div key={subChild.id} className="mt-2 text-xs text-gray-500 bg-white p-2 rounded border border-dashed border-gray-300">
                                                                <span className="font-medium text-gray-700 block mb-0.5">↳ {subChild.title}</span>
                                                                {subChild.description}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm italic">
                                    Apenas visualização de dados. Sem modais complexos.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Blueprint;
