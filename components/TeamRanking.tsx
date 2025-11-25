import React from 'react';
import { TeamMember } from '../types';
import { Card } from './Card';
import { Trophy, Medal, UserCheck } from 'lucide-react';

interface TeamRankingProps {
  members: TeamMember[];
}

export const TeamRanking: React.FC<TeamRankingProps> = ({ members }) => {
  // Filter out invalid members (Unassigned or No Name) AND those without minimal responsibility/activity
  const activeMembers = members.filter(m => 
      m.name !== 'Sem Responsável' && 
      m.name !== '?' && 
      m.id !== 'unassigned' && 
      // Ensure user has some activity or responsibility to appear in ranking
      (m.sales > 0 || m.activity.leads > 0 || m.activity.meetingsHeld > 0 || m.activity.contractsSigned > 0 || m.commission > 0)
  );

  // Sort by Sales (Revenue) descending
  const sortedMembers = [...activeMembers].sort((a, b) => b.sales - a.sales);

  const getMedalColor = (index: number) => {
    switch(index) {
        case 0: return 'text-yellow-400';
        case 1: return 'text-gray-400';
        case 2: return 'text-amber-700';
        default: return 'text-gray-700';
    }
  };

  return (
    <Card className="animate-fadeIn">
       <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-4">
           <Trophy className="text-gold-500" size={24} />
           <div>
               <h3 className="text-lg font-bold text-white uppercase tracking-wider">Ranking Mensal</h3>
               <p className="text-xs text-gray-500">Classificação por volume de vendas confirmadas</p>
           </div>
       </div>

       <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
               <thead>
                   <tr className="text-[10px] uppercase text-gray-500 border-b border-neutral-800">
                       <th className="py-3 pl-4">Posição</th>
                       <th className="py-3">Colaborador</th>
                       <th className="py-3 text-center">Função</th>
                       <th className="py-3 text-center">Contratos</th>
                       <th className="py-3 text-right pr-4">Vendas (R$)</th>
                   </tr>
               </thead>
               <tbody>
                   {sortedMembers.map((member, index) => (
                       <tr key={member.id} className={`border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors ${index === 0 ? 'bg-gold-500/5' : ''}`}>
                           <td className="py-4 pl-4">
                               <div className="flex items-center gap-3">
                                   {index < 3 ? (
                                       <Medal size={20} className={getMedalColor(index)} />
                                   ) : (
                                       <span className="w-5 text-center text-sm font-bold text-gray-600">#{index + 1}</span>
                                   )}
                               </div>
                           </td>
                           <td className="py-4">
                               <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-gold-500 text-black border-gold-400' : 'bg-neutral-800 text-gray-400 border-neutral-700'}`}>
                                       {member.avatarInitial}
                                   </div>
                                   <div>
                                       <p className={`text-sm font-bold ${index === 0 ? 'text-gold-500' : 'text-white'}`}>{member.name}</p>
                                       <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <UserCheck size={10} />
                                            <span>{member.activity.conversionRate}% Conv.</span>
                                       </div>
                                   </div>
                               </div>
                           </td>
                           <td className="py-4 text-center">
                               <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-neutral-800 rounded text-gray-400 border border-neutral-700">
                                   {member.role}
                               </span>
                           </td>
                           <td className="py-4 text-center">
                               <span className="text-sm font-bold text-white">{member.activity.contractsSigned}</span>
                           </td>
                           <td className="py-4 text-right pr-4">
                               <span className="text-sm font-bold text-gold-500">
                                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(member.sales)}
                               </span>
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
    </Card>
  );
};