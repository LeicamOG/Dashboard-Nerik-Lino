

import React, { useState } from 'react';
import { PipelineStage, CardSimple } from '../types';
import { Card } from './Card';
import { ChevronDown, ChevronUp, User, Tag } from 'lucide-react';

interface PipelineFunnelProps {
  stages: PipelineStage[];
}

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ stages }) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedStage(expandedStage === id ? null : id);
  };

  return (
    <Card title="Funil de Vendas (CRM)">
      <div className="space-y-4">
        {stages.map((stage) => {
          const isExpanded = expandedStage === stage.id;
          
          return (
            <div key={stage.id} className="group border-b border-neutral-800/50 pb-4 last:border-0 last:pb-0">
              <div 
                className="flex justify-between items-center mb-2 cursor-pointer hover:bg-neutral-800/30 p-1 rounded transition-colors"
                onClick={() => toggleExpand(stage.id)}
              >
                <div className="flex items-center gap-3">
                  <div 
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                      style={{ backgroundColor: stage.color, boxShadow: `0 0 10px ${stage.color}40` }}
                  />
                  <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                    {stage.label}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-gray-600 hidden md:inline">
                      {Math.round((stage.count / Math.max(1, stage.total)) * 100)}%
                   </span>
                   <span className="text-sm font-bold text-white font-mono bg-neutral-800 px-2 py-0.5 rounded">
                     {stage.count}
                   </span>
                </div>
              </div>
              
              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 mb-2">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ 
                      width: `${Math.max((stage.count / stage.total) * 100, 2)}%`,
                      backgroundColor: stage.color
                  }}
                >
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30" />
                </div>
              </div>

              {/* Expanded Details (Card List) */}
              {isExpanded && (
                <div className="mt-3 pl-4 border-l border-neutral-800 animate-fadeIn space-y-2">
                    {stage.cards && stage.cards.length > 0 ? (
                        stage.cards.map((card, idx) => (
                            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:border-gold-500/30 transition-colors">
                                <div>
                                    <h5 className="text-xs font-bold text-gray-200">{card.title}</h5>
                                    <div className="flex items-center gap-3 mt-1">
                                        {card.responsibleName && (
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <User size={10} /> {card.responsibleName}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-600">{card.date}</span>
                                    </div>
                                    {card.tags && card.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1.5 flex-wrap">
                                            {card.tags.map((t, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-gray-300">
                                                    {t.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {card.value > 0 && (
                                    <div className="text-sm font-bold text-gold-500 whitespace-nowrap">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-600 italic py-2">Nenhum card nesta etapa no período selecionado.</p>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};