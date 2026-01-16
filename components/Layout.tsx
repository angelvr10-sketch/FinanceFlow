
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl flex flex-col relative pb-20">
      <header className="bg-indigo-600 text-white p-6 rounded-b-[2rem] shadow-lg sticky top-0 z-10">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          FinanceFlow AI
        </h1>
        <p className="text-indigo-100 text-sm opacity-90">Gestión inteligente de tus finanzas</p>
      </header>
      <main className="flex-grow overflow-y-auto px-4 pt-4">
        {children}
      </main>
    </div>
  );
};
