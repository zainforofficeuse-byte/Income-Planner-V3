
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
