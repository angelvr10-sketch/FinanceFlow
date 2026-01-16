
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Transaction, TransactionType, Account } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
  isDarkMode: boolean;
}

type TimeFilter = 'MES' | 'AÑO' | 'TODO';

const COLORS = ['#6366f1', '#f43f5e', '#fbbf24', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  accounts, 
  selectedAccountId, 
  onSelectAccount,
  isDarkMode 
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('MES');

  const baseFilteredTransactions = useMemo(() => {
    let list = transactions;
    if (selectedAccountId) list = list.filter(t => t.accountId === selectedAccountId);
    const now = new Date();
    if (timeFilter === 'TODO') return list;
    const cutoff = new Date();
    if (timeFilter === 'MES') cutoff.setMonth(now.getMonth() - 1);
    else if (timeFilter === 'AÑO') cutoff.setFullYear(now.getFullYear() - 1);
    return list.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, timeFilter, selectedAccountId]);

  // Cálculos de rendimiento comparativo (Mes actual vs Mes pasado)
  const comparison = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterList = selectedAccountId ? transactions.filter(t => t.accountId === selectedAccountId) : transactions;

    const currentNet = filterList
      .filter(t => new Date(t.date) >= currentMonthStart)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);

    const prevNet = filterList
      .filter(t => new Date(t.date) >= prevMonthStart && new Date(t.date) <= prevMonthEnd)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);

    const diff = currentNet - prevNet;
    const percent = prevNet === 0 ? (currentNet > 0 ? 100 : 0) : (diff / Math.abs(prevNet)) * 100;

    return { currentNet, prevNet, percent };
  }, [transactions, selectedAccountId]);

  const periodIncome = useMemo(() => 
    baseFilteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0)
  , [baseFilteredTransactions]);

  const periodExpenses = useMemo(() => 
    baseFilteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0)
  , [baseFilteredTransactions]);

  const totalBalance = useMemo(() => {
    const list = selectedAccountId ? transactions.filter(t => t.accountId === selectedAccountId) : transactions;
    return list.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
  }, [transactions, selectedAccountId]);

  const accountBalances = useMemo(() => {
    return accounts.map(acc => {
      const bal = transactions.filter(t => t.accountId === acc.id).reduce((sum, t) => 
        t.type === TransactionType.INCOME ? sum + t.amount : sum - t.amount, 0
      );
      return { ...acc, balance: bal };
    });
  }, [transactions, accounts]);

  const hierarchicalSummary = useMemo(() => {
    const expenseTransactions = baseFilteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
    const summary: Record<string, { total: number, subCategories: Record<string, number> }> = {};
    expenseTransactions.forEach(t => {
      if (!summary[t.category]) summary[t.category] = { total: 0, subCategories: {} };
      summary[t.category].total += t.amount;
      const sub = t.subCategory || "General";
      summary[t.category].subCategories[sub] = (summary[t.category].subCategories[sub] || 0) + t.amount;
    });
    return Object.entries(summary).map(([name, data]) => ({
      name, value: data.total,
      subs: Object.entries(data.subCategories).map(([sN, sV]) => ({ name: sN, value: sV }))
    })).sort((a, b) => b.value - a.value);
  }, [baseFilteredTransactions]);

  const chartData = useMemo(() => {
    const list = selectedAccountId ? transactions.filter(t => t.accountId === selectedAccountId) : transactions;
    const sorted = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const now = new Date();
    let chartFiltered = sorted;
    if (timeFilter === 'MES') {
      const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
      chartFiltered = sorted.filter(t => new Date(t.date) >= monthAgo);
    } else if (timeFilter === 'AÑO') {
      const yearAgo = new Date(); yearAgo.setFullYear(now.getFullYear() - 1);
      chartFiltered = sorted.filter(t => new Date(t.date) >= yearAgo);
    }
    let runningBalance = list.filter(t => !chartFiltered.includes(t))
                             .reduce((sum, t) => t.type === TransactionType.INCOME ? sum + t.amount : sum - t.amount, 0);
    return chartFiltered.map(t => {
      runningBalance = t.type === TransactionType.INCOME ? runningBalance + t.amount : runningBalance - t.amount;
      return {
        date: new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
        balance: runningBalance
      };
    });
  }, [transactions, timeFilter, selectedAccountId]);

  return (
    <div className="space-y-8">
      {/* Cuentas Interactivas - Fuentes más grandes */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
        {accountBalances.map(acc => {
          const isSelected = selectedAccountId === acc.id;
          return (
            <button 
              key={acc.id} 
              onClick={() => onSelectAccount(isSelected ? null : acc.id)}
              className={`min-w-[170px] bg-white dark:bg-slate-900 p-5 rounded-3xl border transition-all shrink-0 text-left ${
                isSelected 
                  ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-500/10 scale-105' 
                  : 'border-slate-100 dark:border-slate-800 opacity-80'
              }`}
            >
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-wider">{acc.name}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">${acc.balance.toLocaleString()}</p>
              <div className="h-1.5 w-12 mt-4 rounded-full" style={{ backgroundColor: acc.color }}></div>
            </button>
          );
        })}
      </div>

      {/* Saldo y Gráfica con Fuentes Mejoradas */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
              {selectedAccountId ? 'Saldo de Cuenta' : 'Saldo Total Consolidado'}
            </p>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">${totalBalance.toLocaleString()}</h2>
            <div className="flex items-center gap-3 mt-4">
               <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-xl">↑ ${periodIncome.toLocaleString()}</span>
               <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-xl">↓ ${periodExpenses.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            {(['MES', 'AÑO', 'TODO'] as TimeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${timeFilter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="h-56 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fontWeight: 700, fill: isDarkMode ? '#475569' : '#94a3b8'}} 
                dy={15}
                interval="preserveStartEnd"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', background: isDarkMode ? '#1e293b' : '#fff', fontSize: '14px', fontWeight: 900 }}
                formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#6366f1" 
                strokeWidth={5}
                fillOpacity={1} 
                fill="url(#colorBal)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Comparativa Mensual - NUEVA SECCIÓN */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Rendimiento vs Mes Anterior</p>
            <div className="flex items-center gap-2">
              <span className={`text-base font-black ${comparison.percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {comparison.percent >= 0 ? '↗' : '↘'} {Math.abs(comparison.percent).toFixed(1)}%
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                ({comparison.currentNet >= 0 ? '+' : ''}{comparison.currentNet.toLocaleString()} netos)
              </span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase">Análisis de ahorro</p>
          </div>
        </div>
      </div>

      {/* Distribución de Gastos - Fuentes más grandes */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-8 uppercase tracking-widest text-center">Desglose de Gastos</h3>
        {hierarchicalSummary.length > 0 ? (
          <div className="space-y-8">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hierarchicalSummary}
                    cx="50%" cy="50%" innerRadius={65} outerRadius={90}
                    paddingAngle={10} dataKey="value"
                  >
                    {hierarchicalSummary.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', background: isDarkMode ? '#1e293b' : '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-6">
              {hierarchicalSummary.map((cat, index) => {
                 const percentage = ((cat.value / periodExpenses) * 100).toFixed(1);
                 return (
                   <div key={cat.name} className="space-y-4">
                     <div className="flex justify-between items-center">
                       <div className="flex items-center gap-4">
                         <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                         <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{cat.name}</span>
                       </div>
                       <div className="text-right">
                         <p className="text-base font-black text-slate-900 dark:text-white">${cat.value.toLocaleString()}</p>
                         <p className="text-xs text-slate-400 font-bold">{percentage}%</p>
                       </div>
                     </div>
                     <div className="ml-8 border-l-4 border-slate-100 dark:border-slate-800 pl-6 space-y-3">
                       {cat.subs.map(sub => (
                         <div key={sub.name} className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400 italic">
                           <span>{sub.name}</span>
                           <span>${sub.value.toLocaleString()}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>
        ) : (
          <p className="text-center py-16 text-sm text-slate-400 font-bold">Sin gastos registrados en este periodo</p>
        )}
      </div>
    </div>
  );
};
