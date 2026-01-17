
import React, { useState } from 'react';
import { TransactionTemplate, TransactionType, Account } from '../types';

interface TemplateManagerProps {
  templates: TransactionTemplate[];
  accounts: Account[];
  onAdd: (template: TransactionTemplate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, accounts, onAdd, onDelete, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [category, setCategory] = useState('Otros');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !description) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      amount: parseFloat(amount),
      type,
      accountId,
      category,
      icon: type === TransactionType.INCOME ? 'salary' : 'shopping'
    });

    setName('');
    setDescription('');
    setAmount('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col p-6 z-[130] animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Plantillas</h2>
        <button onClick={onClose} className="p-4 bg-white/10 text-white rounded-2xl font-black text-sm uppercase">Cerrar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] h-fit">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Nueva Plantilla</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              placeholder="Nombre (ej: Pago Netflix)" 
              value={name} onChange={e => setName(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold dark:text-white" 
            />
            <input 
              placeholder="Descripción real" 
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold dark:text-white" 
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number" placeholder="Monto" 
                value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold dark:text-white" 
              />
              <select 
                value={type} onChange={e => setType(e.target.value as TransactionType)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none font-bold dark:text-white"
              >
                <option value={TransactionType.EXPENSE}>Gasto</option>
                <option value={TransactionType.INCOME}>Ingreso</option>
              </select>
            </div>
            <button className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-lg">Guardar Plantilla</button>
          </form>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
          {templates.map(t => (
            <div key={t.id} className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5 flex justify-between items-center">
              <div>
                <p className="font-black text-white text-lg">{t.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.description} • ${t.amount}</p>
              </div>
              <button onClick={() => onDelete(t.id)} className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
          {templates.length === 0 && <p className="text-center py-10 text-slate-500 font-bold italic">No tienes plantillas creadas</p>}
        </div>
      </div>
    </div>
  );
};
