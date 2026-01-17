
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';

interface DetailedReportProps {
  transactions: Transaction[];
  isDarkMode: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DetailedReport: React.FC<DetailedReportProps> = ({ transactions, isDarkMode }) => {
  const [periodType, setPeriodType] = useState<'MES' | 'AÑO'>('MES');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = useMemo(() => {
    // Explicitly typed Set to fix inference of numbers and sort callback parameters
    const uniqueYears = Array.from(new Set<number>(transactions.map(t => new Date(t.date).getFullYear())));
    // Added explicit types to sort callback parameters to resolve arithmetic errors on line 22
    return uniqueYears.length > 0 ? uniqueYears.sort((a: number, b: number) => b - a) : [new Date().getFullYear()];
  }, [transactions]);

  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (periodType === 'AÑO') return d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [transactions, periodType, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const report: Record<string, { total: number, sub: Record<string, number>, type: TransactionType }> = {};
    let totalExpenses = 0;
    let totalIncomes = 0;

    filteredData.forEach(t => {
      if (!report[t.category]) {
        report[t.category] = { total: 0, sub: {}, type: t.type };
      }
      report[t.category].total += t.amount;
      const subName = t.subCategory || 'Sin especificar';
      report[t.category].sub[subName] = (report[t.category].sub[subName] || 0) + t.amount;
      
      if (t.type === TransactionType.EXPENSE) totalExpenses += t.amount;
      else totalIncomes += t.amount;
    });

    return { 
      categories: Object.entries(report).sort((a, b) => b[1].total - a[1].total),
      totalExpenses,
      totalIncomes
    };
  }, [filteredData]);

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500">
      {/* Filtros de Periodo */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl mb-8">
          <button
            onClick={() => setPeriodType('MES')}
            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${periodType === 'MES' ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
          >
            VISTA MENSUAL
          </button>
          <button
            onClick={() => setPeriodType('AÑO')}
            className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${periodType === 'AÑO' ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
          >
            VISTA ANUAL
          </button>
        </div>

        <div className="flex gap-4">
          {periodType === 'MES' && (
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="flex-1 p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/20">
          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Ingresos</p>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 tracking-tighter">${stats.totalIncomes.toLocaleString()}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-500/20">
          <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">Gastos</p>
          <p className="text-3xl font-black text-rose-700 dark:text-rose-300 tracking-tighter">${stats.totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Listado Detallado */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-4">Desglose por Categoría</h3>
        
        {stats.categories.length > 0 ? stats.categories.map(([catName, data]) => {
          const percentage = data.type === TransactionType.EXPENSE 
            ? (data.total / (stats.totalExpenses || 1)) * 100 
            : (data.total / (stats.totalIncomes || 1)) * 100;

          return (
            <div key={catName} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{catName}</h4>
                  <p className={`text-xs font-bold uppercase ${data.type === TransactionType.EXPENSE ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {data.type === TransactionType.EXPENSE ? 'Gasto' : 'Ingreso'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">${data.total.toLocaleString()}</p>
                  <p className="text-xs font-black text-slate-400 uppercase">{percentage.toFixed(1)}% del total</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${data.type === TransactionType.EXPENSE ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Subcategorías */}
              <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                {/* Fixed subtraction error on line 142 by adding explicit type cast and parameter types for sort operation */}
                {(Object.entries(data.sub) as [string, number][]).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([subName, subTotal]) => (
                  <div key={subName} className="flex justify-between items-center group">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors italic">
                      # {subName}
                    </span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                      ${subTotal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-20 opacity-30 italic font-black text-slate-400">
            No hay datos para este periodo
          </div>
        )}
      </div>
    </div>
  );
};
