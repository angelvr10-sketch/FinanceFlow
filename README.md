
# 💰 FinanceFlow AI - Guía de Configuración PostgreSQL

## 🚀 1. Configurar Tablas con Seguridad de Usuario (Multi-usuario)

Si recibes el error `relation "accounts" already exists`, es porque las tablas ya están creadas. Tienes dos opciones:

### Opción A: Borrar y Recrear (Recomendado para primera configuración)
**⚠️ Advertencia:** Esto borrará todos los datos actuales en esas tablas.
Ejecuta esto en el editor SQL de Supabase para limpiar el esquema:

```sql
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS accounts;
```

Luego ejecuta el script de la **Opción B**.

### Opción B: Script de Creación Segura (Idempotente)
Este script crea las tablas y políticas solo si no existen, evitando errores de duplicados.

```sql
-- 1. Crear tabla de cuentas
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
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
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
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

-- 5. Crear Políticas de Seguridad (Solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can only access their own accounts') THEN
        CREATE POLICY "Users can only access their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can only access their own transactions') THEN
        CREATE POLICY "Users can only access their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can only access their own templates') THEN
        CREATE POLICY "Users can only access their own templates" ON templates FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
```

## 🛠️ Solución de Errores Comunes
1. **"relation already exists"**: La tabla ya existe. Si no tiene la columna `user_id`, debes usar la **Opción A**.
2. **"column user_id does not exist"**: Esto ocurre si las tablas se crearon con una versión antigua del script. Borra las tablas (Opción A) y vuelve a crearlas.
