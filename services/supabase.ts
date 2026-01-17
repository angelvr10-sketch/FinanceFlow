
/**
 * RECOMENDACIÓN PARA EL USUARIO:
 * Para usar PostgreSQL en la nube, crea un proyecto en https://supabase.com
 * Y configura estas variables en tu archivo .env (local) o en el panel de Vercel/Netlify.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase: Credenciales no detectadas en las variables de entorno. La aplicación funcionará en modo Local (LocalStorage).");
}

// Cliente listo para cuando el usuario configure su DB
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
