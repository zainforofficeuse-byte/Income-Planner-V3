import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Entry, CurrencySymbols } from './types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const currencySymbols: CurrencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'PKR': '₨',
    'AED': 'د.إ',
    'PHP': '₱',
};

const defaultIncomeCategories = ['Salary', 'Profit', 'Loan', 'Gift', 'Other'];
const defaultExpenseCategories = ['Repay Loan', 'Grocery', 'Rent', 'Transport', 'Entertainment', 'Other'];

// --- Helper Components ---

interface CategoryManagerProps {
    title: string;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ title, categories, setCategories }) => {
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ index: number; name: string } | null>(null);

    const handleAdd = () => {
        if (newCategory.trim() && !categories.map(c => c.toLowerCase()).includes(newCategory.trim().toLowerCase())) {
            setCategories(prev => [...prev, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const handleDelete = (index: number) => {
        if (window.confirm(`Are you sure you want to delete "${categories[index]}"? This cannot be undone.`)) {
            setCategories(prev => prev.filter((_, i) => i !== index));
            if (editingCategory?.index === index) {
                setEditingCategory(null);
            }
        }
    };
    
    const handleUpdate = () => {
        if (editingCategory && editingCategory.name.trim()) {
             if (categories.map(c => c.toLowerCase()).includes(editingCategory.name.trim().toLowerCase()) && categories[editingCategory.index].toLowerCase() !== editingCategory.name.trim().toLowerCase()) {
                 alert("A category with this name already exists.");
                 return;
             }
            setCategories(prev => {
                const updated = [...prev];
                updated[editingCategory.index] = editingCategory.name.trim();
                return updated;
            });
            setEditingCategory(null);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">{title}</h3>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add new category"
                    className="flex-grow bg-gray-100 border-2 border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50" disabled={!newCategory.trim()}>Add</button>
            </div>
            <ul className="space-y-2 max-h-[35vh] overflow-y-auto pr-2">
                {categories.map((cat, index) => (
                    <li key={`${cat}-${index}`} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group">
                        {editingCategory?.index === index ? (
                             <input 
                                type="text"
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory({ index, name: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                autoFocus
                                onBlur={() => setEditingCategory(null)}
                                className="flex-grow bg-white border-2 border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            />
                        ) : (
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat}</span>
                        )}
                        
                        <div className="flex items-center gap-1 ml-2">
                           {editingCategory?.index === index ? (
                                <>
                                    <button onClick={handleUpdate} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </button>
                                     <button onClick={() => setEditingCategory(null)} className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </>
                           ) : (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingCategory({ index, name: cat })} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(index)} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                           )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCurrency: string;
    onSelectCurrency: (currency: string) => void;
    incomeCategories: string[];
    setIncomeCategories: React.Dispatch<React.SetStateAction<string[]>>;
    expenseCategories: string[];
    setExpenseCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onSelectCurrency, selectedCurrency, 
    incomeCategories, setIncomeCategories, expenseCategories, setExpenseCategories 
}) => {
    if (!isOpen) return null;
    const [activeTab, setActiveTab] = useState<'currency' | 'income' | 'expense'>('currency');

    const renderContent = () => {
        switch (activeTab) {
            case 'income':
                return <CategoryManager title="Income Categories" categories={incomeCategories} setCategories={setIncomeCategories} />;
            case 'expense':
                return <CategoryManager title="Expense Categories" categories={expenseCategories} setCategories={setExpenseCategories} />;
            case 'currency':
            default:
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">Select Currency</h3>
                         <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {Object.entries(currencySymbols).map(([code, symbol]) => (
                                <div
                                    key={code}
                                    onClick={() => onSelectCurrency(code)}
                                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <span className="text-2xl w-8 text-center text-gray-700 dark:text-gray-300">{symbol}</span>
                                        <span className="ml-4 font-medium text-gray-700 dark:text-gray-300">{code}</span>
                                    </div>
                                    {selectedCurrency === code && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };
    
    const TabButton: React.FC<{tab: 'currency' | 'income' | 'expense', children: React.ReactNode}> = ({tab, children}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'bg-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50" onClick={onClose}>
            <div className="bg-gray-100 dark:bg-gray-900 w-full max-w-md rounded-t-2xl h-[85vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                     <h2 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">Settings</h2>
                </div>
                 <div className="flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700 flex justify-center space-x-2">
                    <TabButton tab="currency">Currency</TabButton>
                    <TabButton tab="income">Income</TabButton>
                    <TabButton tab="expense">Expense</TabButton>
                </div>
                <div className="flex-grow p-4 overflow-y-hidden bg-white dark:bg-gray-800">
                    {renderContent()}
                </div>
            </div>
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

interface EditEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: Entry | null;
    onSave: (entry: Entry) => void;
    currencySymbol: string;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ isOpen, onClose, entry, onSave, currencySymbol }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isIncome, setIsIncome] = useState(true);

    useEffect(() => {
        if (entry) {
            setAmount(entry.amount.toLocaleString('en-US'));
            setDescription(entry.description);
            setIsIncome(entry.isIncome);
        }
    }, [entry]);

    if (!isOpen || !entry) return null;
    
    const formatNumber = (input: string): string => {
        if (!input) return '';
        const digitsOnly = input.replace(/[^0-9]/g, '');
        if (!digitsOnly) return '';
        return parseInt(digitsOnly, 10).toLocaleString('en-US');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(formatNumber(e.target.value));
    };

    const handleSave = () => {
        const cleanAmount = amount.replace(/,/g, '');
        const numericAmount = parseFloat(cleanAmount);

        if (isNaN(numericAmount) || numericAmount <= 0 || description.trim() === '') {
            alert('Please enter a valid amount and description.');
            return;
        }

        onSave({
            ...entry,
            amount: numericAmount,
            description: description.trim(),
            isIncome,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 flex flex-col animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Edit Transaction</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 dark:text-gray-500">{currencySymbol}</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={amount}
                                onChange={handleAmountChange}
                                className="w-full bg-gray-100 border-2 border-gray-200 rounded-lg py-2 pl-9 pr-3 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                         <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full mt-1 bg-gray-100 border-2 border-gray-200 rounded-lg py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <button onClick={() => setIsIncome(true)} className={`py-2 rounded-lg text-sm font-semibold transition ${isIncome ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Income</button>
                            <button onClick={() => setIsIncome(false)} className={`py-2 rounded-lg text-sm font-semibold transition ${!isIncome ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Expense</button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="py-2.5 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="py-2.5 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition">Save Changes</button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};


interface HistoryItemProps {
  entry: Entry;
  currencySymbol: string;
  onEdit: () => void;
  onDelete: () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = React.memo(({ entry, currencySymbol, onEdit, onDelete }) => {
  const isIncome = entry.isIncome;
  const sign = isIncome ? '+' : '-';
  const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColorClass = isIncome ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50';

  return (
    <div className="flex items-center py-3 relative group">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColorClass} ${colorClass} font-bold text-lg flex-shrink-0`}>
        {sign}
      </div>
      <div className="ml-4 flex-grow">
        <p className="font-semibold text-gray-800 dark:text-gray-100">{entry.description}</p>
        <p className={`text-sm font-bold ${colorClass}`}>
          {currencySymbol} {entry.amount.toLocaleString()}
        </p>
      </div>
      <div className="text-right text-xs text-gray-500 dark:text-gray-400 ml-2">
        <p>{entry.date}</p>
        <p>{entry.time}</p>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full" aria-label="Edit transaction">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
        </button>
        <button onClick={onDelete} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-full" aria-label="Delete transaction">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
});

// --- Page Components ---

interface PlannerPageProps {
    entries: Entry[];
    amount: string;
    description: string;
    error: string;
    currencySymbol: string;
    totalBalance: number;
    suggestionList: string[];
    handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setDescription: (desc: string) => void;
    handleAddEntry: (isIncome: boolean) => void;
    onEditEntry: (entry: Entry) => void;
    onDeleteEntry: (id: number) => void;
}

const PlannerPage: React.FC<PlannerPageProps> = ({
    entries, amount, description, error, currencySymbol, totalBalance, suggestionList,
    handleAmountChange, setDescription, handleAddEntry, onEditEntry, onDeleteEntry
}) => (
    <>
        <div className="flex-grow flex flex-col">
            {entries.length > 0 ? (
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4 overflow-hidden flex flex-col">
                   <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 pr-2">
                     {entries.slice().reverse().map(entry => (
                        <HistoryItem 
                            key={entry.id} 
                            entry={entry} 
                            currencySymbol={currencySymbol} 
                            onEdit={() => onEditEntry(entry)}
                            onDelete={() => onDeleteEntry(entry.id)}
                        />
                     ))}
                   </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400 mb-4">
                    <div>
                        <p className="text-lg font-medium">Welcome!</p>
                        <p className="text-sm">Add your first transaction below.</p>
                    </div>
                </div>
            )}
        </div>
        
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 mt-auto shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 dark:text-gray-500">{currencySymbol}</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl py-3 pl-12 pr-4 text-2xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                />
            </div>

            {amount && (
                <div className="mt-4 animate-fade-in">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (e.g., Salary, Groceries)"
                        className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    />
                    <div className="mt-2 flex overflow-x-auto space-x-2 pb-2 -mx-4 px-4">
                        {suggestionList.map(s => (
                            <button 
                              key={s} 
                              onClick={() => setDescription(s)}
                              className="flex-shrink-0 px-4 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-4">
                <button 
                    onClick={() => handleAddEntry(true)}
                    className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-bold rounded-xl shadow-md hover:bg-green-600 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!amount || !description}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>
                    <span>Income</span>
                </button>
                <button 
                    onClick={() => handleAddEntry(false)}
                    className="flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-bold rounded-xl shadow-md hover:bg-red-600 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!amount || !description}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-4.707a1 1 0 001.414 1.414l3-3a1 1 0 00-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3z" clipRule="evenodd" /></svg>
                    <span>Expense</span>
                </button>
            </div>

            <div className={`mt-6 text-center p-4 rounded-2xl transition-colors ${totalBalance >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'}`}>
                <p className="text-sm font-medium">Total Balance</p>
                <p className="text-2xl font-bold">{currencySymbol} {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        </div>
    </>
);


interface BreakdownDisplayProps {
    title: string;
    data: [string, number][];
    total: number;
    isIncome: boolean;
    currencySymbol: string;
}

const PIE_COLORS = {
    income: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
    expense: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
};

const BreakdownDisplay: React.FC<BreakdownDisplayProps> = ({ title, data, total, isIncome, currencySymbol }) => {
    const chartData = useMemo(() => data.map(([name, value]) => ({ name, value })), [data]);
    const colors = isIncome ? PIE_COLORS.income : PIE_COLORS.expense;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0].payload;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2.5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</p>
                    <p className={`text-xs font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {currencySymbol} {value.toLocaleString()} ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className={`text-lg font-bold mb-3 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{title}</h3>
            {data.length > 0 ? (
                <>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" labelLine={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="focus:outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <ul className="space-y-3 mt-4">
                        {data.map(([category, amount]) => (
                            <li key={category}>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{currencySymbol} {amount.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className={`${isIncome ? 'bg-green-500' : 'bg-red-500'} h-2 rounded-full`} style={{ width: `${total > 0 ? (amount / total) * 100 : 0}%` }}></div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No {isIncome ? 'income' : 'expense'} data yet.</p>
            )}
        </div>
    );
};


interface DashboardPageProps {
    entries: Entry[];
    currencySymbol: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ entries, currencySymbol }) => {
    const { totalIncome, totalExpense, incomeByCategory, expenseByCategory } = useMemo(() => {
        const incomeEntries = entries.filter(e => e.isIncome);
        const expenseEntries = entries.filter(e => !e.isIncome);

        const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);
        const totalExpense = expenseEntries.reduce((sum, e) => sum + e.amount, 0);

        const groupByCategory = (entryList: Entry[]) => 
            entryList.reduce((acc, entry) => {
                acc[entry.description] = (acc[entry.description] || 0) + entry.amount;
                return acc;
            }, {} as Record<string, number>);

        const incomeByCategory = Object.entries(groupByCategory(incomeEntries)).sort((a, b) => b[1] - a[1]);
        const expenseByCategory = Object.entries(groupByCategory(expenseEntries)).sort((a, b) => b[1] - a[1]);
        
        return { totalIncome, totalExpense, incomeByCategory, expenseByCategory };
    }, [entries]);

    return (
        <div className="space-y-6 overflow-y-auto pb-24">
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-100 dark:bg-green-900/60 p-4 rounded-2xl">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Income</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-200">{currencySymbol} {totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/60 p-4 rounded-2xl">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Total Expense</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-200">{currencySymbol} {totalExpense.toLocaleString()}</p>
                </div>
            </div>
            
            <BreakdownDisplay title="Income by Category" data={incomeByCategory} total={totalIncome} isIncome={true} currencySymbol={currencySymbol} />
            <BreakdownDisplay title="Expense by Category" data={expenseByCategory} total={totalExpense} isIncome={false} currencySymbol={currencySymbol} />
        </div>
    );
};


// --- Main Application Component ---

const App: React.FC = () => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<'planner' | 'dashboard'>('planner');
    
    const [incomeCategories, setIncomeCategories] = useState<string[]>(defaultIncomeCategories);
    const [expenseCategories, setExpenseCategories] = useState<string[]>(defaultExpenseCategories);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'light';
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            document.querySelector('html')?.classList.add('dark');
        } else {
            root.classList.remove('dark');
            document.querySelector('html')?.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const totalBalance = useMemo(() => {
        return entries.reduce((sum, entry) => {
            return sum + (entry.isIncome ? entry.amount : -entry.amount);
        }, 0);
    }, [entries]);

    const suggestionList = useMemo(() => {
        const recentDescriptions = entries
            .slice(-10)
            .reverse()
            .map(e => e.description);
        const uniqueRecent = [...new Set(recentDescriptions)];
        const combined = [...incomeCategories, ...expenseCategories, ...uniqueRecent];
        return [...new Set(combined)];
    }, [entries, incomeCategories, expenseCategories]);
    
    const formatNumber = (input: string): string => {
        if (!input) return '';
        const digitsOnly = input.replace(/[^0-9]/g, '');
        if (!digitsOnly) return '';
        return parseInt(digitsOnly, 10).toLocaleString('en-US');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumber(e.target.value);
        setAmount(formatted);
    };

    const handleAddEntry = useCallback((isIncome: boolean) => {
        const cleanAmount = amount.replace(/,/g, '');
        const numericAmount = parseFloat(cleanAmount);

        if (isNaN(numericAmount) || numericAmount <= 0 || description.trim() === '') {
            setError('Please enter a valid amount and description.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const now = new Date();
        const newEntry: Entry = {
            id: Date.now(),
            amount: numericAmount,
            description: description.trim(),
            isIncome,
            date: now.toLocaleDateString('en-CA'), // YYYY-MM-DD
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };

        setEntries(prevEntries => [...prevEntries, newEntry]);
        setAmount('');
        setDescription('');
        setError('');
    }, [amount, description]);

    const handleSelectCurrency = (currencyCode: string) => {
        setSelectedCurrency(currencyCode);
    };
    
    const handleDeleteEntry = (id: number) => {
        if (window.confirm("Are you sure you want to delete this transaction?")) {
            setEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleOpenEditModal = (entry: Entry) => {
        setEntryToEdit(entry);
        setIsEditModalOpen(true);
    };

    const handleUpdateEntry = (updatedEntry: Entry) => {
        setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
        setIsEditModalOpen(false);
        setEntryToEdit(null);
    };

    const currencySymbol = currencySymbols[selectedCurrency] ?? '$';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
            <header className="bg-white dark:bg-gray-800/80 dark:backdrop-blur-sm dark:border-b dark:border-gray-700 shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {currentPage === 'planner' ? 'Income Planner' : 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <button onClick={handleThemeToggle} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
                           {theme === 'light' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                           ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                           )}
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Open settings">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 max-w-md mx-auto w-full flex flex-col">
                {currentPage === 'planner' ? (
                    <PlannerPage
                        entries={entries}
                        amount={amount}
                        description={description}
                        error={error}
                        currencySymbol={currencySymbol}
                        totalBalance={totalBalance}
                        suggestionList={suggestionList}
                        handleAmountChange={handleAmountChange}
                        setDescription={setDescription}
                        handleAddEntry={handleAddEntry}
                        onEditEntry={handleOpenEditModal}
                        onDeleteEntry={handleDeleteEntry}
                    />
                ) : (
                    <DashboardPage entries={entries} currencySymbol={currencySymbol} />
                )}
            </main>
            
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-10">
                <div className="flex justify-around">
                    <button onClick={() => setCurrentPage('planner')} className={`flex-1 py-3 text-center transition-colors ${currentPage === 'planner' ? 'text-blue-500 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        Planner
                    </button>
                    <button onClick={() => setCurrentPage('dashboard')} className={`flex-1 py-3 text-center transition-colors ${currentPage === 'dashboard' ? 'text-blue-500 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        Dashboard
                    </button>
                </div>
            </nav>

            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                onSelectCurrency={handleSelectCurrency}
                selectedCurrency={selectedCurrency}
                incomeCategories={incomeCategories}
                setIncomeCategories={setIncomeCategories}
                expenseCategories={expenseCategories}
                setExpenseCategories={setExpenseCategories}
            />

            <EditEntryModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                entry={entryToEdit}
                onSave={handleUpdateEntry}
                currencySymbol={currencySymbol}
            />

            <style>{`
                html.dark {
                    color-scheme: dark;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                /* Custom scrollbar for suggestions */
                .overflow-x-auto::-webkit-scrollbar {
                    height: 4px;
                }
                .overflow-x-auto::-webkit-scrollbar-thumb {
                    background-color: #d1d5db;
                    border-radius: 20px;
                }
                .dark .overflow-x-auto::-webkit-scrollbar-thumb {
                    background-color: #4b5563;
                }
            `}</style>
        </div>
    );
}

export default App;