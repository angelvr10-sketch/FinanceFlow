
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Account, TransactionTemplate } from '../types';
import { categorizeTransaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ICON_MAP } from '../services/geminiService';
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
  const [accountId, setAccountId] = useState(initialData?.accountId || accounts.find(a => a.type === 'EFECTIVO')?.id || accounts[0]?.id || '');
  
  const [category, setCategory] = useState(initialData?.category || "Otros Gastos");
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || "");
  const [icon, setIcon] = useState(initialData?.icon || "shopping");
  
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiStatus, setAiStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const availableCategories = useMemo(() => 
    type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  , [type]);

  // Efecto para intentar categorizar al terminar de escribir la descripción
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (description.length > 3 && !initialData) {
        setIsCategorizing(true);
        try {
          const result = await categorizeTransaction(description, type);
          setCategory(result.category);
          setSubCategory(result.subCategory || "");
          setIcon(result.icon);
          setAiStatus(result.confidence > 0.5 ? 'SUCCESS' : 'ERROR');
        } catch (e) {
          setAiStatus('ERROR');
        } finally {
          setIsCategorizing(false);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [description, type, initialData]);

  const applyTemplate = (t: TransactionTemplate) => {
    setAmount(t.amount.toString());
    setDescription(t.description);
    setType(t.type);
    setAccountId(t.accountId);
    setCategory(t.category);
    setIcon(t.icon || "shopping");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId || !date) return;

    onAdd({
      accountId,
      amount: parseFloat(amount),
      description,
      type,
      category,
      subCategory: subCategory || undefined,
      date: new Date(date).toISOString(),
      isRecurring: false,
      icon
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[4rem] p-8 shadow-2xl transition-all overflow-y-auto max-h-[95vh] scrollbar-hide border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            {initialData ? 'Editar Registro' : 'Nuevo Registro'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {!initialData && templates.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {templates.map(t => (
              <button key={t.id} type="button" onClick={() => applyTemplate(t)} className="shrink-0 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase border border-transparent hover:border-indigo-500 transition-all">
                {t.name}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-3xl">
            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 shadow-lg text-rose-500' : 'text-slate-500'}`}>Gasto</button>
            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 shadow-lg text-emerald-500' : 'text-slate-500'}`}>Ingreso</button>
          </div>

          <div className="space-y-4">
            <input
              autoFocus
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl text-4xl font-black text-slate-900 dark:text-white placeholder:text-slate-200 transition-all text-center outline-none ring-offset-0 focus:ring-4 focus:ring-indigo-500/10"
              placeholder="0.00"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent outline-none text-xs font-black text-slate-700 dark:text-slate-300" required />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuenta</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-transparent outline-none text-xs font-black text-slate-700 dark:text-slate-300 appearance-none">
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl outline-none text-sm font-black text-slate-800 dark:text-white pr-10"
                placeholder="Descripción (ej: Paracetamol 500mg)"
                required
              />
              {isCategorizing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500/20 border-t-indigo-500"></div>
                </div>
              )}
            </div>

            {/* SECCIÓN DE CATEGORÍA MANUAL / INTELIGENTE */}
            <div className={`p-6 rounded-[2.5rem] transition-all border ${aiStatus === 'ERROR' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
              <div className="flex justify-between items-center mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categorización</p>
                {aiStatus === 'SUCCESS' && <span className="text-[8px] font-black text-emerald-500 uppercase">IA OK</span>}
                {aiStatus === 'ERROR' && <span className="text-[8px] font-black text-amber-500 uppercase">Selección Manual</span>}
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl text-white shadow-lg ${type === TransactionType.INCOME ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  {CategoryIcons[icon] || CategoryIcons.other}
                </div>
                <div className="flex-1 space-y-2">
                  <select 
                    value={category} 
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setIcon(ICON_MAP[e.target.value] || "other");
                      setAiStatus('IDLE'); // Marcamos como manual si el usuario cambia
                    }} 
                    className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 outline-none shadow-sm"
                  >
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Subcategoría (opcional)" 
                    value={subCategory} 
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 outline-none shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCategorizing}
            className="w-full py-5 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {initialData ? 'Actualizar Registro' : 'Confirmar Movimiento'}
          </button>
        </form>
      </div>
    </div>
  );
};
