import React from 'react';
import { TeamMember } from '../types';

interface TeamRowProps {
  member: TeamMember;
  detailed?: boolean;
}

export const TeamRow: React.FC<TeamRowProps> = ({ member, detailed = false }) => {
  const percentage = Math.min((member.sales / member.target) * 100, 100);
  
  const formattedSales = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(member.sales);
  const formattedCommission = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(member.commission);

  if (detailed) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-neutral-800 hover:bg-neutral-800/30 px-2 rounded transition-colors items-center">
        {/* User Info */}
        <div className="md:col-span-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-gold-500/30 flex items-center justify-center text-gold-500 text-xs font-bold">
            {member.avatarInitial}
            </div>
            <div>
            <h5 className="text-sm font-semibold text-white truncate">{member.name}</h5>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{member.role}</span>
            </div>
        </div>

        {/* Activity Metrics - Only visible on desktop/tablet usually, simplified for mobile */}
        <div className="md:col-span-6 grid grid-cols-4 gap-2 text-center">
            <div>
                <p className="text-[10px] text-gray-500 uppercase">Leads</p>
                <p className="text-sm font-medium text-gray-300">{member.activity.leads}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase">Reuniões</p>
                <p className="text-sm font-medium text-white">{member.activity.meetingsHeld}/{member.activity.scheduledMeetings}</p>
            </div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase">Propostas</p>
                <p className="text-sm font-medium text-indigo-400">{member.activity.proposalsSent}</p>
            </div>
             <div>
                <p className="text-[10px] text-gray-500 uppercase">Conv.</p>
                <p className="text-sm font-medium text-green-400">{member.activity.conversionRate}%</p>
            </div>
        </div>

        {/* Financials */}
        <div className="md:col-span-3 text-right">
             <p className="text-[10px] text-gray-500 uppercase">Vendido</p>
             <p className="text-sm font-bold text-gold-500">{formattedSales}</p>
        </div>
      </div>
    );
  }

  // Compact View (Original)
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 px-2 rounded transition-colors">
      <div className="flex items-center gap-4 mb-3 md:mb-0 w-full md:w-1/3">
        <div className="w-10 h-10 rounded-full bg-neutral-800 border border-gold-500/30 flex items-center justify-center text-gold-500 font-bold shadow-inner">
          {member.avatarInitial}
        </div>
        <div>
          <h5 className="text-sm font-semibold text-white">{member.name}</h5>
          <span className="text-xs text-gray-500 uppercase tracking-wider">{member.role}</span>
        </div>
      </div>

      <div className="w-full md:w-1/3 px-2 mb-3 md:mb-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Progresso</span>
          <span className="text-gold-500 font-bold">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="w-full md:w-1/3 flex justify-between md:justify-end gap-8 items-center">
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase">Vendido</p>
          <p className="text-sm font-bold text-white">{formattedSales}</p>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-xs text-gray-500 uppercase">Comissão</p>
          <p className="text-sm font-bold text-gold-500">{formattedCommission}</p>
        </div>
      </div>
    </div>
  );
};