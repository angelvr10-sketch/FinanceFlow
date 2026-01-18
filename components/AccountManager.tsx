
import React, { useState } from 'react';
import { Account, AccountType } from '../types';

interface AccountManagerProps {
  accounts: Account[];
  onAdd: (account: Account) => void;
  onUpdate: (account: Account) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ACCOUNT_TYPES: AccountType[] = ['AHORRO', 'TARJETA', 'EFECTIVO', 'INVERSION'];

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, onAdd, onUpdate, onDelete, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('AHORRO');
  const [color, setColor] = useState('#6366f1');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('AHORRO');
    setColor('#6366f1');
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setName(acc.name);
    setType(acc.type);
    setColor(acc.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const accountData: Account = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name,
      type,
      color
    };

    if (editingId) {
      onUpdate(accountData);
    } else {
      onAdd(accountData);
    }
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col p-6 z-[300] animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestionar Cuentas</h2>
        <button 
          onClick={onClose}
          className="p-4 bg-white/10 text-white rounded-2xl font-black text-sm uppercase hover:bg-white/20 transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden flex-1">
        {/* Formulario */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-2xl h-fit">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">
            {editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Nombre</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Nómina Santander"
                className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl font-bold text-slate-700 dark:text-white outline-none ring-2 ring-transparent focus:ring-indigo-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Tipo</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full p-5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl font-bold text-slate-700 dark:text-white outline-none"
                >
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Color</label>
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-[60px] p-2 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl cursor-pointer"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 py-5 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {editingId ? 'Guardar Cambios' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Cuentas */}
        <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Cuentas Activas</h3>
          {accounts.map(acc => (
            <div key={acc.id} className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: acc.color }}>
                  <span className="text-white font-black text-lg">{acc.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-black text-white text-lg tracking-tight">{acc.name}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{acc.type}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(acc)}
                  className="p-3 bg-white/5 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={() => confirm(`¿Eliminar ${acc.name}?`) && onDelete(acc.id)}
                  className="p-3 bg-white/5 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
