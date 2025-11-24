
import React from 'react';
import { PipelineStage } from '../types';
import { User } from 'lucide-react';

interface KanbanBoardProps {
  stages: PipelineStage[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ stages }) => {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1200px]">
        {stages.map((stage) => (
          <div key={stage.id} className="w-[280px] shrink-0 flex flex-col">
            {/* Header */}
            <div className={`mb-3 pb-2 border-b-2`} style={{ borderColor: stage.color }}>
              <div className="flex justify-between items-center mb-1">
                 <h4 className="text-sm font-bold text-gray-200 uppercase truncate" title={stage.label}>{stage.label}</h4>
                 <span className="text-xs font-bold bg-neutral-800 px-2 py-0.5 rounded text-white">{stage.count}</span>
              </div>
              {stage.value && stage.value > 0 ? (
                <p className="text-[10px] text-gray-500 font-mono">
                   Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stage.value)}
                </p>
              ) : (
                 <p className="text-[10px] text-gray-500 opacity-0">.</p>
              )}
            </div>

            {/* Column Body */}
            <div className="bg-neutral-900/50 rounded-lg p-2 h-[500px] overflow-y-auto space-y-2 border border-neutral-800/50 scrollbar-thin scrollbar-thumb-neutral-700">
              {stage.cards && stage.cards.length > 0 ? (
                stage.cards.map((card, idx) => (
                  <div key={idx} className="bg-neutral-900 border border-neutral-800 p-3 rounded shadow-sm hover:border-gold-500/50 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                         <span className="text-xs text-gray-500 font-mono">{card.date}</span>
                         {card.value > 0 && (
                             <span className="text-xs font-bold text-gold-500">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(card.value)}
                             </span>
                         )}
                    </div>
                    
                    <h5 className="text-sm font-medium text-white mb-2 leading-tight">{card.title}</h5>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                        {card.tags?.slice(0, 2).map((tag, i) => (
                             <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-gray-400" style={{ borderColor: tag.color + '40' }}>
                                 {tag.name}
                             </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 mt-auto pt-2 border-t border-neutral-800/50">
                        <div className="w-4 h-4 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] text-gray-400">
                           <User size={8} />
                        </div>
                        <span className="text-[10px] text-gray-500 truncate max-w-[140px]">
                           {card.responsibleName || 'Sem dono'}
                        </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-lg opacity-50">
                    <span className="text-xs text-gray-600">Vazio</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
