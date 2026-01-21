
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
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) throw signUpError;

        // Si no hay sesión pero el registro fue exitoso, es que requiere confirmación por email
        if (data.user && !data.session) {
          setSuccessMsg("¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar tu cuenta y poder entrar.");
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      // Traducir algunos errores comunes de Supabase
      if (err.message.includes("User already registered")) {
        setError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else if (err.message.includes("Invalid login credentials")) {
        setError("Credenciales inválidas. Revisa tu email y contraseña.");
      } else if (err.message.includes("Password should be")) {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(err.message || "Ocurrió un error inesperado.");
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
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Tu libertad financiera empieza aquí</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-all">
          {successMsg ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight leading-relaxed">
                {successMsg}
              </p>
              <button 
                onClick={() => { setSuccessMsg(null); setIsSignUp(false); }}
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase text-center leading-tight">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="hola@ejemplo.com"
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
                    placeholder="••••••••"
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
                  isSignUp ? 'Crear Cuenta' : 'Entrar'
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
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest px-8">
          Tus datos están cifrados y sincronizados con la nube de forma segura.
        </p>
      </div>
    </div>
  );
};
