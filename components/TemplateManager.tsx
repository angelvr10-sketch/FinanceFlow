
import React, { useState, useEffect } from 'react';
import { TransactionTemplate, TransactionType, Account } from '../types';

interface TemplateManagerProps {
  templates: TransactionTemplate[];
  accounts: Account[];
  onAdd: (template: TransactionTemplate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const CATEGORIES = ["Comida", "Transporte", "Ocio", "Hogar", "Salud", "Educación", "Sueldo", "Inversión", "Ventas", "Honorarios", "Otros"];

export const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, accounts, onAdd, onDelete, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Asegurar que si cambian las cuentas, se seleccione una válida
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación manual extra
    if (!name.trim() || !amount || !description.trim() || !accountId) {
      alert("Por favor rellena todos los campos, incluyendo la cuenta.");
      return;
    }

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      accountId,
      category,
      icon: type === TransactionType.INCOME ? 'salary' : 'shopping'
    });

    // Limpiar formulario tras éxito
    setName('');
    setDescription('');
    setAmount('');
    // Mantener la cuenta y categoría seleccionadas para facilidad de uso
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col p-6 z-[300] animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Plantillas Rápidas</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Automatiza tus registros frecuentes</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-4 bg-white/10 text-white rounded-2xl font-black text-sm uppercase hover:bg-white/20 transition-colors"
        >
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {/* Formulario de Creación */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-2xl h-fit overflow-y-auto max-h-full scrollbar-hide">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Nueva Plantilla</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Nombre de la Plantilla</label>
              <input 
                required
                placeholder="Ej: Pago de Renta" 
                value={name} onChange={e => setName(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-700 dark:text-white ring-2 ring-transparent focus:ring-indigo-500/20 transition-all" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Concepto Real</label>
              <input 
                required
                placeholder="Ej: Renta Departamento Marzo" 
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-700 dark:text-white ring-2 ring-transparent focus:ring-indigo-500/20 transition-all" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Monto Fijo</label>
                <input 
                  required
                  type="number" step="0.01" placeholder="0.00" 
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-700 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Tipo</label>
                <select 
                  value={type} onChange={e => setType(e.target.value as TransactionType)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-700 dark:text-white appearance-none"
                >
                  <option value={TransactionType.EXPENSE}>Gasto</option>
                  <option value={TransactionType.INCOME}>Ingreso</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Cuenta Destino</label>
                <select 
                  required
                  value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-700 dark:text-white appearance-none"
                >
                  <option value="" disabled>Seleccionar...</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Categoría</label>
                <select 
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold text-slate-700 dark:text-white appearance-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all mt-4"
            >
              Guardar Plantilla
            </button>
          </form>
        </div>

        {/* Listado de Plantillas Existentes */}
        <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Mis Plantillas</h3>
          {templates.map(t => (
            <div key={t.id} className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center group hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                   {t.type === TransactionType.INCOME ? '+' : '-'}
                </div>
                <div>
                  <p className="font-black text-white text-lg tracking-tight">{t.name}</p>
                  <div className="flex gap-3 items-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">${t.amount.toLocaleString()}</p>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{t.category}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => confirm(`¿Eliminar plantilla ${t.name}?`) && onDelete(t.id)} 
                className="p-3 bg-rose-500/10 text-rose-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="text-center py-20 bg-slate-800/20 rounded-[3rem] border border-dashed border-slate-700">
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm italic">No hay plantillas creadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
