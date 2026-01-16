
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen max-w-md mx-auto bg-white dark:bg-slate-950 shadow-2xl flex flex-col relative transition-colors duration-300">
      <header className="bg-indigo-600 dark:bg-slate-900 text-white p-8 rounded-b-[3.5rem] shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tighter">
            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            FinanceFlow
          </h1>
          <p className="text-indigo-100 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-[0.3em] opacity-80">
            Inteligencia Financiera
          </p>
        </div>
      </header>
      <main className="flex-grow px-4 pt-6 bg-slate-50/50 dark:bg-slate-950/50">
        {children}
      </main>
    </div>
  );
};
