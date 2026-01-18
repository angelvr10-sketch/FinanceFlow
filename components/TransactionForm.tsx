
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Account, TransactionTemplate } from '../types';
import { categorizeTransaction } from '../services/geminiService';
import { CategoryIcons } from './Icons';

interface TransactionFormProps {
  accounts: Account[];
  templates: TransactionTemplate[];
  initialData?: Transaction;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, templates, initialData, onAdd, onClose }) => {
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [date, setDate] = useState(initialData ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(initialData ? initialData.type : TransactionType.EXPENSE);
  
  // Lógica para determinar la cuenta por defecto: Prioridad a Efectivo
  const defaultAccountId = useMemo(() => {
    if (initialData) return initialData.accountId;
    const cashAcc = accounts.find(a => a.type === 'EFECTIVO');
    return cashAcc ? cashAcc.id : (accounts[0]?.id || '');
  }, [accounts, initialData]);

  const [accountId, setAccountId] = useState(defaultAccountId);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const applyTemplate = (t: TransactionTemplate) => {
    setAmount(t.amount.toString());
    setDescription(t.description);
    setType(t.type);
    setAccountId(t.accountId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId || !date) return;

    setIsCategorizing(true);
    let category = initialData?.category || "Otros";
    let subCategory = initialData?.subCategory;
    let finalIcon = initialData?.icon || "shopping";

    try {
      if (!initialData || description !== initialData.description) {
        const result = await categorizeTransaction(description, type);
        category = result.category;
        subCategory = result.subCategory;
        finalIcon = result.icon;
      }
      
      onAdd({
        accountId,
        amount: parseFloat(amount),
        description,
        type,
        category,
        subCategory,
        date: new Date(date).toISOString(),
        isRecurring: false,
        icon: finalIcon
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsCategorizing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center p-8 z-[100] animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[4rem] p-10 shadow-2xl transition-all overflow-y-auto max-h-[90vh] scrollbar-hide border border-white/10">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">
          {initialData ? 'Actualizar' : 'Nuevo Registro'}
        </h2>
        
        {/* Plantillas Sugeridas */}
        {!initialData && templates.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2">Plantillas rápidas</p>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="shrink-0 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black text-slate-600 dark:text-slate-300 border border-transparent hover:border-indigo-500 active:scale-95 transition-all"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-[2.5rem]">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-4 rounded-[2rem] text-xs font-black transition-all uppercase tracking-widest ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 shadow-xl text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-4 rounded-[2rem] text-xs font-black transition-all uppercase tracking-widest ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 shadow-xl text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
            >
              Ingreso
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-4 italic">Monto</label>
              <input
                autoFocus
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[2.5rem] focus:ring-8 focus:ring-indigo-500/10 outline-none text-5xl font-black text-slate-900 dark:text-white placeholder:text-slate-200 transition-all text-center"
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-4">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none text-sm font-black text-slate-700 dark:text-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-4">Cuenta</label>
                <select 
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none text-sm font-black text-slate-700 dark:text-slate-300"
                >
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-4">Concepto</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none text-lg font-black text-slate-800 dark:text-white"
                placeholder="Ej: Netflix, Cena..."
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-5 text-slate-400 dark:text-slate-600 font-black text-xs uppercase tracking-widest"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isCategorizing}
              className="flex-2 py-5 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-3 px-8"
            >
              {isCategorizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              ) : initialData ? 'Guardar' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
