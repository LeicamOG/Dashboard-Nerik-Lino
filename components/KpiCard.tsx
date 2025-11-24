import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from './Card';

interface KpiCardProps {
  label: string;
  value: number;
  subtext?: string;
  growth?: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  suffix?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  growth,
  icon: Icon,
  isCurrency = false,
  suffix = ''
}) => {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : value + suffix;

  return (
    <Card className="relative overflow-hidden group hover:border-gold-500/30 transition-colors duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={48} className="text-gold-500" />
      </div>
      
      <div className="relative z-10">
        <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</h4>
        <div className="text-2xl md:text-3xl font-bold text-white mb-2 font-sans">
          {formattedValue}
        </div>
        
        <div className="flex items-center gap-2">
          {growth !== undefined && (
            <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${growth >= 0 ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
              {growth >= 0 ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {Math.abs(growth)}%
            </span>
          )}
          {subtext && (
            <span className="text-xs text-gold-500/80 font-medium">
              {subtext}
            </span>
          )}
        </div>
      </div>
      
      {/* Decorative Gold Line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
};