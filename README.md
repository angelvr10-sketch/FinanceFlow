
# 💰 FinanceFlow AI - Guía de Configuración PostgreSQL

Esta aplicación utiliza **PostgreSQL** a través de **Supabase** para la persistencia de datos en la nube. Si no se configuran las credenciales, la app funcionará en modo **Local Storage** (solo en este navegador).

## 🚀 Pasos para conectar tu Base de Datos

1. **Crear Proyecto**: Regístrate en [Supabase](https://supabase.com) y crea un proyecto nuevo.
2. **Configurar Tablas**: Ve al `SQL Editor` en Supabase y ejecuta:

```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. **Variables de Entorno**: Configura en tu hosting (Vercel, Netlify, etc.) o archivo `.env`:
   - `SUPABASE_URL`: Tu URL de proyecto.
   - `SUPABASE_ANON_KEY`: Tu llave API pública.

## 📱 Cómo ver tus datos
Una vez conectado, entra en tu panel de Supabase y haz clic en **Table Editor**. Verás tus finanzas en formato de tabla SQL pura.
