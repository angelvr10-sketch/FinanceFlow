
import React, { useState } from 'react';
import { Transaction, TransactionType, RecurrenceFrequency } from '../types';
import { categorizeTransaction } from '../services/geminiService';
import { CategoryIcons, getDefaultIcon } from './Icons';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>, recurrenceCount?: number, frequency?: RecurrenceFrequency) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onClose }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(RecurrenceFrequency.NONE);
  const [recurrenceCount, setRecurrenceCount] = useState('2');
  const [selectedIcon, setSelectedIcon] = useState('shopping');
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setIsCategorizing(true);
    let category = "Otros";
    let finalIcon = selectedIcon;

    if (type === TransactionType.EXPENSE) {
      category = await categorizeTransaction(description);
      // If user didn't manually pick an icon, we can try to guess it from the AI category
      // but for this implementation, we prioritize the picker.
    } else {
      category = "Sueldo";
      finalIcon = 'salary';
    }
    
    onAdd(
      {
        amount: parseFloat(amount),
        description,
        type,
        category,
        date: new Date().toISOString(),
        isRecurring: frequency !== RecurrenceFrequency.NONE,
        icon: finalIcon
      },
      frequency !== RecurrenceFrequency.NONE ? parseInt(recurrenceCount) : 1,
      frequency
    );
    
    setIsCategorizing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-in-center max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Nueva Transacción</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto ($)</label>
            <input
              autoFocus
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej: Almuerzo, Uber, Sueldo..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Icono de Categoría</label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {Object.keys(CategoryIcons).map((iconKey) => (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setSelectedIcon(iconKey)}
                  className={`p-3 rounded-xl border transition-all shrink-0 ${
                    selectedIcon === iconKey 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  {CategoryIcons[iconKey]}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Frecuencia (Recurrente)</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value={RecurrenceFrequency.NONE}>Única vez</option>
              <option value={RecurrenceFrequency.DAILY}>Diario</option>
              <option value={RecurrenceFrequency.WEEKLY}>Semanal</option>
              <option value={RecurrenceFrequency.MONTHLY}>Mensual</option>
            </select>
          </div>

          {frequency !== RecurrenceFrequency.NONE && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">¿Cuántas veces?</label>
              <input
                type="number"
                min="2"
                max="365"
                value={recurrenceCount}
                onChange={(e) => setRecurrenceCount(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCategorizing}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {isCategorizing ? 'Categorizando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
