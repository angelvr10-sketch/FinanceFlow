
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface AIConsultantProps {
  transactions: Transaction[];
}

export const AIConsultant: React.FC<AIConsultantProps> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'OK' | 'ERROR'>('IDLE');

  const fetchAdvice = async () => {
    if (transactions.length < 5) return;
    setLoading(true);
    setStatus('IDLE');
    try {
      const result = await getFinancialAdvice(transactions);
      setAdvice(result);
      setStatus('OK');
    } catch (e) {
      setStatus('ERROR');
      setAdvice("No he podido procesar los datos en este momento. Mi cerebro financiero está bajo mucha carga. ¿Podemos intentar de nuevo?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo pedir consejo automáticamente la primera vez que llegamos a 5 o cada 10 nuevos
    if (transactions.length >= 5 && (transactions.length === 5 || transactions.length % 10 === 0)) {
      fetchAdvice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  return (
    <div className={`rounded-[3rem] p-8 relative overflow-hidden transition-all shadow-xl mx-2 ${
      status === 'ERROR' ? 'bg-amber-600 dark:bg-amber-900/40' : 'bg-indigo-600 dark:bg-indigo-900/40'
    } text-white`}>
      <div className="absolute -top-10 -right-10 opacity-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-64 w-64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h4 className="text-lg font-black uppercase tracking-widest">Asistente de Razonamiento</h4>
        </div>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <p className="text-sm font-black uppercase tracking-tighter opacity-80">Analizando correlaciones financieras...</p>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white/40 animate-progress"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {advice ? (
              <div className="bg-black/10 dark:bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="text-base font-bold leading-relaxed whitespace-pre-line text-indigo-50">
                  {advice}
                </p>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm font-bold opacity-60 italic">Necesito al menos 5 transacciones para activar mi motor de análisis.</p>
              </div>
            )}
            
            <button 
              onClick={fetchAdvice}
              disabled={transactions.length < 5}
              className="w-full py-4 bg-white text-indigo-700 font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-30 text-xs"
            >
              {status === 'ERROR' ? 'Reintentar Ahora' : 'Solicitar Nuevo Análisis'}
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
