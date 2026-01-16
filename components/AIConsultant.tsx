
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
    if (transactions.length > 0 && transactions.length % 3 === 0) {
      fetchAdvice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21V12" />
        </svg>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="bg-indigo-600 text-white p-1 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-indigo-900">Asistente de Finanzas AI</h4>
      </div>

      {loading ? (
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
          <p className="text-xs text-indigo-600 italic">Analizando tus movimientos recientes...</p>
        </div>
      ) : (
        <div className="text-xs leading-relaxed text-indigo-800 space-y-2">
          {advice ? (
            <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br/>') }}></div>
          ) : (
            <p>Agrega más transacciones para recibir consejos personalizados de ahorro.</p>
          )}
          <button 
            onClick={fetchAdvice}
            className="mt-2 text-indigo-600 font-bold hover:underline"
          >
            Actualizar consejos
          </button>
        </div>
      )}
    </div>
  );
};
