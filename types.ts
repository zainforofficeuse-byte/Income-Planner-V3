export interface Entry {
  id: number;
  amount: number;
  description: string;
  isIncome: boolean;
  date: string;
  time: string;
}

export interface CurrencySymbols {
  [key: string]: string;
}

export interface Category {
  name: string;
  icon: string;
}

export interface RecurringEntry {
  id: number;
  amount: number;
  description: string;
  isIncome: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
}
