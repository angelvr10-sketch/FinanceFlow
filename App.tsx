
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { AIConsultant } from './components/AIConsultant';
import { InfoModal } from './components/InfoModal';
import { Transaction, RecurrenceFrequency } from './types';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('finance_flow_transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('finance_flow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAddTransaction = (
    data: Omit<Transaction, 'id'>, 
    recurrenceCount: number = 1, 
    frequency: RecurrenceFrequency = RecurrenceFrequency.NONE
  ) => {
    const newTransactions: Transaction[] = [];
    const recurrenceId = Math.random().toString(36).substr(2, 9);
    
    for (let i = 0; i < recurrenceCount; i++) {
      const date = new Date(data.date);
      
      if (frequency === RecurrenceFrequency.DAILY) {
        date.setDate(date.getDate() + i);
      } else if (frequency === RecurrenceFrequency.WEEKLY) {
        date.setDate(date.getDate() + (i * 7));
      } else if (frequency === RecurrenceFrequency.MONTHLY) {
        date.setMonth(date.getMonth() + i);
      }

      newTransactions.push({
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        date: date.toISOString(),
        recurrenceId: recurrenceCount > 1 ? recurrenceId : undefined
      });
    }

    setTransactions(prev => [...newTransactions, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Layout>
      <div className="space-y-6 pb-6">
        <Dashboard transactions={transactions} />
        
        <AIConsultant transactions={transactions} />
        
        <TransactionList 
          transactions={transactions} 
          onDelete={handleDeleteTransaction} 
        />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none px-4 max-w-md mx-auto">
        <div className="flex gap-4 pointer-events-auto">
          <button
            onClick={() => setIsInfoOpen(true)}
            className="w-14 h-14 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-300 active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modals */}
      {isFormOpen && (
        <TransactionForm 
          onAdd={handleAddTransaction} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isInfoOpen && (
        <InfoModal onClose={() => setIsInfoOpen(false)} />
      )}
    </Layout>
  );
};

export default App;
