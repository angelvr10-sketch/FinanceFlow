
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
    <div className="bg-indigo-600 dark:bg-indigo-900/40 text-white rounded-[4rem] p-12 relative overflow-hidden transition-all shadow-2xl mx-2">
      <div className="absolute top-0 right-0 p-10 opacity-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="flex items-center gap-6 mb-10">
        <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-xl border border-white/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h4 className="text-xl font-black uppercase tracking-[0.3em]">Consejero Pro</h4>
      </div>

      {loading ? (
        <div className="flex items-center gap-6">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white"></div>
          <p className="text-lg font-black italic">Refinando tu estrategia financiera...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {advice ? (
            <div className="prose prose-invert max-w-none">
              <div className="text-lg font-bold leading-relaxed opacity-95" dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br/>') }}></div>
            </div>
          ) : (
            <p className="text-lg font-black opacity-70">Tu asesor de IA necesita al menos 5 movimientos para analizar patrones.</p>
          )}
          <div className="pt-6">
            <button 
              onClick={fetchAdvice}
              className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-700 text-sm font-black uppercase tracking-widest rounded-[2rem] shadow-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Nuevo Análisis IA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
