
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { CategoryIcons } from './Icons';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit }) => {
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-600">
        <p className="text-base font-black uppercase">Sin actividad</p>
        <p className="text-xs font-bold mt-2 tracking-widest opacity-60 uppercase">Empieza a registrar tus finanzas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1">
      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-4">Movimientos Recientes</h3>
      <div className="space-y-4">
        {sorted.map((t) => (
          <div key={t.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl shadow-sm ${t.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'}`}>
                {t.icon && CategoryIcons[t.icon] ? CategoryIcons[t.icon] : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-slate-800 dark:text-white text-base truncate tracking-tight">{t.description}</p>
                <div className="flex gap-3 items-center mt-2">
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400 font-black uppercase">
                    {t.category}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-600 font-bold">
                    {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <p className={`font-black text-xl ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
              </p>
              <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
