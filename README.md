
# 💰 FinanceFlow AI - Guía de Configuración PostgreSQL

Esta aplicación utiliza **PostgreSQL** a través de **Supabase** para la persistencia de datos en la nube.

## 🚀 1. Configurar Tablas (SQL Editor)

Ejecuta esto primero para crear la estructura:

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

## 📊 2. Cargar Datos de Prueba (Mayo 2025)

Copia y pega este bloque en el SQL Editor de Supabase para ver datos inmediatamente:

```sql
-- Primero las cuentas (Si ya existen, no hace nada)
INSERT INTO accounts (id, name, type, color) VALUES
('acc_1', '💰 Ahorros', 'AHORRO', '#6366f1'),
('acc_2', '💳 Tarjeta', 'TARJETA', '#f43f5e'),
('acc_3', '💵 Efectivo', 'EFECTIVO', '#10b981')
ON CONFLICT (id) DO NOTHING;

-- Transacciones de Mayo 2025
INSERT INTO transactions (id, account_id, amount, description, category, type, date, icon) VALUES
('tx_2025_1', 'acc_1', 3200, 'Sueldo Mayo', 'Sueldo', 'INCOME', '2025-05-01T09:00:00Z', 'salary'),
('tx_2025_2', 'acc_1', 900, 'Pago Alquiler', 'Hogar', 'EXPENSE', '2025-05-02T10:00:00Z', 'home'),
('tx_2025_3', 'acc_2', 42.5, 'Cena Restaurante', 'Comida', 'EXPENSE', '2025-05-05T21:00:00Z', 'food'),
('tx_2025_4', 'acc_3', 25, 'Gasolina Moto', 'Transporte', 'EXPENSE', '2025-05-07T14:00:00Z', 'transport'),
('tx_2025_5', 'acc_2', 12.99, 'Disney Plus', 'Ocio', 'EXPENSE', '2025-05-10T08:00:00Z', 'leisure'),
('tx_2025_6', 'acc_1', 150, 'Venta Bicicleta', 'Ventas', 'INCOME', '2025-05-12T16:00:00Z', 'business'),
('tx_2025_7', 'acc_2', 85.2, 'Compra Semanal', 'Comida', 'EXPENSE', '2025-05-15T11:00:00Z', 'food'),
('tx_2025_8', 'acc_3', 30, 'Cervezas Afterwork', 'Ocio', 'EXPENSE', '2025-05-18T20:00:00Z', 'leisure'),
('tx_2025_9', 'acc_2', 220, 'Seguro Salud', 'Salud', 'EXPENSE', '2025-05-20T09:00:00Z', 'health'),
('tx_2025_10', 'acc_1', 400, 'Proyecto Freelance', 'Honorarios', 'INCOME', '2025-05-21T18:00:00Z', 'professional')
ON CONFLICT (id) DO NOTHING;
```

## 📱 3. Sincronización
La app detectará los cambios automáticamente la próxima vez que inicies o recargues la página (si configuraste las llaves SUPABASE_URL y SUPABASE_ANON_KEY en tu entorno).
