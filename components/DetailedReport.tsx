
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Account } from '../types';

interface DetailedReportProps {
  transactions: Transaction[];
  accounts: Account[];
  isDarkMode: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DetailedReport: React.FC<DetailedReportProps> = ({ transactions, accounts, isDarkMode }) => {
  const [periodType, setPeriodType] = useState<'MES' | 'AÑO'>('MES');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set<number>(transactions.map(t => new Date(t.date).getFullYear())));
    return uniqueYears.length > 0 ? uniqueYears.sort((a: number, b: number) => b - a) : [new Date().getFullYear()];
  }, [transactions]);

  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const matchesPeriod = periodType === 'AÑO' 
        ? d.getFullYear() === selectedYear
        : (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth);
      
      const matchesAccount = selectedAccountId === 'all' || t.accountId === selectedAccountId;
      
      return matchesPeriod && matchesAccount;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, periodType, selectedMonth, selectedYear, selectedAccountId]);

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

    const headers = ["Fecha", "Cuenta", "Descripcion", "Categoria", "Subcategoria", "Tipo", "Monto"];
    const rows = filteredData.map(t => {
      const accountName = accounts.find(a => a.id === t.accountId)?.name || 'Desconocida';
      return [
        new Date(t.date).toLocaleDateString(),
        `"${accountName}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.subCategory || ''}"`,
        t.type,
        t.amount
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const accountLabel = selectedAccountId === 'all' ? 'Todas_Cuentas' : (accounts.find(a => a.id === selectedAccountId)?.name || 'Cuenta');
    const periodName = periodType === 'MES' ? `${MONTHS[selectedMonth]}_${selectedYear}` : `${selectedYear}`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${accountLabel}_${periodName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500 pb-20">
      {/* Filtros Inteligentes */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
          <button
            onClick={() => setPeriodType('MES')}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all tracking-widest ${periodType === 'MES' ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
          >
            MENSUAL
          </button>
          <button
            onClick={() => setPeriodType('AÑO')}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all tracking-widest ${periodType === 'AÑO' ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
          >
            ANUAL
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 flex gap-4">
             {periodType === 'MES' && (
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none appearance-none text-xs"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            )}
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none appearance-none text-xs"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <select 
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-indigo-600 dark:text-indigo-400 outline-none appearance-none text-xs"
          >
            <option value="all">TODAS LAS CUENTAS</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name.toUpperCase()}</option>)}
          </select>
        </div>

        <button 
          onClick={exportToCSV}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar Reporte CSV
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/20">
          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Ingresos</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tighter">${stats.totalIncomes.toLocaleString()}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-[2.5rem] border border-rose-100 dark:border-rose-500/20">
          <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Gastos</p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 tracking-tighter">${stats.totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Desglose por Categoría */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-6">Análisis por Categoría</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-50 dark:divide-slate-800/50">
          {stats.categories.map(([catName, data]) => {
            const percentage = data.type === TransactionType.EXPENSE 
              ? (data.total / (stats.totalExpenses || 1)) * 100 
              : (data.total / (stats.totalIncomes || 1)) * 100;

            return (
              <div key={catName} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">{catName}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{percentage.toFixed(1)}% del total</p>
                  </div>
                  <p className={`font-black text-lg tracking-tighter ${data.type === TransactionType.EXPENSE ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ${data.total.toLocaleString()}
                  </p>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className={`h-full rounded-full ${data.type === TransactionType.EXPENSE ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listado Detallado de Transacciones */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-6">Listado Detallado</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="p-5 font-black uppercase text-slate-400 tracking-widest">Fecha</th>
                  <th className="p-5 font-black uppercase text-slate-400 tracking-widest">Concepto</th>
                  <th className="p-5 font-black uppercase text-slate-400 tracking-widest text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-5 font-bold text-slate-400 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
                    </td>
                    <td className="p-5">
                      <p className="font-black text-slate-800 dark:text-white line-clamp-1 break-all" title={t.description}>{t.description}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</p>
                    </td>
                    <td className={`p-5 font-black text-right text-sm tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-20 text-center italic text-slate-400 font-black uppercase tracking-widest">No hay movimientos</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
