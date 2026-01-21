
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!supabase) {
      setError("Supabase no está configurado. Revisa las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            // Esto asegura que al hacer clic en el email, vuelvan a la app
            emailRedirectTo: window.location.origin 
          }
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setSuccessMsg("¡Cuenta creada! Te hemos enviado un enlace de confirmación. Por favor, revisa tu correo (y la carpeta de SPAM).");
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (signInError) {
          // Error específico cuando el email no ha sido validado
          if (signInError.message.includes("Email not confirmed")) {
            setError("Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada o la carpeta de SPAM para activar tu cuenta.");
            setLoading(false);
            return;
          }
          throw signInError;
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message.includes("User already registered")) {
        setError("Este correo ya tiene una cuenta. Intenta iniciar sesión.");
      } else if (err.message.includes("Invalid login credentials")) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else if (err.message.includes("Password should be")) {
        setError("La seguridad es primero: la contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(err.message || "Ocurrió un error inesperado al conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center p-6 animate-in fade-in duration-700">
      <div className="max-w-md w-full mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            FinanceFlow <span className="text-indigo-600">AI</span>
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Gestión de Gastos Inteligente</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all">
          {successMsg ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">¡Casi listo!</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                {successMsg}
              </p>
              <div className="pt-4">
                <button 
                  onClick={() => { setSuccessMsg(null); setIsSignUp(false); }}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Volver al Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase text-center leading-tight">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Aviso Importante
                  </div>
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Tu Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Contraseña</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  isSignUp ? 'Empezar ahora' : 'Entrar a mi cuenta'
                )}
              </button>
            </form>
          )}

          {!successMsg && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿Eres nuevo? Regístrate aquí'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest px-8 leading-relaxed">
          Tus finanzas personales, potenciadas por Inteligencia Artificial y seguridad en la nube.
        </p>
      </div>
    </div>
  );
};
