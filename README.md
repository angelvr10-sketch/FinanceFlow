
# 💰 FinanceFlow AI - Guía de Configuración PostgreSQL

## 🚀 1. Configurar Tablas con Seguridad de Usuario

Ejecuta esto en el editor SQL de Supabase para habilitar el multi-usuario:

```sql
-- 1. Crear tabla de cuentas
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de transacciones
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
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

-- 3. Crear tabla de plantillas
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar Seguridad por Fila (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas (Solo el dueño puede ver/editar sus datos)
CREATE POLICY "Users can only access their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own templates" ON templates FOR ALL USING (auth.uid() = user_id);
```
