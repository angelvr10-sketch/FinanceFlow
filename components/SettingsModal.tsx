
import React, { useRef, useState } from 'react';
import { DataInspector } from './DataInspector';
import { supabase } from '../services/supabase';

interface SettingsModalProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  transactionCount: number;
  accountCount: number;
  allData: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onExport, 
  onImport, 
  transactionCount,
  accountCount,
  allData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInspector, setShowInspector] = useState(false);
  const isCloudConnected = !!supabase;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('¿Importar datos? Esto borrará lo actual.')) {
        onImport(file);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl border border-white/10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Ajustes</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isCloudConnected ? 'Nube Conectada (Postgres)' : 'Modo Local (Offline)'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-600">
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
                onClick={() => setShowInspector(true)}
                className="flex items-center justify-center gap-4 w-full py-5 bg-slate-900 dark:bg-slate-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                </svg>
                Inspeccionar Bruto
              </button>

              <button
                onClick={onExport}
                className="flex items-center justify-center gap-4 w-full py-5 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Backup
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-4 w-full py-5 bg-white dark:bg-transparent border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-sm uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Restaurar JSON
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-loose">
                {isCloudConnected 
                  ? 'Tus datos se sincronizan con PostgreSQL en Supabase.' 
                  : 'Sube tu app a Vercel con las llaves de Supabase para activar la nube.'}
              </p>
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
    </>
  );
};
