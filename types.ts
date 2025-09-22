export interface Entry {
  id: number;
  amount: number;
  category: string;
  description: string;
  isIncome: boolean;
  date: string;
  time: string;
  account: string;
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
  category: string;
  description: string;
  isIncome: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
}

export interface BudgetGoal {
  id: number;
  name: string; // Matches an expense category for 'spending' type, or a custom name for 'saving'
  targetAmount: number;
  type: 'spending' | 'saving';
  month: string; // Format: YYYY-MM
}

// FIX: Declare the global `window.google` object to resolve TypeScript errors.
// The Google Identity Services library is loaded via a script tag, and this
// informs TypeScript about the `google` object attached to the window.
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}
