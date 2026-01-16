
import React, { useState } from 'react';
import { Transaction, TransactionType, RecurrenceFrequency, Account } from '../types';
import { categorizeTransaction } from '../services/geminiService';

interface TransactionFormProps {
  accounts: Account[];
  initialData?: Transaction;
  onAdd: (transaction: Omit<Transaction, 'id'>, recurrenceCount?: number, frequency?: RecurrenceFrequency) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, initialData, onAdd, onClose }) => {
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [description, setDescription] = useState(initialData ? initialData.description : '');
  const [date, setDate] = useState(initialData ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(initialData ? initialData.type : TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState(initialData ? initialData.accountId : accounts[0]?.id || '');
  const [frequency] = useState<RecurrenceFrequency>(RecurrenceFrequency.NONE);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId || !date) return;

    setIsCategorizing(true);
    let category = initialData?.category || "Otros";
    let subCategory = initialData?.subCategory;
    let finalIcon = initialData?.icon || "shopping";

    try {
      if (!initialData || description !== initialData.description) {
        if (type === TransactionType.EXPENSE) {
          const result = await categorizeTransaction(description);
          category = result.category;
          subCategory = result.subCategory;
          finalIcon = result.icon;
        } else {
          category = "Sueldo";
          finalIcon = 'salary';
        }
      }
      
      onAdd(
        {
          accountId,
          amount: parseFloat(amount),
          description,
          type,
          category,
          subCategory,
          date: new Date(date).toISOString(),
          isRecurring: false,
          icon: finalIcon
        },
        1,
        frequency
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsCategorizing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl transition-all overflow-y-auto max-h-[90vh] scrollbar-hide border border-white/20">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter">
          {initialData ? 'Actualizar' : 'Nuevo Registro'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-[2rem]">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 shadow-xl text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 shadow-xl text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
            >
              Ingreso
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-4 italic">¿Cuánto dinero?</label>
              <input
                autoFocus
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-8 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[2.5rem] focus:ring-8 focus:ring-indigo-500/10 outline-none text-4xl font-black text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 transition-all"
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-4">Fecha de transacción</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-black text-slate-700 dark:text-slate-300"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-4">Cuenta origen</label>
                <select 
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] outline-none text-sm font-black text-slate-700 dark:text-slate-300"
                >
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-4">Concepto o detalle</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none text-base font-black text-slate-800 dark:text-white"
                placeholder="Ej: Netflix, Cena Sushi..."
                required
              />
            </div>
          </div>

          <div className="flex gap-6 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-6 text-slate-400 dark:text-slate-600 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCategorizing}
              className="flex-1 py-6 bg-indigo-600 dark:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {isCategorizing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white/20 border-t-white"></div>
              ) : initialData ? 'Guardar' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
