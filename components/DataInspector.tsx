
import React from 'react';

interface DataInspectorProps {
  data: any;
  onClose: () => void;
}

export const DataInspector: React.FC<DataInspectorProps> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col p-6 z-[110] animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Inspector de Datos</h2>
        <button 
          onClick={onClose}
          className="p-4 bg-white/10 text-white rounded-2xl font-black text-sm uppercase"
        >
          Cerrar
        </button>
      </div>
      
      <div className="flex-1 overflow-auto bg-slate-800/50 rounded-[2.5rem] p-6 border border-white/5">
        <pre className="text-indigo-300 font-mono text-sm leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      
      <p className="mt-6 text-slate-500 text-xs font-bold text-center uppercase tracking-widest">
        Esta es la representación JSON de tu base de datos actual
      </p>
    </div>
  );
};
