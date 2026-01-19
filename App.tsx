
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { AIConsultant } from './components/AIConsultant';
import { SettingsModal } from './components/SettingsModal';
import { DetailedReport } from './components/DetailedReport';
import { Auth } from './components/Auth';
import { Transaction, Account, TransactionType, TransactionTemplate } from './types';
import { supabase } from './services/supabase';

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc_3', name: '💵 Efectivo', type: 'EFECTIVO', color: '#10b981' },
  { id: 'acc_1', name: '💰 Ahorros', type: 'AHORRO', color: '#6366f1' },
  { id: 'acc_2', name: '💳 Tarjeta', type: 'TARJETA', color: '#f43f5e' }
];

type View = 'dashboard' | 'reports';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('ff_dark') === 'true');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Escuchar cambios de sesión
  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sortAccounts = (accs: Account[]) => {
    return [...accs].sort((a, b) => {
      if (a.type === 'EFECTIVO') return -1;
      if (b.type === 'EFECTIVO') return 1;
      return 0;
    });
  };

  const mapToDB = (t: any) => ({
    id: t.id,
    user_id: session?.user?.id,
    account_id: t.accountId,
    amount: t.amount,
    description: t.description,
    category: t.category,
    sub_category: t.subCategory || null,
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
    if (!supabase || !session) return;
    setIsSyncing(true);
    try {
      const { data: accData } = await supabase.from('accounts').select('*').eq('user_id', session.user.id);
      if (accData && accData.length > 0) {
        setAccounts(sortAccounts(accData));
      }

      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', session.user.id);
      if (txData) setTransactions(txData.map(mapFromDB));

      const { data: templData } = await supabase.from('templates').select('*').eq('user_id', session.user.id);
      if (templData) {
        setTemplates(templData.map(t => ({
          id: t.id,
          name: t.name,
          accountId: t.account_id,
          amount: parseFloat(t.amount),
          description: t.description,
          category: t.category,
          type: t.type as TransactionType,
          icon: t.icon
        })));
      }
    } catch (err) {
      console.warn("Error sync:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [session]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('ff_dark', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    if (!session) {
      const savedTx = localStorage.getItem('ff_transactions');
      const savedAcc = localStorage.getItem('ff_accounts');
      const savedTempl = localStorage.getItem('ff_templates');
      if (savedTx) setTransactions(JSON.parse(savedTx));
      if (savedAcc) setAccounts(sortAccounts(JSON.parse(savedAcc)));
      if (savedTempl) setTemplates(JSON.parse(savedTempl));
    } else {
      fetchCloudData();
    }
  }, [session, fetchCloudData]);

  useEffect(() => {
    if (!session) {
      localStorage.setItem('ff_transactions', JSON.stringify(transactions));
      localStorage.setItem('ff_accounts', JSON.stringify(accounts));
      localStorage.setItem('ff_templates', JSON.stringify(templates));
    }
  }, [transactions, accounts, templates, session]);

  const handleExport = () => {
    const data = { accounts, transactions, templates };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeflow_backup.json`;
    a.click();
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.accounts) setAccounts(sortAccounts(data.accounts));
        if (data.transactions) setTransactions(data.transactions);
        if (data.templates) setTemplates(data.templates);
        setIsSettingsOpen(false);
        alert("¡Datos restaurados con éxito!");
      } catch (err) {
        alert("Error al procesar el archivo.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddOrEditTransaction = async (data: Omit<Transaction, 'id'>) => {
    const id = editingTransaction ? editingTransaction.id : Math.random().toString(36).substr(2, 9);
    const newTx: Transaction = { ...data, id };
    if (editingTransaction) setTransactions(prev => prev.map(t => t.id === id ? newTx : t));
    else setTransactions(prev => [newTx, ...prev]);

    if (supabase && session) {
      await supabase.from('transactions').upsert(mapToDB(newTx));
    }
    setIsFormOpen(false);
  };

  const handleAddTemplate = async (templ: TransactionTemplate) => {
    setTemplates(prev => [...prev, templ]);
    if (supabase && session) {
      await supabase.from('templates').upsert({
        id: templ.id,
        user_id: session.user.id,
        name: templ.name,
        account_id: templ.accountId,
        amount: templ.amount,
        description: templ.description,
        category: templ.category,
        type: templ.type,
        icon: templ.icon
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (supabase && session) await supabase.from('templates').delete().eq('id', id);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (supabase && session) await supabase.from('transactions').delete().eq('id', id);
  };

  const startEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleAddAccount = async (acc: Account) => {
    const newAccounts = sortAccounts([...accounts, acc]);
    setAccounts(newAccounts);
    if (supabase && session) await supabase.from('accounts').upsert({ ...acc, user_id: session.user.id });
  };
  const handleUpdateAccount = async (acc: Account) => {
    const newAccounts = sortAccounts(accounts.map(a => a.id === acc.id ? acc : a));
    setAccounts(newAccounts);
    if (supabase && session) await supabase.from('accounts').update(acc).eq('id', acc.id);
  };
  const handleDeleteAccount = async (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (supabase && session) await supabase.from('accounts').delete().eq('id', id);
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setTransactions([]);
      setAccounts(INITIAL_ACCOUNTS);
      setTemplates([]);
      setIsSettingsOpen(false);
    }
  };

  if (!session) {
    return <Auth onSuccess={fetchCloudData} />;
  }

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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.364 6.364l-.707-.707m12.728 0l-.707.707M6.364 17.636l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="space-y-10 pb-40">
        {currentView === 'dashboard' ? (
          <>
            <Dashboard transactions={transactions} accounts={accounts} selectedAccountId={selectedAccountId} onSelectAccount={setSelectedAccountId} isDarkMode={isDarkMode} />
            <TransactionList transactions={selectedAccountId ? transactions.filter(t => t.accountId === selectedAccountId) : transactions} onDelete={handleDeleteTransaction} onEdit={startEdit} />
            <AIConsultant transactions={transactions} />
          </>
        ) : (
          <DetailedReport transactions={transactions} accounts={accounts} isDarkMode={isDarkMode} />
        )}
      </div>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none px-4 max-w-md mx-auto z-40">
        <div className="flex gap-4 pointer-events-auto items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl p-4 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all w-full justify-between px-8">
          <button onClick={() => setCurrentView('dashboard')} className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }} className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl transform -translate-y-6 border-[6px] border-white dark:border-slate-900 active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button onClick={() => setCurrentView('reports')} className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${currentView === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-14 h-14 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <TransactionForm 
          accounts={accounts}
          templates={templates}
          initialData={editingTransaction || undefined}
          onAdd={handleAddOrEditTransaction} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
          onExport={handleExport} 
          onImport={handleImport} 
          transactionCount={transactions.length}
          accountCount={accounts.length}
          allData={{ transactions, accounts, templates }}
          accounts={accounts}
          templates={templates}
          onAddAccount={handleAddAccount}
          onUpdateAccount={handleUpdateAccount}
          onDeleteAccount={handleDeleteAccount}
          onAddTemplate={handleAddTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onSignOut={handleSignOut}
          userEmail={session?.user?.email}
        />
      )}
    </Layout>
  );
};

export default App;
