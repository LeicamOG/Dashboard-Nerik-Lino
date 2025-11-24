
import React, { useState, useEffect } from 'react';
import { X, Save, Target } from 'lucide-react';
import { GoalSettings } from '../types';

interface GoalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: GoalSettings;
  onSave: (newGoals: GoalSettings) => void;
}

export const GoalConfigModal: React.FC<GoalConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  currentGoals, 
  onSave 
}) => {
  const [formData, setFormData] = useState<GoalSettings>(currentGoals);

  useEffect(() => {
    setFormData(currentGoals);
  }, [currentGoals, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-gold-500/30 rounded-lg w-full max-w-md shadow-2xl animate-fadeIn">
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Target className="text-gold-500" size={20} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Definir Metas do Mês</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Revenue Target */}
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">
              Meta de Honorários (Faturamento)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input
                type="number"
                value={formData.revenueTarget}
                onChange={(e) => setFormData({...formData, revenueTarget: Number(e.target.value)})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-gold-500 focus:outline-none transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Cash Flow Target */}
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">
              Meta de Entradas (Caixa Real)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input
                type="number"
                value={formData.cashFlowTarget}
                onChange={(e) => setFormData({...formData, cashFlowTarget: Number(e.target.value)})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-gold-500 focus:outline-none transition-colors"
                placeholder="0.00"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Valor efetivamente recebido (Pagamentos iniciais/Parcelas).</p>
          </div>

          {/* Contracts Quantity Target */}
          <div>
            <label className="block text-xs uppercase text-gray-500 font-semibold mb-2">
              Meta de Quantidade de Contratos
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.contractsTarget}
                onChange={(e) => setFormData({...formData, contractsTarget: Number(e.target.value)})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-3 px-4 text-white focus:border-gold-500 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black text-sm font-bold rounded-lg shadow-lg shadow-gold-500/20 transition-all flex items-center gap-2"
            >
              <Save size={16} />
              Salvar Metas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
