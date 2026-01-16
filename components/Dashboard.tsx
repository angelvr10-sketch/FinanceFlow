
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, TransactionType } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const income = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expenses;

  const categoryTotals: Record<string, number> = {};
  transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Fecha', 'Descripcion', 'Categoria', 'Tipo', 'Monto'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type === TransactionType.INCOME ? 'Ingreso' : 'Gasto',
      t.amount.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finanzas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cards Summary */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">Saldo Total</p>
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-bold mt-1">${balance.toLocaleString()}</h2>
            <button 
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar a CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Ingresos</p>
            <p className="text-lg font-bold text-emerald-700">+${income.toLocaleString()}</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <p className="text-[10px] font-bold text-rose-600 uppercase">Gastos</p>
            <p className="text-lg font-bold text-rose-700">-${expenses.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {pieData.length > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Gastos por Categoría</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
             {pieData.map((entry, index) => (
               <div key={entry.name} className="flex items-center gap-1">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                 <span className="text-[10px] text-slate-500">{entry.name}</span>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
