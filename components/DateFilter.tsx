
import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateFilterState, DateRangePreset } from '../types';

interface DateFilterProps {
  filter: DateFilterState;
  onChange: (newFilter: DateFilterState) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({ filter, onChange }) => {
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as DateRangePreset;
    let startDate = '';
    let endDate = '';
    
    // Helper to get local date string YYYY-MM-DD
    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const today = new Date();
    endDate = formatDate(today);

    if (preset === 'today') startDate = endDate;
    if (preset === 'week') {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        startDate = formatDate(d);
    }
    if (preset === 'month') {
        const d = new Date(today);
        d.setDate(1);
        startDate = formatDate(d);
    }
    if (preset === 'last_month') {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        startDate = formatDate(d);
        const e = new Date(today);
        e.setDate(0); // Last day of prev month
        endDate = formatDate(e);
    }
    if (preset === 'all') {
        startDate = '2000-01-01'; // Far past
        endDate = '2099-12-31';   // Far future
    }
    
    onChange({ preset, startDate, endDate });
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onChange({ ...filter, preset: 'custom', [field]: value });
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
      {/* Dropdown Container */}
      <div className="relative group">
        <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-lg hover:border-gold-500/50 transition-colors shadow-lg">
          <Calendar size={16} className="text-gold-500 ml-3 pointer-events-none" />
          <select 
            value={filter.preset}
            onChange={handlePresetChange}
            className="bg-transparent text-sm text-white pl-2 pr-10 py-2.5 appearance-none focus:outline-none cursor-pointer w-full md:w-[160px] font-medium rounded-lg"
          >
            <option value="today" className="bg-neutral-900">Hoje</option>
            <option value="week" className="bg-neutral-900">Esta Semana</option>
            <option value="month" className="bg-neutral-900">Este Mês</option>
            <option value="last_month" className="bg-neutral-900">Mês Passado</option>
            <option value="all" className="bg-neutral-900">Todo o Período</option>
            <option value="custom" className="bg-neutral-900">Personalizado</option>
          </select>
          <ChevronDown size={14} className="text-gray-400 absolute right-3 pointer-events-none group-hover:text-gold-500 transition-colors" />
        </div>
      </div>

      {/* Custom Date Inputs */}
      {filter.preset === 'custom' && (
        <div className="flex items-center gap-2 animate-fadeIn bg-neutral-900/50 p-1 rounded-lg border border-neutral-800/50">
          <input 
            type="date" 
            value={filter.startDate}
            onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
            className="bg-neutral-800 border border-neutral-600 text-white text-xs rounded-lg px-3 py-2.5 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all shadow-inner"
            style={{ colorScheme: 'dark' }}
          />
          <span className="text-gray-500 text-xs font-medium">até</span>
          <input 
            type="date" 
            value={filter.endDate}
            onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
            className="bg-neutral-800 border border-neutral-600 text-white text-xs rounded-lg px-3 py-2.5 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all shadow-inner"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      )}
    </div>
  );
};