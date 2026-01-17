
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { AIConsultant } from './components/AIConsultant';
import { SettingsModal } from './components/SettingsModal';
import { Transaction, Account, TransactionType } from './types';
import { supabase } from './services/supabase';

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
  const [isSyncing, setIsSyncing] = useState(false);

  // Mapeo de camelCase a snake_case para Supabase
  const mapToDB = (t: any) => ({
    id: t.id,
    account_id: t.accountId,
    amount: t.amount,
    description: t.description,
    category: t.category,
    sub_category: t.subCategory,
    type: t.type,
    date: t.date,
    icon: t.icon
  });

  const mapFromDB = (t: any): Transaction => ({
    id: t.id,
    accountId: t.account_id,
    amount: parseFloat(t.amount),
    description: t.description,
    category: t.category,
    subCategory: t.sub_category,
    type: t.type as TransactionType,
    date: t.date,
    icon: t.icon
  });

  const fetchCloudData = useCallback(async () => {
    if (!supabase) return;
    setIsSyncing(true);
    try {
      // 1. Cargar Cuentas
      const { data: accData, error: accErr } = await supabase.from('accounts').select('*');
      if (accErr) throw accErr;
      if (accData && accData.length > 0) {
        setAccounts(accData.map(a => ({ ...a, id: a.id })));
      } else {
        // Si no hay cuentas en la nube, subir las iniciales
        await supabase.from('accounts').upsert(INITIAL_ACCOUNTS);
      }

      // 2. Cargar Transacciones
      const { data: txData, error: txErr } = await supabase.from('transactions').select('*');
      if (txErr) throw txErr;
      if (txData) {
        setTransactions(txData.map(mapFromDB));
      }
    } catch (err) {
      console.error("Error sincronizando con la nube:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ff_dark', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    // Cargar primero de localStorage por velocidad
    const savedTx = localStorage.getItem('ff_transactions');
    const savedAcc = localStorage.getItem('ff_accounts');
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedAcc) setAccounts(JSON.parse(savedAcc));

    // Luego intentar sincronizar con Supabase
    fetchCloudData();
  }, [fetchCloudData]);

  // Guardar en LocalStorage cada vez que cambie algo (como redundancia)
  useEffect(() => {
    localStorage.setItem('ff_transactions', JSON.stringify(transactions));
    localStorage.setItem('ff_accounts', JSON.stringify(accounts));
  }, [transactions, accounts]);

  const handleAddOrEditTransaction = async (data: Omit<Transaction, 'id'>) => {
    const id = editingTransaction ? editingTransaction.id : Math.random().toString(36).substr(2, 9);
    const newTx: Transaction = { ...data, id };

    // Actualizar estado local inmediatamente
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === id ? newTx : t));
      setEditingTransaction(null);
    } else {
      setTransactions(prev => [newTx, ...prev]);
    }

    // Sincronizar con Supabase
    if (supabase) {
      try {
        const { error } = await supabase.from('transactions').upsert(mapToDB(newTx));
        if (error) throw error;
      } catch (err) {
        console.error("Error al guardar en la nube:", err);
        alert("Error al sincronizar con la base de datos. Se guardó localmente.");
      }
    }
    setIsFormOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('¿Eliminar transacción?')) return;

    // Actualizar local
    setTransactions(prev => prev.filter(t => t.id !== id));

    // Eliminar en la nube
    if (supabase) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Error al eliminar en la nube:", err);
      }
    }
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
      <div className="flex justify-between items-center p-2 mb-4">
        <div className="flex items-center gap-2">
          {isSyncing && (
             <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Sincronizando...</span>
             </div>
          )}
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 transition-all shadow-sm active:scale-95"
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="space-y-10 pb-40">
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

      <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none px-8 max-w-md mx-auto z-40">
        <div className="flex gap-12 pointer-events-auto items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-4 px-12 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-16 h-16 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
            className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/50 active:scale-90 transition-all transform -translate-y-4 border-[6px] border-white dark:border-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <div className="w-16 h-16 opacity-0"></div>
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
          onExport={() => {}} // Se puede añadir lógica de exportar aquí
          onImport={() => {}} // Se puede añadir lógica de importar aquí
          transactionCount={transactions.length}
          accountCount={accounts.length}
          allData={{ transactions, accounts, config: { isDarkMode, selectedAccountId } }}
        />
      )}
    </Layout>
  );
};

export default App;
