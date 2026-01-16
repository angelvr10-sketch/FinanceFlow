
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface AIConsultantProps {
  transactions: Transaction[];
}

export const AIConsultant: React.FC<AIConsultantProps> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions);
    setAdvice(result);
    setLoading(false);
  };

  useEffect(() => {
    if (transactions.length > 0 && transactions.length % 5 === 0) {
      fetchAdvice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  return (
    <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[3rem] p-10 relative overflow-hidden transition-colors shadow-inner">
      <div className="absolute top-0 right-0 p-8 opacity-[0.05] dark:opacity-[0.15]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-3 rounded-2xl shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-[0.3em]">Consejero Gemini</h4>
      </div>

      {loading ? (
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-5 w-5 border-3 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 italic">Analizando patrones financieros...</p>
        </div>
      ) : (
        <div className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-200/90 space-y-5">
          {advice ? (
            <div className="prose prose-sm font-bold dark:prose-invert text-sm" dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br/>') }}></div>
          ) : (
            <p className="font-black opacity-60">Tu asesor está listo. Registra más movimientos para recibir consejos personalizados.</p>
          )}
          <div className="pt-4">
            <button 
              onClick={fetchAdvice}
              className="px-6 py-3 bg-white dark:bg-indigo-600/30 text-xs font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest rounded-2xl border border-indigo-100 dark:border-indigo-500/20 hover:scale-105 transition-all shadow-sm"
            >
              Recalcular Análisis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
