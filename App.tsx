
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { AIConsultant } from './components/AIConsultant';
import { SettingsModal } from './components/SettingsModal';
import { Transaction, RecurrenceFrequency, Account, TransactionType } from './types';

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc_1', name: '💰 Ahorros', type: 'AHORRO', color: '#6366f1' },
  { id: 'acc_2', name: '💳 Tarjeta', type: 'TARJETA', color: '#f43f5e' },
  { id: 'acc_3', name: '💵 Efectivo', type: 'EFECTIVO', color: '#10b981' }
];

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('ff_dark') === 'true');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ff_dark', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    const savedTx = localStorage.getItem('ff_transactions');
    const savedAcc = localStorage.getItem('ff_accounts');
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedAcc) setAccounts(JSON.parse(savedAcc));
  }, []);

  useEffect(() => {
    localStorage.setItem('ff_transactions', JSON.stringify(transactions));
    localStorage.setItem('ff_accounts', JSON.stringify(accounts));
  }, [transactions, accounts]);

  const handleAddOrEditTransaction = (
    data: Omit<Transaction, 'id'>, 
    recurrenceCount: number = 1, 
    frequency: RecurrenceFrequency = RecurrenceFrequency.NONE
  ) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id ? { ...data, id: editingTransaction.id } : t
      ));
      setEditingTransaction(null);
    } else {
      const newTransactions: Transaction[] = [];
      const recurrenceId = Math.random().toString(36).substr(2, 9);
      
      for (let i = 0; i < recurrenceCount; i++) {
        const date = new Date(data.date);
        if (frequency === RecurrenceFrequency.DAILY) date.setDate(date.getDate() + i);
        else if (frequency === RecurrenceFrequency.WEEKLY) date.setDate(date.getDate() + (i * 7));
        else if (frequency === RecurrenceFrequency.MONTHLY) date.setMonth(date.getMonth() + i);

        newTransactions.push({
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          date: date.toISOString(),
          recurrenceId: recurrenceCount > 1 ? recurrenceId : undefined
        });
      }
      setTransactions(prev => [...newTransactions, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const startEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const filteredTransactions = selectedAccountId 
    ? transactions.filter(t => t.accountId === selectedAccountId)
    : transactions;

  return (
    <Layout>
      <div className="flex justify-end p-2 mb-2">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="space-y-8 pb-32">
        <Dashboard 
          transactions={transactions} 
          accounts={accounts} 
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          isDarkMode={isDarkMode}
        />
        
        <TransactionList 
          transactions={filteredTransactions} 
          onDelete={handleDeleteTransaction}
          onEdit={startEdit}
        />

        <AIConsultant transactions={filteredTransactions} />
      </div>

      {/* Menú Inferior Refinado */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none px-6 max-w-md mx-auto z-40">
        <div className="flex gap-8 pointer-events-auto items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-3 px-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-14 h-14 text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
            className="w-18 h-18 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 active:scale-90 transition-all transform -translate-y-2 border-4 border-white dark:border-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <div className="w-14 h-14 flex items-center justify-center opacity-20">
             {/* Espacio reservado para balance visual si fuera necesario */}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <TransactionForm 
          accounts={accounts}
          initialData={editingTransaction || undefined}
          onAdd={handleAddOrEditTransaction} 
          onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }} 
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
          onExport={() => {}}
          onImport={() => {}}
          transactionCount={transactions.length}
          accountCount={accounts.length}
        />
      )}
    </Layout>
  );
};

export default App;
