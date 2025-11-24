

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Wallet, 
  FileSignature, 
  RefreshCcw,
  BarChart2,
  LayoutDashboard,
  Target,
  Users,
  Megaphone,
  Trophy,
  Pencil,
  AlertCircle,
  Wifi,
  WifiOff,
  List,
  Columns,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  Legend,
  BarChart
} from 'recharts';

import { MOCK_DASHBOARD_DATA } from './constants';
import { DashboardData, DateFilterState, GoalSettings } from './types';
import { Card } from './components/Card';
import { TeamRow } from './components/TeamRow';
import { DateFilter } from './components/DateFilter';
import { PipelineFunnel } from './components/PipelineFunnel';
import { KanbanBoard } from './components/KanbanBoard';
import { CreativeRanking } from './components/CreativeRanking';
import { GoalConfigModal } from './components/GoalConfigModal';
import { fetchConversAppData } from './services/api';

type ViewMode = 'overview' | 'goals';
type PipelineViewMode = 'list' | 'kanban';

function App() {
  const [data, setData] = useState<DashboardData>(MOCK_DASHBOARD_DATA);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [pipelineViewMode, setPipelineViewMode] = useState<PipelineViewMode>('list');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Date Filter State - Initialized to 'month' for better initial context
  const [dateFilter, setDateFilter] = useState<DateFilterState>(() => {
    return {
      preset: 'month', // Changed default to month for better chart viz
      startDate: '',
      endDate: ''
    };
  });

  // Função isolada para recarregar dados
  const loadData = async () => {
    try {
      // Força loading visual se for chamado manualmente
      setLoading(true);
      setApiError(null);
      
      let currentData = MOCK_DASHBOARD_DATA;
      // if (window.dashboardData) {
      //     currentData = window.dashboardData;
      // }

      // Passamos o filtro de data atual para a API
      const realData = await fetchConversAppData(currentData, dateFilter);
      
      setData(realData);
    } catch (e: any) {
      console.error("Failed to load data", e);
      // Mostra a mensagem de erro real para facilitar o debug
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Erro desconhecido na conexão com API");
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Efeito principal de carga
  useEffect(() => {
    loadData();

    // Configurar Polling (Atualização automática a cada 5 minutos)
    const intervalId = setInterval(() => {
        // Executa sem setar loading global para não piscar
        fetchConversAppData(data, dateFilter)
            .then(newData => {
                setData(newData);
                setApiError(null);
            })
            .catch(e => console.error("Polling error", e));
    }, 5 * 60 * 1000);

    return () => {
        clearInterval(intervalId);
    };
  }, [dateFilter]); // Recarrega sempre que o filtro muda

  const handleUpdateGoals = (newGoals: GoalSettings) => {
    setData(prev => ({
      ...prev,
      currentGoals: newGoals
    }));
  };

  // Loading inicial apenas se não houver dados
  if (loading && !data && !apiError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin text-gold-500">
          <RefreshCcw size={32} />
        </div>
      </div>
    );
  }

  // Calculations for Goals
  const contractsProgress = (data.metrics.totalContracts / data.currentGoals.contractsTarget) * 100;
  const revenueProgress = (data.metrics.totalRevenue / data.currentGoals.revenueTarget) * 100;
  const cashFlowProgress = (data.metrics.totalCashFlow / data.currentGoals.cashFlowTarget) * 100;
  const remainingContracts = Math.max(0, data.currentGoals.contractsTarget - data.metrics.totalContracts);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const salesBreakdown = dataPoint.salesBreakdown;
      const hasBreakdown = salesBreakdown && salesBreakdown.length > 0;

      return (
        <div className="bg-neutral-900 border border-neutral-700 p-3 rounded shadow-xl max-w-[250px] z-50">
          <p className="text-gray-300 text-xs mb-2 border-b border-neutral-800 pb-1">{label ? `Dia ${label}` : ''}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-bold flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span>
                  {entry.name.includes('Count') || entry.name.includes('Leads') || entry.name.includes('value') ? entry.value : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
              </span>
            </p>
          ))}

          {/* Interactive Breakdown */}
          {hasBreakdown && (
              <div className="mt-3 pt-2 border-t border-neutral-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Vendas do Dia:</p>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {salesBreakdown.slice(0, 5).map((sale: any, i: number) => (
                          <div key={i} className="flex justify-between text-[10px] text-gray-400">
                              <span className="truncate max-w-[120px]" title={sale.name}>{sale.name}</span>
                              <span className="text-gold-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sale.value)}</span>
                          </div>
                      ))}
                      {salesBreakdown.length > 5 && (
                          <p className="text-[9px] text-gray-600 italic text-center pt-1">+ {salesBreakdown.length - 5} outros</p>
                      )}
                  </div>
              </div>
          )}
        </div>
      );
    }
    return null;
  };

  const ServiceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
         <div className="bg-neutral-900 border border-neutral-700 p-3 rounded shadow-xl z-50">
            <p className="text-gold-500 font-bold mb-1">{data.name}</p>
            <p className="text-xs text-gray-300">Volume: {data.value} processos</p>
            {data.monetaryValue > 0 && (
                <p className="text-sm text-white font-bold">
                    Gerado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.monetaryValue)}
                </p>
            )}
         </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-3 md:p-6 font-sans selection:bg-gold-500/30 selection:text-gold-200">
      
      {/* Header - Full Width */}
      <header className="w-full px-2 md:px-4 lg:px-6 mb-8 max-w-[2400px] mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-center xl:items-start gap-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <img 
              src="https://i.imgur.com/k7hAWTD.png" 
              alt="Nerik Lino Advogados Logo" 
              className="h-10 md:h-12 w-auto object-contain"
            />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3">
                 <span className="text-xs md:text-sm text-gray-400 tracking-[0.2em] uppercase font-medium md:border-l border-neutral-800 md:pl-3">
                    Performance Dashboard
                 </span>
                 
                 {!apiError ? (
                   <span className="flex items-center gap-1 text-[9px] text-green-500 border border-green-900/50 bg-green-900/10 px-1.5 py-0.5 rounded">
                      <Wifi size={10} />
                      LIVE
                   </span>
                 ) : (
                   <span className="flex items-center gap-1 text-[9px] text-red-400 border border-red-900/50 bg-red-900/10 px-1.5 py-0.5 rounded">
                      <WifiOff size={10} />
                      ERROR
                   </span>
                 )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center justify-center">
             {/* View Switcher */}
            <div className="bg-neutral-900 p-1 rounded-lg border border-neutral-800 flex w-full md:w-auto">
              <button 
                onClick={() => setViewMode('overview')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'overview' ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutDashboard size={14} />
                Visão Geral
              </button>
              <button 
                onClick={() => setViewMode('goals')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'goals' ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20' : 'text-gray-400 hover:text-white'}`}
              >
                <Users size={14} />
                Equipe
              </button>
            </div>
            
            {/* Manual Refresh Button */}
            <button 
              onClick={() => loadData()}
              disabled={loading}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-medium text-gray-400 hover:text-gold-500 hover:border-gold-500/30 transition-all disabled:opacity-50 group"
              title="Atualizar dados agora"
            >
              <RefreshCcw size={14} className={`group-hover:text-gold-500 ${loading ? 'animate-spin text-gold-500' : ''}`} />
            </button>

            <DateFilter filter={dateFilter} onChange={setDateFilter} />
          </div>
        </div>
        
        {apiError && (
            <div className="bg-red-900/20 border border-red-900/50 text-gray-300 text-xs p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-3 mb-4 animate-fadeIn">
                <div className="flex items-center gap-2 text-red-500 shrink-0">
                   <AlertCircle size={18} />
                   <span className="font-bold">Erro na Integração:</span>
                </div>
                <span className="font-mono text-[10px] md:text-xs opacity-80 break-all">
                  {apiError}
                </span>
                <button 
                  onClick={() => loadData()} 
                  className="mt-2 md:mt-0 md:ml-auto text-gold-500 hover:text-white underline whitespace-nowrap"
                >
                  Tentar novamente
                </button>
            </div>
        )}
      </header>

      {/* Goal Config Modal */}
      <GoalConfigModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        currentGoals={data.currentGoals}
        onSave={handleUpdateGoals}
      />

      {/* Main Content - Full Width */}
      <main className="w-full px-2 md:px-4 lg:px-6 space-y-6 max-w-[2400px] mx-auto">
        
        {/* VIEW: OVERVIEW */}
        {viewMode === 'overview' && (
          <>
            {/* GOALS SECTION HEADER */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-neutral-800 rounded-md border border-neutral-700">
                        <Trophy size={18} className="text-gold-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Metas e Performance</h2>
                        <span className="text-[10px] text-gray-500">Acompanhamento de objetivos</span>
                    </div>
                </div>
                <button 
                    onClick={() => setIsGoalModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-xs text-gold-500 hover:text-gold-400 transition-all"
                >
                    <Pencil size={12} />
                    Editar Metas
                </button>
            </div>

            {/* Row 1: KPI Cards with Goal Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              
              {/* KPI 1: Contratos Fechados */}
              <Card className="relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Contratos Fechados</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{data.metrics.totalContracts} <span className="text-sm text-gray-600 font-normal">/ {data.currentGoals.contractsTarget}</span></h3>
                    </div>
                    <div className="p-2 bg-neutral-800 rounded-lg text-gold-500">
                        <FileSignature size={20} />
                    </div>
                 </div>
                 
                 <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span className={`${contractsProgress >= 100 ? 'text-green-500' : 'text-gray-400'}`}>{Math.round(contractsProgress)}% da Meta</span>
                        {remainingContracts > 0 && <span className="text-gray-500 italic">Faltam {remainingContracts}</span>}
                    </div>
                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${contractsProgress >= 100 ? 'bg-green-500' : 'bg-gold-500'}`} style={{ width: `${Math.min(contractsProgress, 100)}%` }}></div>
                    </div>
                 </div>
              </Card>

              {/* KPI 2: Faturamento (Honorários) */}
              <Card className="relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Honorários Gerados</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.metrics.totalRevenue)}
                        </h3>
                    </div>
                    <div className="p-2 bg-neutral-800 rounded-lg text-gold-500">
                        <Briefcase size={20} />
                    </div>
                 </div>
                 
                 <div className="mt-4">
                     <div className="flex justify-between text-xs mb-1">
                        <span className={`${revenueProgress >= 100 ? 'text-green-500' : 'text-gray-400'}`}>{Math.round(revenueProgress)}% da Meta</span>
                        <span className="text-gray-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.currentGoals.revenueTarget)}</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${revenueProgress >= 100 ? 'bg-green-500' : 'bg-gold-500'}`} style={{ width: `${Math.min(revenueProgress, 100)}%` }}></div>
                    </div>
                 </div>
              </Card>

              {/* KPI 3: Entradas (Caixa) */}
              <Card className="relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Entradas (Caixa)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.metrics.totalCashFlow)}
                        </h3>
                    </div>
                    <div className="p-2 bg-neutral-800 rounded-lg text-gold-500">
                        <Wallet size={20} />
                    </div>
                 </div>
                 <div className="mt-4">
                     <div className="flex justify-between text-xs mb-1">
                        <span className={`${cashFlowProgress >= 100 ? 'text-green-500' : 'text-gray-400'}`}>{Math.round(cashFlowProgress)}% da Meta</span>
                        <span className="text-gray-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.currentGoals.cashFlowTarget)}</span>
                    </div>
                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${cashFlowProgress >= 100 ? 'bg-green-500' : 'bg-gold-500'}`} style={{ width: `${Math.min(cashFlowProgress, 100)}%` }}></div>
                    </div>
                 </div>
              </Card>

              {/* KPI 4: Comissões (Cost) */}
               <Card className="relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Comissões (Prov.)</p>
                        <h3 className="text-2xl font-bold text-gold-500 mt-1">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.metrics.totalCommission)}
                        </h3>
                    </div>
                    <div className="p-2 bg-neutral-800 rounded-lg text-gold-500">
                        <Users size={20} />
                    </div>
                 </div>
                 <div className="mt-auto pt-4">
                    <p className="text-xs text-gray-500">Baseado em 10% dos honorários fechados no período.</p>
                 </div>
              </Card>
            </div>

            {/* Row 2: Charts - Evolution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              <Card title="Evolução de Faturamento Diário">
                <div className="h-64 mt-4 min-w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.charts.dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#666" 
                        tick={{fill: '#666', fontSize: 10}} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#666" 
                        tick={{fill: '#666', fontSize: 10}} 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `R$${val/1000}k`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="realizado" name="Realizado" fill="#C59D5F" radius={[4, 4, 0, 0]} barSize={20} />
                      <Line type="monotone" dataKey="meta" name="Meta Diária" stroke="#404040" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Novos Leads (Criação)">
                <div className="h-64 mt-4 min-w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.dailyLeads}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C59D5F" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#C59D5F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#666" 
                        tick={{fill: '#666', fontSize: 10}} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#666" 
                        tick={{fill: '#666', fontSize: 10}} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Novos Leads" stroke="#C59D5F" fillOpacity={1} fill="url(#colorLeads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Row 3: Service & Creative Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              <Card title="Faturamento por Tipo de Ação (Tags do CRM)">
                 <div className="h-64 mt-4 min-w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.charts.services} margin={{ left: 0, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#999" 
                        tick={{fill: '#999', fontSize: 10}} 
                        width={100}
                      />
                      <Tooltip content={<ServiceTooltip />} cursor={{fill: '#ffffff10'}} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.charts.services.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Ranking de Criativos */}
              <CreativeRanking creatives={data.creatives} />
            </div>

            {/* Row 4: Pipeline */}
            <div className="animate-fadeIn">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-neutral-800 rounded-md border border-neutral-700">
                            <TrendingUp size={18} className="text-gold-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase">Pipeline de Vendas</h3>
                            <p className="text-[10px] text-gray-500">Acompanhamento em tempo real</p>
                        </div>
                    </div>
                    <div className="flex bg-neutral-900 rounded p-1 border border-neutral-800 self-end md:self-auto">
                        <button 
                            onClick={() => setPipelineViewMode('list')}
                            className={`p-1.5 rounded transition-colors ${pipelineViewMode === 'list' ? 'bg-neutral-800 text-gold-500' : 'text-gray-500 hover:text-white'}`}
                            title="Lista (Funil)"
                        >
                            <List size={16} />
                        </button>
                         <button 
                            onClick={() => setPipelineViewMode('kanban')}
                            className={`p-1.5 rounded transition-colors ${pipelineViewMode === 'kanban' ? 'bg-neutral-800 text-gold-500' : 'text-gray-500 hover:text-white'}`}
                            title="Kanban (Colunas)"
                        >
                            <Columns size={16} />
                        </button>
                    </div>
                </div>

                {pipelineViewMode === 'list' ? (
                     <PipelineFunnel stages={data.pipeline} />
                ) : (
                     <KanbanBoard stages={data.pipeline} />
                )}
            </div>
          </>
        )}

        {/* VIEW: TEAM GOALS */}
        {viewMode === 'goals' && (
          <Card title="Performance da Equipe" className="animate-fadeIn">
            <div className="mt-4 space-y-2 overflow-x-auto">
                <div className="min-w-[700px] grid grid-cols-1 md:grid-cols-12 gap-4 px-2 py-2 border-b border-neutral-800 text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                    <div className="md:col-span-3">Vendedor</div>
                    <div className="md:col-span-6 text-center">Atividade (Leads / Reuniões / Propostas / Conversão)</div>
                    <div className="md:col-span-3 text-right">Financeiro</div>
                </div>
              {data.team.map((member) => (
                <TeamRow key={member.id} member={member} detailed={true} />
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;
