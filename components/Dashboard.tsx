
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
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

  // Cálculos de Comparativa Mensual
  const performanceComparison = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const relevantTransactions = selectedAccountId 
      ? transactions.filter(t => t.accountId === selectedAccountId)
      : transactions;

    const currentNet = relevantTransactions
      .filter(t => new Date(t.date) >= currentMonthStart)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);

    const prevNet = relevantTransactions
      .filter(t => new Date(t.date) >= prevMonthStart && new Date(t.date) <= prevMonthEnd)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);

    const diff = currentNet - prevNet;
    const percentage = prevNet === 0 ? (currentNet > 0 ? 100 : 0) : (diff / Math.abs(prevNet)) * 100;

    return { currentNet, diff, percentage };
  }, [transactions, selectedAccountId]);

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

  const chartData = useMemo(() => {
    const list = selectedAccountId ? transactions.filter(t => t.accountId === selectedAccountId) : transactions;
    const sorted = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const now = new Date();
    let chartFiltered = sorted;
    if (timeFilter === 'MES') {
      const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
      chartFiltered = sorted.filter(t => new Date(t.date) >= monthAgo);
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

  const expenseSummary = useMemo(() => {
    const expenses = baseFilteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
    const totals: Record<string, number> = {};
    expenses.forEach(t => totals[t.category] = (totals[t.category] || 0) + t.amount);
    return Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [baseFilteredTransactions]);

  const totalPeriodExpenses = useMemo(() => expenseSummary.reduce((sum, item) => sum + item.value, 0), [expenseSummary]);

  return (
    <div className="space-y-10">
      {/* Cuentas Interactivas - Fuentes Grandes */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-1">
        {accountBalances.map(acc => {
          const isSelected = selectedAccountId === acc.id;
          return (
            <button 
              key={acc.id} 
              onClick={() => onSelectAccount(isSelected ? null : acc.id)}
              className={`min-w-[190px] bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all shrink-0 text-left ${
                isSelected 
                  ? 'border-indigo-500 shadow-2xl ring-4 ring-indigo-500/10 scale-105' 
                  : 'border-slate-100 dark:border-slate-800 opacity-80'
              }`}
            >
              <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase mb-3 tracking-widest">{acc.name}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${acc.balance.toLocaleString()}</p>
              <div className="h-2 w-16 mt-6 rounded-full" style={{ backgroundColor: acc.color }}></div>
            </button>
          );
        })}
      </div>

      {/* Tarjeta de Saldo y Gráfica */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
          <div>
            <p className="text-base font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              {selectedAccountId ? 'Saldo de Cuenta' : 'Capital Disponible'}
            </p>
            <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter transition-all">
              ${totalBalance.toLocaleString()}
            </h2>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
            {(['MES', 'AÑO', 'TODO'] as TimeFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-6 py-3 text-sm font-black rounded-xl transition-all ${timeFilter === f ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full mb-10">
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
                tick={{fontSize: 12, fontWeight: 800, fill: isDarkMode ? '#475569' : '#94a3b8'}} 
                dy={20}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', background: isDarkMode ? '#1e293b' : '#fff', fontSize: '16px', fontWeight: 900, padding: '15px' }}
                formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#6366f1" 
                strokeWidth={6}
                fillOpacity={1} 
                fill="url(#colorBal)" 
                animationDuration={2500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* COMPARATIVA MENSUAL - NUEVA SECCIÓN */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Balance vs Mes Anterior</p>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-sm ${performanceComparison.percentage >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20'}`}>
                  {performanceComparison.percentage >= 0 ? '↑' : '↓'} {Math.abs(performanceComparison.percentage).toFixed(1)}%
                </div>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  {performanceComparison.diff >= 0 ? 'Más ahorro' : 'Menos ahorro'}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xl font-black text-slate-900 dark:text-white">${performanceComparison.currentNet.toLocaleString()}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Resultado Neto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de Gastos */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-10 uppercase tracking-widest text-center">Gasto por Categoría</h3>
        {expenseSummary.length > 0 ? (
          <div className="space-y-10">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseSummary}
                    cx="50%" cy="50%" innerRadius={75} outerRadius={105}
                    paddingAngle={12} dataKey="value"
                  >
                    {expenseSummary.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', background: isDarkMode ? '#1e293b' : '#fff', fontWeight: 900 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {expenseSummary.map((cat, index) => (
                <div key={cat.name} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl">
                  <div className="flex items-center gap-5">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 dark:text-white">${cat.value.toLocaleString()}</p>
                    <p className="text-sm text-slate-400 font-bold">{((cat.value / totalPeriodExpenses) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center py-20 text-lg text-slate-400 font-black italic">Sin gastos registrados</p>
        )}
      </div>
    </div>
  );
};
