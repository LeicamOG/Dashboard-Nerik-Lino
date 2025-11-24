

export interface DailyPerformance {
  day: string; // DD/MM
  fullDate: string; // YYYY-MM-DD para ordenação
  meta: number;
  realizado: number;
  salesBreakdown?: { name: string; value: number }[]; // Details for tooltip
}

export interface DailyLeads {
  day: string;
  count: number;
}

export interface ServiceData {
  name: string;
  value: number; // Count (Volume)
  monetaryValue: number; // Revenue generated
  color: string;
}

export interface TrafficSource {
  name: string;
  value: number; // Percentage or count
  salesCount: number; // Para calculo de conversão
  conversionRate: number;
  color: string;
}

export interface CreativeMetrics {
  id: string;
  name: string;
  url?: string;
  source: string; // Google, Meta, etc.
  leads: number;
  sales: number;
  revenue: number;
}

export interface ActivityMetrics {
  leads: number;
  scheduledMeetings: number;
  meetingsHeld: number;
  proposalsSent: number;
  contractsSigned: number;
  conversionRate: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Closer' | 'SDR' | 'Vendedor';
  sales: number;
  target: number;
  commission: number;
  avatarInitial: string;
  activity: ActivityMetrics;
}

export interface FinancialKPI {
  value: number;
  label: string;
  subtext?: string;
  growth?: number;
  isCurrency: boolean;
  prefix?: string;
  suffix?: string;
}

export interface CardSimple {
  id: string;
  title: string;
  value: number;
  responsibleName?: string;
  date: string;
  tags: { name: string; color: string }[];
  adName?: string;
  adUrl?: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  total: number;
  color: string;
  value?: number; // Valor monetário total na etapa
  cards: CardSimple[]; // Lista de cards para visualização expandida
}

export interface GoalSettings {
  revenueTarget: number; // Meta de Faturamento (Honorários Gerados)
  cashFlowTarget: number; // Meta de Caixa (Entradas)
  contractsTarget: number; // Meta de Quantidade de Contratos
}

export type DateRangePreset = 'today' | 'week' | 'month' | 'last_month' | 'custom' | 'all';

export interface DateFilterState {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
}

export interface DashboardData {
  lastUpdated: string;
  currentGoals: GoalSettings;
  metrics: {
    totalRevenue: number; // Honorários Gerados
    totalCashFlow: number; // Entradas
    totalContracts: number; // Qtd Contratos
    totalCommission: number; // Comissões Provisionadas
    totalProposalValue: number; // Valores em Aberto (Propostas Enviadas)
  };
  charts: {
    dailyRevenue: DailyPerformance[];
    dailyLeads: DailyLeads[];
    services: ServiceData[];
    traffic: TrafficSource[];
  };
  creatives: CreativeMetrics[];
  pipeline: PipelineStage[];
  team: TeamMember[];
}

// --- Interfaces Específicas da API WTS (ConversApp) ---

export interface WtsTag {
  id: string;
  name: string;
  nameColor: string;
  bgColor: string;
}

export interface WtsUtm {
  source?: string;
  campaign?: string; // Standard
  Campaign?: string; // User specific
  medium?: string;
  content?: string;
  term?: string;
  referalurl?: string; // User specific (typo intentional)
  referralUrl?: string;
}

export interface WtsContact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  createdAt?: string;
  // Flexible custom fields: can be array of objects OR a direct key-value map
  customFields?: { id: string; name?: string; value: any }[] | Record<string, any>; 
  tags?: WtsTag[] | string[];
  utm?: WtsUtm;
}

export interface WtsCardItem {
  id: string;
  title: string;
  description?: string;
  monetaryAmount: number | null;
  createdAt: string;
  updatedAt: string;
  stepId?: string; 
  stepName?: string; 
  responsibleUserId?: string;
  responsibleUser?: {
    id: string;
    name: string;
  } | null;
  tagIds: string[]; // Array de IDs que ligam à interface WtsTag
  status?: string; 
  // Custom fields handling for Ads
  customFields?: { id: string; value: any; name?: string }[] | Record<string, any>;
  ad_name?: string;
  ad_url?: string;
  origin?: string;
  // Campos extras comuns em listas planas
  stageId?: string;
  columnId?: string;
  contactId?: string;
  contacts?: WtsContact[]; // Lista de contatos vinculados ao card
  contact?: WtsContact; // Single contact fallback
  fullContact?: WtsContact; // Helper property after merge
}

export interface WtsStep {
  id: string;
  title: string;
  position: number;
  cardCount: number;
  monetaryAmount: number;
  cards: {
    items: WtsCardItem[];
    totalItems: number;
  } | WtsCardItem[]; // Suporte a array direto
  items?: WtsCardItem[]; // Suporte alternativo
}

export interface WtsResponse {
  id: string; // Panel ID
  title: string;
  stepTitles: string[];
  tags: WtsTag[]; // Definições das tags (Cores, Nomes)
  steps: WtsStep[]; // Dados hierárquicos (Colunas -> Cards)
  // Suporte para resposta híbrida (Steps separados de Cards)
  cards?: WtsCardItem[];
  items?: WtsCardItem[];
  // Direct contacts list support if fetched separately
  contacts?: WtsContact[];
  data?: WtsCardItem[];
}

declare global {
  interface Window {
    dashboardData?: DashboardData;
  }
}