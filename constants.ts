

import { DashboardData } from './types';

export const MOCK_DASHBOARD_DATA: DashboardData = {
  lastUpdated: new Date().toISOString(),
  currentGoals: {
    revenueTarget: 200000,
    cashFlowTarget: 80000,
    contractsTarget: 25 // Increased target slightly based on pipeline volume
  },
  metrics: {
    totalRevenue: 150000,
    totalCashFlow: 45000,
    totalContracts: 20, // Updated to match "CONTRATO ASSINADO" in pipeline
    totalCommission: 14650,
    totalProposalValue: 65000 // Valor em aberto de propostas
  },
  charts: {
    dailyRevenue: [
      { day: '01', fullDate: '2023-10-01', meta: 5000, realizado: 4200, salesBreakdown: [{name: 'Cliente A', value: 2000}, {name: 'Cliente B', value: 2200}] },
      { day: '05', fullDate: '2023-10-05', meta: 25000, realizado: 21000, salesBreakdown: [{name: 'Divórcio Silva', value: 15000}, {name: 'Inventário Souza', value: 6000}] },
      { day: '10', fullDate: '2023-10-10', meta: 50000, realizado: 58000, salesBreakdown: [{name: 'Empresarial Tech', value: 30000}, {name: 'Holding Familiar', value: 28000}] },
      { day: '15', fullDate: '2023-10-15', meta: 75000, realizado: 72000, salesBreakdown: [{name: 'Ação Trabalhista', value: 5000}] },
      { day: '20', fullDate: '2023-10-20', meta: 100000, realizado: 110000, salesBreakdown: [{name: 'Contrato Internacional', value: 40000}] },
      { day: '25', fullDate: '2023-10-25', meta: 125000, realizado: 135000, salesBreakdown: [{name: 'Fusão M&A', value: 25000}] },
      { day: '30', fullDate: '2023-10-30', meta: 150000, realizado: 150000, salesBreakdown: [{name: 'Regularização Imóvel', value: 15000}] },
    ],
    dailyLeads: [
        { day: '01', count: 12 },
        { day: '05', count: 8 },
        { day: '10', count: 15 },
        { day: '15', count: 20 },
        { day: '20', count: 10 },
        { day: '25', count: 22 },
        { day: '30', count: 18 },
    ],
    services: [
      { name: 'Divórcio', value: 45, monetaryValue: 80000, color: '#C59D5F' },
      { name: 'Inventário', value: 30, monetaryValue: 45000, color: '#404040' },
      { name: 'Bancário', value: 15, monetaryValue: 15000, color: '#737373' },
      { name: 'Criminal', value: 10, monetaryValue: 10000, color: '#262626' },
    ],
    traffic: [
      { name: 'Google Ads', value: 50, salesCount: 15, conversionRate: 12, color: '#4285F4' },
      { name: 'Instagram', value: 30, salesCount: 8, conversionRate: 8, color: '#E1306C' },
      { name: 'Indicação', value: 15, salesCount: 12, conversionRate: 40, color: '#34A853' },
      { name: 'Orgânico', value: 5, salesCount: 1, conversionRate: 5, color: '#999999' },
    ]
  },
  creatives: [
    {
      id: '1',
      name: 'Video Depoimento 01',
      url: 'https://instagram.com/p/12345',
      source: 'Instagram',
      leads: 45,
      sales: 5,
      revenue: 15000
    },
    {
      id: '2',
      name: 'Carrossel Dúvidas',
      url: 'https://instagram.com/p/67890',
      source: 'Instagram',
      leads: 30,
      sales: 2,
      revenue: 5000
    },
    {
      id: '3',
      name: 'Search Institucional',
      source: 'Google Ads',
      leads: 50,
      sales: 8,
      revenue: 25000
    }
  ],
  pipeline: [
    { id: 'base', label: 'BASE', count: 25, total: 100, color: '#0ea5e9', cards: [] }, 
    { id: 'qual', label: 'QUALIFICADO', count: 35, total: 100, color: '#84cc16', cards: [] }, 
    { id: 'disqual', label: 'DESQUALIFICADO', count: 38, total: 100, color: '#ef4444', cards: [] }, 
    { id: 'follow', label: 'FOLLOW-UP', count: 31, total: 100, color: '#fed7aa', cards: [] }, 
    { id: 'meeting', label: 'REUNIÃO AGENDADA', count: 19, total: 100, color: '#eab308', cards: [] }, 
    { id: 'contract', label: 'CONTRATO ASSINADO', count: 20, total: 100, color: '#db2777', cards: [] }, 
    { id: 'payment', label: 'PAGAMENTO CONFIRMADO', count: 23, total: 100, color: '#16a34a', cards: [] }, 
  ],
  team: [
    {
      id: '1',
      name: 'Dr. Roberto Silva',
      role: 'Closer',
      sales: 85000,
      target: 100000,
      commission: 8500,
      avatarInitial: 'R',
      activity: {
        leads: 45,
        scheduledMeetings: 15,
        meetingsHeld: 12,
        proposalsSent: 10,
        contractsSigned: 6,
        conversionRate: 50
      }
    },
    {
      id: '2',
      name: 'Dra. Amanda Costa',
      role: 'Vendedor',
      sales: 45000,
      target: 80000,
      commission: 4500,
      avatarInitial: 'A',
      activity: {
        leads: 30,
        scheduledMeetings: 12,
        meetingsHeld: 10,
        proposalsSent: 8,
        contractsSigned: 4,
        conversionRate: 40
      }
    }
  ]
};