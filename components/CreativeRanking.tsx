
import React from 'react';
import { Card } from './Card';
import { CreativeMetrics } from '../types';
import { ExternalLink, Megaphone, Users } from 'lucide-react';

interface CreativeRankingProps {
  creatives: CreativeMetrics[];
}

export const CreativeRanking: React.FC<CreativeRankingProps> = ({ creatives }) => {
  if (!creatives || creatives.length === 0) {
    return (
      <Card title="Performance de Criativos (Ads)" className="h-full">
        <div className="flex flex-col items-center justify-center h-48 text-gray-600">
           <Megaphone size={32} className="mb-2 opacity-50" />
           <p className="text-sm">Nenhum dado de anúncio detectado.</p>
           <p className="text-[10px] mt-1">Campos monitorados: 'ad_name', 'creative_name' ou tags de origem.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Performance de Criativos (Top Ads)" className="h-full overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 text-[10px] uppercase text-gray-500 tracking-wider">
              <th className="py-2 pl-2">Rank</th>
              <th className="py-2">Criativo / Anúncio</th>
              <th className="py-2 text-center">Leads</th>
              <th className="py-2 text-center">Vendas</th>
              <th className="py-2 text-right pr-2">Receita</th>
            </tr>
          </thead>
          <tbody>
            {creatives.slice(0, 8).map((creative, index) => {
               // Calculate conversion rate specifically for this ad
               const convRate = creative.leads > 0 ? Math.round((creative.sales / creative.leads) * 100) : 0;
               
               return (
                <tr key={creative.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors group">
                  <td className="py-3 pl-2 text-xs font-mono text-gray-600">#{index + 1}</td>
                  <td className="py-3">
                    <div className="flex flex-col">
                       {creative.url ? (
                         <a 
                           href={creative.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-sm font-medium text-white hover:text-gold-500 hover:underline flex items-center gap-1 transition-colors truncate max-w-[180px] md:max-w-[220px]"
                           title={creative.name}
                         >
                            {creative.name}
                            <ExternalLink size={10} className="opacity-50" />
                         </a>
                       ) : (
                         <span className="text-sm font-medium text-white truncate max-w-[180px]" title={creative.name}>
                            {creative.name}
                         </span>
                       )}
                       <span className="text-[9px] text-gray-500">{creative.source}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <Users size={10} className="text-gray-600" />
                        <span className="text-xs font-medium text-gray-300">{creative.leads}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-white">{creative.sales}</span>
                        <span className="text-[9px] text-green-500 bg-green-900/20 px-1 rounded">{convRate}% Conv.</span>
                    </div>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <span className="text-xs font-bold text-gold-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(creative.revenue)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
