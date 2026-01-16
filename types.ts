
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum RecurrenceFrequency {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export type AccountType = 'AHORRO' | 'TARJETA' | 'EFECTIVO' | 'INVERSION';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
}

export interface CategorizationResult {
  category: string;
  subCategory?: string;
  confidence: number;
  icon: string;
}

export interface Transaction {
  id: string;
  accountId: string; // Relación con la cuenta
  amount: number;
  description: string;
  category: string;
  subCategory?: string; // Sub-categoría sugerida por IA
  type: TransactionType;
  date: string;
  icon?: string;
  isRecurring?: boolean;
  recurrenceId?: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}
