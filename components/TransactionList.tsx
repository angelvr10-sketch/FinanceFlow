
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { CategoryIcons } from './Icons';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-sm">No hay transacciones registradas.</p>
        <p className="text-xs">¡Usa el botón + para empezar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Actividad Reciente</h3>
      <div className="space-y-2">
        {sorted.map((t) => (
          <div key={t.id} className="group bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {t.icon && CategoryIcons[t.icon] ? (
                  CategoryIcons[t.icon]
                ) : (
                  t.type === TransactionType.INCOME ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )
                )}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{t.description}</p>
                  {t.isRecurring && (
                    <svg title="Transacción recurrente" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium capitalize">{t.category}</span>
                  <span className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
              </p>
              <button 
                onClick={() => onDelete(t.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
