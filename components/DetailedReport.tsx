
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
    const uniqueYears = Array.from(new Set<number>(transactions.map(t => new Date(t.date).getFullYear())));
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

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert("No hay datos para exportar en este periodo.");
      return;
    }

    const headers = ["Fecha", "Descripcion", "Categoria", "Subcategoria", "Tipo", "Monto"];
    const rows = filteredData.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description.replace(/,/g, ''),
      t.category,
      t.subCategory || '',
      t.type,
      t.amount
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const periodName = periodType === 'MES' ? `${MONTHS[selectedMonth]}_${selectedYear}` : `${selectedYear}`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_financeflow_${periodName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

        <div className="flex gap-4 items-center">
          {periodType === 'MES' && (
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-grow p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none appearance-none"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="flex-grow p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none appearance-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button 
            onClick={exportToCSV}
            title="Exportar a CSV"
            className="p-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 flex items-center justify-center shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
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

      {/* Listado de Categorías (Tipo Lista) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-6 mb-4">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Desglose</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {filteredData.length} Operaciones
          </span>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          {stats.categories.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {stats.categories.map(([catName, data]) => {
                const percentage = data.type === TransactionType.EXPENSE 
                  ? (data.total / (stats.totalExpenses || 1)) * 100 
                  : (data.total / (stats.totalIncomes || 1)) * 100;

                return (
                  <div key={catName} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${data.type === TransactionType.EXPENSE ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">{catName}</h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {percentage.toFixed(1)}% del total
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${data.type === TransactionType.EXPENSE ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {data.type === TransactionType.EXPENSE ? '-' : '+'}${data.total.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progreso minimalista */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                      <div 
                        className={`h-full rounded-full ${data.type === TransactionType.EXPENSE ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    {/* Subcategorías compactas */}
                    <div className="space-y-2 ml-7">
                      {(Object.entries(data.sub) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([subName, subTotal]) => (
                        <div key={subName} className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                            #{subName}
                          </span>
                          <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                            ${subTotal.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 opacity-30 italic font-black text-slate-400">
              No hay datos para este periodo
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
