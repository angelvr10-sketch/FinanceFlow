
import React, { useRef, useState } from 'react';
import { AccountManager } from './AccountManager';
import { TemplateManager } from './TemplateManager';
import { supabase } from '../services/supabase';
import { Account, TransactionTemplate } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  transactionCount: number;
  accountCount: number;
  allData: any;
  accounts: Account[];
  templates: TransactionTemplate[];
  onAddAccount: (acc: Account) => void;
  onUpdateAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
  onAddTemplate: (t: TransactionTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onSignOut: () => void;
  userEmail?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onExport, 
  onImport, 
  transactionCount,
  accountCount,
  accounts,
  templates,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddTemplate,
  onDeleteTemplate,
  onSignOut,
  userEmail
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const isCloudConnected = !!supabase;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('¿Restaurar datos desde este archivo?')) {
        onImport(file);
      }
      e.target.value = ''; 
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl border border-white/10 overflow-y-auto max-h-[90vh] scrollbar-hide">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Ajustes</h2>
              {userEmail && (
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1 truncate max-w-[150px]">{userEmail}</p>
              )}
            </div>
            <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest">Resumen</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{accountCount}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Cuentas</p>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-700">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{transactionCount}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Movimientos</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAccountManager(true)}
                className="flex items-center justify-center gap-4 w-full py-5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Gestionar Cuentas
              </button>

              <button
                type="button"
                onClick={() => setShowTemplateManager(true)}
                className="flex items-center justify-center gap-4 w-full py-5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Gestionar Plantillas
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={onExport}
                  className="flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                >
                  Exportar
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                >
                  Importar
                </button>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center justify-center gap-4 w-full py-5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all border border-rose-100 dark:border-rose-900/50"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAccountManager && (
        <AccountManager 
          accounts={accounts}
          onAdd={onAddAccount}
          onUpdate={onUpdateAccount}
          onDelete={onDeleteAccount}
          onClose={() => setShowAccountManager(false)}
        />
      )}

      {showTemplateManager && (
        <TemplateManager
          templates={templates}
          accounts={accounts}
          onAdd={onAddTemplate}
          onDelete={onDeleteTemplate}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </>
  );
};
