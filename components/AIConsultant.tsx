
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface AIConsultantProps {
  transactions: Transaction[];
}

export const AIConsultant: React.FC<AIConsultantProps> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getFinancialAdvice(transactions);
      if (result.includes("Error") || result.includes("⚠️")) {
        setError(true);
      }
      setAdvice(result);
    } catch (e) {
      setError(true);
      setAdvice("Error inesperado de conexión con el servidor IA.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && transactions.length % 5 === 0) {
      fetchAdvice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  return (
    <div className="bg-indigo-600 dark:bg-indigo-900/40 text-white rounded-[4rem] p-10 relative overflow-hidden transition-all shadow-2xl mx-2">
      <div className="absolute top-0 right-0 p-10 opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-xl border border-white/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h4 className="text-xl font-black uppercase tracking-[0.3em]">Asistente IA</h4>
      </div>

      {loading ? (
        <div className="flex items-center gap-6 py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white"></div>
          <p className="text-lg font-black italic animate-pulse">Analizando tus finanzas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {advice ? (
            <div className="prose prose-invert max-w-none">
              <div className={`text-lg font-bold leading-relaxed ${error ? 'text-amber-200 opacity-80' : 'text-white'}`} 
                   dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br/>') }}>
              </div>
            </div>
          ) : (
            <p className="text-lg font-bold opacity-60 italic">Necesito al menos 5 transacciones para generar un reporte inteligente.</p>
          )}
          
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={fetchAdvice}
              className={`px-10 py-5 font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 text-sm ${error ? 'bg-amber-500 text-white' : 'bg-white text-indigo-700 hover:bg-slate-50'}`}
            >
              {error ? 'Reintentar Conexión' : 'Actualizar Análisis'}
            </button>
            {error && (
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center italic">
                La API de Google puede estar saturada
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
