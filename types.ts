
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

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  date: string;
  icon?: string; // Icon identifier (e.g., 'food', 'car')
  isRecurring?: boolean;
  recurrenceId?: string; // To group related recurring transactions
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}
