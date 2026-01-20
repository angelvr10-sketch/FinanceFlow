
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
    return uniqueYears.length > 0 ? uniqueYears.sort((a, b) => b - a) : [new Date().getFullYear()];
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
    const incomeTx = filteredData.filter(t => t.type === TransactionType.INCOME);
    const expenseTx = filteredData.filter(t => t.type === TransactionType.EXPENSE);

    const totalIncomes = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTx.reduce((sum, t) => sum + t.amount, 0);

    const buildHierarchy = (txs: Transaction[]) => {
      const hierarchy: Record<string, { total: number, subcategories: Record<string, number> }> = {};
      txs.forEach(t => {
        if (!hierarchy[t.category]) {
          hierarchy[t.category] = { total: 0, subcategories: {} };
        }
        hierarchy[t.category].total += t.amount;
        const sub = t.subCategory || "General";
        hierarchy[t.category].subcategories[sub] = (hierarchy[t.category].subcategories[sub] || 0) + t.amount;
      });
      return Object.entries(hierarchy).sort((a, b) => b[1].total - a[1].total);
    };

    return {
      incomeCount: incomeTx.length,
      expenseCount: expenseTx.length,
      totalIncomes,
      totalExpenses,
      avgIncome: incomeTx.length > 0 ? totalIncomes / incomeTx.length : 0,
      avgExpense: expenseTx.length > 0 ? totalExpenses / expenseTx.length : 0,
      cashFlow: totalIncomes - totalExpenses,
      incomeHierarchy: buildHierarchy(incomeTx),
      expenseHierarchy: buildHierarchy(expenseTx)
    };
  }, [filteredData]);

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert("No hay datos para exportar en este periodo.");
      return;
    }

    const headers = ["Fecha", "Cuenta", "Descripcion", "Categoria", "Subcategoria", "Tipo", "Monto"];
    const rows = filteredData.map(t => {
      const accountName = accounts.find(a => a.id === t.accountId)?.name || 'Cuenta Desconocida';
      return [
        new Date(t.date).toLocaleDateString(),
        `"${accountName}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.subCategory || 'General'}"`,
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
    const periodName = periodType === 'MES' ? `${MONTHS[selectedMonth]}_${selectedYear}` : `${selectedYear}`;
    const accountLabel = selectedAccountId === 'all' ? 'Todas_Cuentas' : accounts.find(a => a.id === selectedAccountId)?.name || 'Cuenta';
    
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${accountLabel}_${periodName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500 pb-32">
      {/* Selector de Periodo y Filtros */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
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
          <select 
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-indigo-600 dark:text-indigo-400 outline-none appearance-none text-xs"
          >
            <option value="all">TODAS LAS CUENTAS</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name.toUpperCase()}</option>)}
          </select>

          {periodType === 'MES' && (
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none appearance-none text-xs"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}

          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-slate-700 dark:text-slate-200 outline-none appearance-none text-xs"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <button 
          onClick={exportToCSV}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar Lista CSV
        </button>
      </div>

      {/* TABLA DE FLUJO DE CAJA */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Resumen de Flujo de Caja</h3>
        </div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <tr className="bg-white dark:bg-slate-900">
              <td className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-tighter">Métrica</td>
              <td className="p-5 text-[10px] font-black uppercase text-emerald-500 text-center tracking-tighter">Ingresos</td>
              <td className="p-5 text-[10px] font-black uppercase text-rose-500 text-right tracking-tighter">Gastos</td>
            </tr>
            <tr>
              <td className="p-5 text-xs font-bold text-slate-500">Operaciones</td>
              <td className="p-5 text-sm font-black text-slate-900 dark:text-white text-center">{stats.incomeCount}</td>
              <td className="p-5 text-sm font-black text-slate-900 dark:text-white text-right">{stats.expenseCount}</td>
            </tr>
            <tr>
              <td className="p-5 text-xs font-bold text-slate-500">Promedio / Ticket</td>
              <td className="p-5 text-sm font-black text-emerald-600 dark:text-emerald-400 text-center">${stats.avgIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td className="p-5 text-sm font-black text-rose-600 dark:text-rose-400 text-right">${stats.avgExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>
            <tr>
              <td className="p-5 text-xs font-bold text-slate-500">Totales</td>
              <td className="p-5 text-base font-black text-emerald-600 dark:text-emerald-400 text-center">${stats.totalIncomes.toLocaleString()}</td>
              <td className="p-5 text-base font-black text-rose-600 dark:text-rose-400 text-right">${stats.totalExpenses.toLocaleString()}</td>
            </tr>
            <tr className={stats.cashFlow >= 0 ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
              <td className="p-6 text-xs font-black uppercase text-slate-600 dark:text-slate-400">Flujo de Caja Neto</td>
              <td colSpan={2} className={`p-6 text-2xl font-black text-right tracking-tighter ${stats.cashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.cashFlow >= 0 ? '+' : '-'}${Math.abs(stats.cashFlow).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* DESGLOSE POR CATEGORÍAS Y SUBCATEGORÍAS */}
      <div className="space-y-8">
        {/* SECCIÓN INGRESOS */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.4em] px-6">Detalle de Ingresos</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            {stats.incomeHierarchy.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {stats.incomeHierarchy.map(([cat, data]) => (
                  <div key={cat} className="p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{cat}</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">${data.total.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-4 border-l-2 border-emerald-100 dark:border-emerald-900/30">
                      {Object.entries(data.subcategories).map(([sub, amount]) => (
                        <div key={sub} className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{sub}</p>
                          <p className="text-[10px] font-black text-slate-500">${amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center italic text-slate-400 font-black uppercase text-[10px]">Sin ingresos en este periodo</div>
            )}
          </div>
        </div>

        {/* SECCIÓN GASTOS */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.4em] px-6">Detalle de Gastos</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            {stats.expenseHierarchy.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {stats.expenseHierarchy.map(([cat, data]) => (
                  <div key={cat} className="p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{cat}</p>
                      <p className="text-base font-black text-rose-600 dark:text-rose-400">${data.total.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-4 border-l-2 border-rose-100 dark:border-rose-900/30">
                      {Object.entries(data.subcategories).map(([sub, amount]) => (
                        <div key={sub} className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{sub}</p>
                          <p className="text-[10px] font-black text-slate-500">${amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center italic text-slate-400 font-black uppercase text-[10px]">Sin gastos en este periodo</div>
            )}
          </div>
        </div>
      </div>

      {/* Listado de Movimientos (Final) */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-6">Lista de Transacciones</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Concepto</th>
                  <th className="p-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredData.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-5 text-xs font-bold text-slate-400">
                      {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1 break-all" title={t.description}>{t.description}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{t.category} {t.subCategory && `• ${t.subCategory}`}</p>
                    </td>
                    <td className={`p-5 text-base font-black text-right tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-20 text-center italic text-slate-400 font-black uppercase tracking-widest text-xs">Sin movimientos registrados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
