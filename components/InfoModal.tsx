
import React from 'react';

export const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-6 z-[100] animate-in fade-in zoom-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Recomendaciones Pro</h2>
          <p className="text-indigo-100 text-sm mt-1">¿Cómo crear y subir tu propia App?</p>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <section>
            <h3 className="font-bold text-slate-800 border-b pb-1 mb-2">Tecnologías Recomendadas</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="bg-blue-100 p-2 rounded-lg h-fit"><span className="text-blue-600 font-bold text-xs">PWA</span></div>
                <div>
                  <p className="text-sm font-bold">React + Vite + Tailwind</p>
                  <p className="text-xs text-slate-500">Convierte esta web en una Progressive Web App que se instala en Android sin pasar por la Play Store.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg h-fit"><span className="text-emerald-600 font-bold text-xs">DB</span></div>
                <div>
                  <p className="text-sm font-bold">Supabase o Firebase</p>
                  <p className="text-xs text-slate-500">Bases de datos en tiempo real ideales para móviles con modo offline.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-purple-100 p-2 rounded-lg h-fit"><span className="text-purple-600 font-bold text-xs">SDK</span></div>
                <div>
                  <p className="text-sm font-bold">Capacitor o React Native</p>
                  <p className="text-xs text-slate-500">Si quieres una App .apk real para subir a Google Play Store.</p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 border-b pb-1 mb-2">¿Dónde Subirla Gratis?</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://vercel.com" target="_blank" className="p-4 bg-slate-50 rounded-xl text-center border border-slate-200 hover:border-indigo-400">
                <p className="font-bold text-sm">Vercel</p>
                <p className="text-[10px] text-slate-400">Excelente para React</p>
              </a>
              <a href="https://netlify.com" target="_blank" className="p-4 bg-slate-50 rounded-xl text-center border border-slate-200 hover:border-indigo-400">
                <p className="font-bold text-sm">Netlify</p>
                <p className="text-[10px] text-slate-400">Simple y Rápido</p>
              </a>
              <a href="https://firebase.google.com" target="_blank" className="p-4 bg-slate-50 rounded-xl text-center border border-slate-200 hover:border-indigo-400">
                <p className="font-bold text-sm">Firebase Hosting</p>
                <p className="text-[10px] text-slate-400">Integración con DB</p>
              </a>
              <a href="https://github.com/features/actions" target="_blank" className="p-4 bg-slate-50 rounded-xl text-center border border-slate-200 hover:border-indigo-400">
                <p className="font-bold text-sm">GitHub Pages</p>
                <p className="text-[10px] text-slate-400">Totalmente Gratis</p>
              </a>
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-900 transition-colors"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
};
