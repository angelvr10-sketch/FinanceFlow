
import React, { useRef, useState } from 'react';
import { DataInspector } from './DataInspector';
import { AccountManager } from './AccountManager';
import { supabase } from '../services/supabase';
import { Account } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  transactionCount: number;
  accountCount: number;
  allData: any;
  accounts: Account[];
  onAddAccount: (acc: Account) => void;
  onUpdateAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onExport, 
  onImport, 
  transactionCount,
  accountCount,
  allData,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const isCloudConnected = !!supabase;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('¿Restaurar datos desde este archivo? Se borrarán los datos actuales en este dispositivo.')) {
        onImport(file);
      }
      e.target.value = ''; // Reset
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      alert("Error: No se pudo acceder al selector de archivos.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl border border-white/10 overflow-y-auto max-h-[90vh] scrollbar-hide">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Ajustes</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isCloudConnected ? 'Nube Conectada' : 'Modo Offline'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-widest">Resumen de Datos</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{accountCount}</p>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-tighter">Cuentas</p>
                </div>
                <div className="text-center border-l border-slate-200 dark:border-slate-700">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{transactionCount}</p>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-tighter">Movimientos</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAccountManager(true)}
                className="flex items-center justify-center gap-4 w-full py-5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-black text-sm uppercase tracking-widest rounded-2xl active:scale-95 transition-all border border-indigo-100 dark:border-indigo-500/20"
              >
                Gestionar Cuentas
              </button>

              <button
                type="button"
                onClick={() => setShowInspector(true)}
                className="flex items-center justify-center gap-4 w-full py-5 bg-slate-900 dark:bg-slate-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
              >
                Ver Datos Brutos
              </button>

              <button
                type="button"
                onClick={onExport}
                className="flex items-center justify-center gap-4 w-full py-5 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Exportar Backup
              </button>

              <button
                type="button"
                onClick={triggerFileSelect}
                className="flex items-center justify-center gap-4 w-full py-5 bg-white dark:bg-transparent border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-sm uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Restaurar JSON
              </button>
              {/* Simplificamos accept para Android */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>
        </div>
      </div>

      {showInspector && (
        <DataInspector 
          data={allData} 
          onClose={() => setShowInspector(false)} 
        />
      )}

      {showAccountManager && (
        <AccountManager 
          accounts={accounts}
          onAdd={onAddAccount}
          onUpdate={onUpdateAccount}
          onDelete={onDeleteAccount}
          onClose={() => setShowAccountManager(false)}
        />
      )}
    </>
  );
};
