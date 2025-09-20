import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Entry, CurrencySymbols, Category, RecurringEntry, BudgetGoal } from './types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';

// Assumes GOOGLE_API_KEY and GOOGLE_CLIENT_ID are available in the environment
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SPREADSHEET_NAME = 'IncomePlannerData';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];


const currencySymbols: CurrencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'PKR': '₨',
    'AED': 'د.إ',
    'PHP': '₱',
};

const defaultIncomeCategories: Category[] = [
    { name: 'Salary', icon: '💰' },
    { name: 'Profit', icon: '📈' },
    { name: 'Loan', icon: '🏦' },
    { name: 'Gift', icon: '🎁' },
    { name: 'Other', icon: '🪙' },
];
const defaultExpenseCategories: Category[] = [
    { name: 'Repay Loan', icon: '💸' },
    { name: 'Grocery', icon: '🛒' },
    { name: 'Rent', icon: '🏠' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Entertainment', icon: '🎬' },
    { name: 'Other', icon: '🛍️' },
];


// --- Helper Components ---

const formatNumberInput = (input: string): string => {
    if (!input) return '';
    const digitsOnly = input.replace(/[^0-9]/g, '');
    if (!digitsOnly) return '';
    return parseInt(digitsOnly, 10).toLocaleString('en-US');
};

interface MergeDataModalProps {
    isOpen: boolean;
    onKeepCloud: () => void;
    onKeepLocal: () => void;
    onMerge: () => void;
}

const MergeDataModal: React.FC<MergeDataModalProps> = ({ isOpen, onKeepCloud, onKeepLocal, onMerge }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" >
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 flex flex-col animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sync Conflict</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">You have data saved on this device and in your Google Account. How would you like to proceed?</p>
                
                <div className="space-y-3">
                    <button onClick={onKeepCloud} className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Use Google Sheets Data</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Replaces device data with cloud data.</p>
                    </button>
                    <button onClick={onKeepLocal} className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Use Device Data</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Replaces cloud data with device data.</p>
                    </button>
                     <button onClick={onMerge} className="w-full text-left p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/80 transition">
                        <p className="font-semibold text-blue-800 dark:text-blue-300">Merge Both</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Combines data from both sources (Recommended).</p>
                    </button>
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

interface BudgetManagerProps {
    budgetGoals: BudgetGoal[];
    setBudgetGoals: React.Dispatch<React.SetStateAction<BudgetGoal[]>>;
    expenseCategories: Category[];
    currencySymbol: string;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgetGoals, setBudgetGoals, expenseCategories, currencySymbol }) => {
    const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

    const [formState, setFormState] = useState({
        type: 'spending' as 'spending' | 'saving',
        name: expenseCategories.length > 0 ? expenseCategories[0].name : '',
        customName: 'Monthly Savings',
        targetAmount: '',
    });

    useEffect(() => {
        // Reset name selection when expense categories change to avoid invalid state
        if (formState.type === 'spending' && !expenseCategories.some(c => c.name === formState.name)) {
            setFormState(prev => ({ ...prev, name: expenseCategories[0]?.name || '' }));
        }
    }, [expenseCategories, formState.type, formState.name]);

    const handleAddGoal = () => {
        const cleanAmount = formState.targetAmount.replace(/,/g, '');
        const numericAmount = parseFloat(cleanAmount);
        const name = formState.type === 'spending' ? formState.name : formState.customName;

        if (isNaN(numericAmount) || numericAmount <= 0 || !name.trim()) {
            alert('Please provide a valid name and target amount.');
            return;
        }

        const newGoal: BudgetGoal = {
            id: Date.now(),
            type: formState.type,
            name: name.trim(),
            targetAmount: numericAmount,
            month: currentMonth,
        };

        setBudgetGoals(prev => [...prev, newGoal]);
        setFormState(prev => ({
            ...prev,
            targetAmount: '',
            customName: 'Monthly Savings'
        }));
    };
    
    const handleDeleteGoal = (id: number) => {
        if (window.confirm('Are you sure you want to delete this budget goal?')) {
            setBudgetGoals(prev => prev.filter(g => g.id !== id));
        }
    };
    
    const currentMonthGoals = budgetGoals.filter(g => g.month === currentMonth);

    return (
        <div>
            <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">This Month's Budget Goals</h3>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6 border border-gray-200 dark:border-gray-600 space-y-3">
                 <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Goal Type</label>
                    <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value as any})} className="w-full mt-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="spending">Spending Limit</option>
                        <option value="saving">Savings Goal</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{formState.type === 'spending' ? 'Category' : 'Goal Name'}</label>
                    {formState.type === 'spending' ? (
                        <select value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full mt-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" disabled={expenseCategories.length === 0}>
                            {expenseCategories.length > 0 ? (
                                expenseCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)
                            ) : (
                                <option>No expense categories found</option>
                            )}
                        </select>
                    ) : (
                        <input type="text" value={formState.customName} onChange={e => setFormState({...formState, customName: e.target.value})} className="w-full mt-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    )}
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Amount</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{currencySymbol}</span>
                        <input type="text" inputMode="numeric" value={formState.targetAmount} onChange={(e) => setFormState({...formState, targetAmount: formatNumberInput(e.target.value)})} className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 pl-7 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>
                <button onClick={handleAddGoal} className="w-full mt-3 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50" disabled={!formState.targetAmount || (formState.type === 'spending' && !formState.name) || (formState.type === 'saving' && !formState.customName)}>Add Goal</button>
            </div>
            
             <ul className="space-y-2 max-h-[35vh] overflow-y-auto pr-2">
                 {currentMonthGoals.map(goal => (
                    <li key={goal.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group flex items-center justify-between">
                        <div>
                             <p className="font-semibold text-gray-800 dark:text-gray-100">{goal.name}</p>
                             <p className={`text-sm font-bold ${goal.type === 'saving' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                Target: {currencySymbol}{goal.targetAmount.toLocaleString()}
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 capitalize ml-2">({goal.type})</span>
                            </p>
                        </div>
                         <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                    </li>
                 ))}
                 {currentMonthGoals.length === 0 && <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No budget goals set for this month.</p>}
             </ul>
        </div>
    );
};

interface RecurringManagerProps {
    recurringEntries: RecurringEntry[];
    setRecurringEntries: React.Dispatch<React.SetStateAction<RecurringEntry[]>>;
    currencySymbol: string;
}

const RecurringManager: React.FC<RecurringManagerProps> = ({ recurringEntries, setRecurringEntries, currencySymbol }) => {
    const [formState, setFormState] = useState({
        amount: '',
        description: '',
        isIncome: true,
        frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
        startDate: new Date().toISOString().split('T')[0],
    });
    const [editingEntry, setEditingEntry] = useState<RecurringEntry | null>(null);
    
    const resetForm = () => {
        setFormState({
            amount: '',
            description: '',
            isIncome: true,
            frequency: 'monthly',
            startDate: new Date().toISOString().split('T')[0],
        });
    };

    const handleAdd = () => {
        const cleanAmount = formState.amount.replace(/,/g, '');
        const numericAmount = parseFloat(cleanAmount);

        if (isNaN(numericAmount) || numericAmount <= 0 || !formState.description.trim() || !formState.startDate) {
            alert('Please fill all fields with valid values.');
            return;
        }

        const newRecurringEntry: RecurringEntry = {
            id: Date.now(),
            amount: numericAmount,
            description: formState.description.trim(),
            isIncome: formState.isIncome,
            frequency: formState.frequency,
            startDate: formState.startDate,
            nextDueDate: formState.startDate,
        };
        setRecurringEntries(prev => [...prev, newRecurringEntry]);
        resetForm();
    };
    
    const handleDelete = (id: number) => {
        if(window.confirm('Are you sure you want to delete this recurring transaction?')) {
            setRecurringEntries(prev => prev.filter(e => e.id !== id));
            if(editingEntry?.id === id) {
                setEditingEntry(null);
            }
        }
    };
    
    const handleUpdate = () => {
        if (!editingEntry) return;
        
        const cleanAmount = String(editingEntry.amount).replace(/,/g, '');
        const numericAmount = parseFloat(cleanAmount);

        if (isNaN(numericAmount) || numericAmount <= 0 || !editingEntry.description.trim()) {
            alert('Please provide a valid amount and description.');
            return;
        }

        setRecurringEntries(prev => prev.map(e => e.id === editingEntry.id ? {...editingEntry, amount: numericAmount} : e));
        setEditingEntry(null);
    };
    
    const handleFormAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState(prev => ({...prev, amount: formatNumberInput(e.target.value) }));
    };

    const handleEditAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingEntry) {
            setEditingEntry({...editingEntry, amount: Number(formatNumberInput(e.target.value).replace(/,/g, '')) });
        }
    };
    
    return (
        <div>
            <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">Recurring Transactions</h3>
            
            {/* Add New Form */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-6 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{currencySymbol}</span>
                            <input type="text" inputMode="numeric" value={formState.amount} onChange={handleFormAmountChange} className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 pl-7 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="col-span-2">
                         <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
                         <input type="text" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full mt-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Frequency</label>
                        <select value={formState.frequency} onChange={e => setFormState({...formState, frequency: e.target.value as any})} className="w-full mt-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                        <input type="date" value={formState.startDate} onChange={e => setFormState({...formState, startDate: e.target.value})} className="w-full mt-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-2 mt-1">
                        <button onClick={() => setFormState({...formState, isIncome: true})} className={`py-1.5 rounded-md text-xs font-semibold transition ${formState.isIncome ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Income</button>
                        <button onClick={() => setFormState({...formState, isIncome: false})} className={`py-1.5 rounded-md text-xs font-semibold transition ${!formState.isIncome ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Expense</button>
                    </div>
                </div>
                <button onClick={handleAdd} className="w-full mt-3 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50" disabled={!formState.amount || !formState.description}>Add Recurring Entry</button>
            </div>
            
             {/* List */}
             <ul className="space-y-2 max-h-[35vh] overflow-y-auto pr-2">
                 {recurringEntries.map(entry => (
                    <li key={entry.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group">
                        {editingEntry?.id === entry.id ? (
                             <div className="space-y-2">
                                <input type="text" value={editingEntry.description} onChange={e => setEditingEntry({...editingEntry, description: e.target.value})} autoFocus className="w-full bg-white dark:bg-gray-600 border-2 border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                <div className="grid grid-cols-2 gap-2">
                                     <input type="text" inputMode="numeric" value={editingEntry.amount.toLocaleString()} onChange={handleEditAmountChange} className="w-full bg-white dark:bg-gray-600 border-2 border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                     <select value={editingEntry.frequency} onChange={e => setEditingEntry({...editingEntry, frequency: e.target.value as any})} className="w-full bg-white dark:bg-gray-600 border-2 border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 items-center">
                                     <div className="grid grid-cols-2 gap-1 flex-grow">
                                        <button onClick={() => setEditingEntry({...editingEntry, isIncome: true})} className={`py-1 rounded-md text-xs font-semibold transition ${editingEntry.isIncome ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Income</button>
                                        <button onClick={() => setEditingEntry({...editingEntry, isIncome: false})} className={`py-1 rounded-md text-xs font-semibold transition ${!editingEntry.isIncome ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Expense</button>
                                    </div>
                                    <button onClick={handleUpdate} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => setEditingEntry(null)} className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                             </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{entry.description}</p>
                                    <p className={`text-sm font-bold ${entry.isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {currencySymbol}{entry.amount.toLocaleString()} <span className="text-xs font-normal text-gray-500 dark:text-gray-400 capitalize">({entry.frequency})</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Next due: {new Date(entry.nextDueDate + 'T00:00:00').toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingEntry(entry)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                 ))}
                 {recurringEntries.length === 0 && <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No recurring transactions set up yet.</p>}
             </ul>
        </div>
    )
};


interface CategoryManagerProps {
    title: string;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ title, categories, setCategories }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ index: number; name: string; icon: string; } | null>(null);

    const handleAdd = () => {
        if (newCategoryName.trim() && !categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            setCategories(prev => [...prev, { name: newCategoryName.trim(), icon: newCategoryIcon.trim() || '🔖' }]);
            setNewCategoryName('');
            setNewCategoryIcon('');
        }
    };

    const handleDelete = (index: number) => {
        if (window.confirm(`Are you sure you want to delete "${categories[index].name}"? This cannot be undone.`)) {
            setCategories(prev => prev.filter((_, i) => i !== index));
            if (editingCategory?.index === index) {
                setEditingCategory(null);
            }
        }
    };
    
    const handleUpdate = () => {
        if (editingCategory && editingCategory.name.trim()) {
            if (categories.some((c, i) => c.name.toLowerCase() === editingCategory.name.trim().toLowerCase() && i !== editingCategory.index)) {
                 alert("A category with this name already exists.");
                 return;
            }
            setCategories(prev => {
                const updated = [...prev];
                updated[editingCategory.index] = {
                    name: editingCategory.name.trim(),
                    icon: editingCategory.icon.trim() || '🔖'
                };
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
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Icon"
                    className="w-16 text-center bg-gray-100 border-2 border-gray-200 rounded-lg py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <input 
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add new category"
                    className="flex-grow bg-gray-100 border-2 border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50" disabled={!newCategoryName.trim()}>Add</button>
            </div>
            <ul className="space-y-2 max-h-[35vh] overflow-y-auto pr-2">
                {categories.map((cat, index) => (
                    <li key={`${cat.name}-${index}`} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group">
                        {editingCategory?.index === index ? (
                            <div className="flex items-center gap-2 flex-grow">
                                <input
                                    type="text"
                                    value={editingCategory.icon}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                    className="w-14 text-center bg-white border-2 border-gray-300 rounded-md py-1 px-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                                />
                                <input 
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                    autoFocus
                                    className="flex-grow bg-white border-2 border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <span className="text-xl w-8 text-center">{cat.icon || '🔖'}</span>
                                <span className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                            </div>
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
                                    <button onClick={() => setEditingCategory({ index, name: cat.name, icon: cat.icon })} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md">
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
    incomeCategories: Category[];
    setIncomeCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    expenseCategories: Category[];
    setExpenseCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    recurringEntries: RecurringEntry[];
    setRecurringEntries: React.Dispatch<React.SetStateAction<RecurringEntry[]>>;
    budgetGoals: BudgetGoal[];
    setBudgetGoals: React.Dispatch<React.SetStateAction<BudgetGoal[]>>;
    currencySymbol: string;
    // Google Sync props
    isSignedIn: boolean;
    syncStatus: string;
    userInfo: any;
    spreadsheetId: string | null;
    onSignIn: () => void;
    onSignOut: () => void;
    onBackup: () => void;
    onExportData: () => void;
    onImportData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onSelectCurrency, selectedCurrency, 
    incomeCategories, setIncomeCategories, expenseCategories, setExpenseCategories,
    recurringEntries, setRecurringEntries, budgetGoals, setBudgetGoals, currencySymbol,
    isSignedIn, syncStatus, userInfo, spreadsheetId, onSignIn, onSignOut, onBackup,
    onExportData, onImportData
}) => {
    if (!isOpen) return null;
    const [activeTab, setActiveTab] = useState<'currency' | 'income' | 'expense' | 'recurring' | 'goals' | 'sync'>('currency');

    const renderContent = () => {
        switch (activeTab) {
            case 'sync':
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Google Sync & Backup</h3>
                        {!isSignedIn ? (
                            <div className="text-center">
                                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Connect your Google account to automatically save and sync your transactions to a private Google Sheet.</p>
                                <button 
                                    onClick={onSignIn} 
                                    className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition flex items-center justify-center gap-2 mx-auto"
                                >
                                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.536-11.088-8.108l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.566,44,31.2,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                                    <span>Connect with Google</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center gap-3">
                                    <img src={userInfo?.imageUrl} alt="User" className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{userInfo?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{userInfo?.email}</p>
                                    </div>
                                </div>
                                {spreadsheetId && (
                                     <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition">View Synced Sheet</a>
                                )}
                                <button onClick={onBackup} disabled={syncStatus === 'syncing'} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50">
                                    {syncStatus === 'syncing' ? 'Syncing...' : 'Create Manual Backup'}
                                </button>
                                <button onClick={onSignOut} className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-800 transition">Disconnect</button>
                            </div>
                        )}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                             <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Local Data Management</h3>
                             <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Save your data to a file on your device, or load data from a previously saved file. This does not use Google Sync.</p>
                             <div className="space-y-3">
                                <button onClick={onExportData} className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V5a1 1 0 112 0v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    <span>Export Data to File</span>
                                </button>
                                <button onClick={onImportData} className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 7.414V13a1 1 0 11-2 0V7.414L6.293 9.707z" clipRule="evenodd" /></svg>
                                    <span>Import Data from File</span>
                                </button>
                             </div>
                        </div>
                    </div>
                );
            case 'income':
                return <CategoryManager title="Income Categories" categories={incomeCategories} setCategories={setIncomeCategories} />;
            case 'expense':
                return <CategoryManager title="Expense Categories" categories={expenseCategories} setCategories={setExpenseCategories} />;
            case 'recurring':
                return <RecurringManager recurringEntries={recurringEntries} setRecurringEntries={setRecurringEntries} currencySymbol={currencySymbol} />;
            case 'goals':
                return <BudgetManager budgetGoals={budgetGoals} setBudgetGoals={setBudgetGoals} expenseCategories={expenseCategories} currencySymbol={currencySymbol} />;
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
    
    const TabButton: React.FC<{tab: 'currency' | 'income' | 'expense' | 'recurring' | 'goals' | 'sync', children: React.ReactNode}> = ({tab, children}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'bg-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
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
                 <div className="flex-shrink-0 px-2 border-b border-gray-200 dark:border-gray-700 flex justify-start overflow-x-auto">
                    <TabButton tab="currency">Currency</TabButton>
                    <TabButton tab="income">Income</TabButton>
                    <TabButton tab="expense">Expense</TabButton>
                    <TabButton tab="recurring">Recurring</TabButton>
                    <TabButton tab="goals">Goals</TabButton>
                    <TabButton tab="sync">Sync</TabButton>
                </div>
                <div className="flex-grow p-4 overflow-y-auto bg-white dark:bg-gray-800">
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

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(formatNumberInput(e.target.value));
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
  icon?: string;
}

const HistoryItem: React.FC<HistoryItemProps> = React.memo(({ entry, currencySymbol, onEdit, onDelete, icon }) => {
  const isIncome = entry.isIncome;
  const sign = isIncome ? '+' : '-';
  const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColorClass = isIncome ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50';

  return (
    <div className="flex items-center py-3 relative group">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColorClass} ${colorClass} font-bold text-lg flex-shrink-0`}>
        {icon ? <span className="text-xl">{icon}</span> : sign}
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
    incomeCategories: Category[];
    expenseCategories: Category[];
    handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setDescription: (desc: string) => void;
    handleAddEntry: (isIncome: boolean) => void;
    onEditEntry: (entry: Entry) => void;
    onDeleteEntry: (id: number) => void;
}

const PlannerPage: React.FC<PlannerPageProps> = ({
    entries, amount, description, error, currencySymbol, totalBalance, suggestionList,
    incomeCategories, expenseCategories,
    handleAmountChange, setDescription, handleAddEntry, onEditEntry, onDeleteEntry
}) => {
    const findIcon = useCallback((description: string, isIncome: boolean): string | undefined => {
        const list = isIncome ? incomeCategories : expenseCategories;
        const category = list.find(cat => cat.name.toLowerCase() === description.toLowerCase());
        return category?.icon;
    }, [incomeCategories, expenseCategories]);

    return (
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
                            icon={findIcon(entry.description, entry.isIncome)}
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
)};


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
    const { totalIncome, totalExpense, allTimeIncomeByCategory, allTimeExpenseByCategory } = useMemo(() => {
        const incomeEntries = entries.filter(e => e.isIncome);
        const expenseEntries = entries.filter(e => !e.isIncome);

        const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);
        const totalExpense = expenseEntries.reduce((sum, e) => sum + e.amount, 0);

        const groupByCategory = (entryList: Entry[]) => 
            entryList.reduce((acc, entry) => {
                acc[entry.description] = (acc[entry.description] || 0) + entry.amount;
                return acc;
            }, {} as Record<string, number>);

        const allTimeIncomeByCategory = Object.entries(groupByCategory(incomeEntries)).sort((a, b) => b[1] - a[1]);
        const allTimeExpenseByCategory = Object.entries(groupByCategory(expenseEntries)).sort((a, b) => b[1] - a[1]);
        
        return { totalIncome, totalExpense, allTimeIncomeByCategory, allTimeExpenseByCategory };
    }, [entries]);

    const { dailyIncome, dailyExpense } = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const todaysEntries = entries.filter(e => e.date === todayStr);
        const dailyIncome = todaysEntries.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);
        const dailyExpense = todaysEntries.filter(e => !e.isIncome).reduce((sum, e) => sum + e.amount, 0);
        return { dailyIncome, dailyExpense };
    }, [entries]);

    const weeklyChartData = useMemo(() => {
        const data: { name: string; income: number; expense: number }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-CA');
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dayEntries = entries.filter(e => e.date === dateStr);
            const income = dayEntries.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);
            const expense = dayEntries.filter(e => !e.isIncome).reduce((sum, e) => sum + e.amount, 0);

            data.push({ name: dayName, income, expense });
        }
        return data;
    }, [entries]);

    const { monthlyExpenseByCategory, totalMonthlyExpense } = useMemo(() => {
        const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
        const monthlyExpenses = entries.filter(e => !e.isIncome && e.date.slice(0, 7) === currentMonthStr);

        const totalMonthlyExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

        const groupByCategory = (entryList: Entry[]) => 
            entryList.reduce((acc, entry) => {
                acc[entry.description] = (acc[entry.description] || 0) + entry.amount;
                return acc;
            }, {} as Record<string, number>);

        const monthlyExpenseByCategory = Object.entries(groupByCategory(monthlyExpenses)).sort((a, b) => b[1] - a[1]);
        
        return { monthlyExpenseByCategory, totalMonthlyExpense };
    }, [entries]);

    const yearlyTrendData = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonthIndex = today.getMonth(); // 0-11

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const data = monthNames.slice(0, currentMonthIndex + 1).map(name => ({
            month: name,
            income: 0,
            expense: 0,
        }));

        const yearEntries = entries.filter(e => new Date(e.date).getFullYear() === currentYear);

        for (const entry of yearEntries) {
            const monthIndex = new Date(entry.date).getMonth();
            if (monthIndex <= currentMonthIndex) {
                if (entry.isIncome) {
                    data[monthIndex].income += entry.amount;
                } else {
                    data[monthIndex].expense += entry.amount;
                }
            }
        }
        
        return data;
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

            <div className="bg-blue-100 dark:bg-blue-900/60 p-4 rounded-2xl">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 text-center">Today's Summary</h3>
                <div className="flex justify-around items-center">
                     <div className="text-center">
                        <p className="text-xs text-green-700 dark:text-green-300">Income</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-200">{currencySymbol}{dailyIncome.toLocaleString()}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-xs text-red-700 dark:text-red-300">Expense</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-200">{currencySymbol}{dailyExpense.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Last 7 Days</h3>
                {weeklyChartData.some(d => d.income > 0 || d.expense > 0) ? (
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.75rem',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                    cursor={{ fill: 'rgba(209, 213, 219, 0.3)'}}
                                />
                                <Legend wrapperStyle={{fontSize: "12px"}}/>
                                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No activity in the last 7 days.</p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Year-to-Date Trend</h3>
                {yearlyTrendData.some(d => d.income > 0 || d.expense > 0) ? (
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <LineChart data={yearlyTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.75rem',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                    cursor={{ fill: 'rgba(209, 213, 219, 0.3)' }}
                                />
                                <Legend wrapperStyle={{fontSize: "12px"}}/>
                                <Line type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No data for this year yet.</p>
                )}
            </div>
            
            <BreakdownDisplay title="This Month's Spending" data={monthlyExpenseByCategory} total={totalMonthlyExpense} isIncome={false} currencySymbol={currencySymbol} />
            <BreakdownDisplay title="All-Time Income" data={allTimeIncomeByCategory} total={totalIncome} isIncome={true} currencySymbol={currencySymbol} />
            <BreakdownDisplay title="All-Time Expense" data={allTimeExpenseByCategory} total={totalExpense} isIncome={false} currencySymbol={currencySymbol} />
        </div>
    );
};

interface GoalsPageProps {
    entries: Entry[];
    budgetGoals: BudgetGoal[];
    currencySymbol: string;
    expenseCategories: Category[];
}

const GoalsPage: React.FC<GoalsPageProps> = ({ entries, budgetGoals, currencySymbol, expenseCategories }) => {
    const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

    const progressData = useMemo(() => {
        const currentMonthGoals = budgetGoals.filter(g => g.month === currentMonth);
        const currentMonthEntries = entries.filter(e => e.date.slice(0, 7) === currentMonth);
        
        const income = currentMonthEntries.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);
        const expenses = currentMonthEntries.filter(e => !e.isIncome).reduce((sum, e) => sum + e.amount, 0);

        return currentMonthGoals.map(goal => {
            let currentAmount = 0;
            if (goal.type === 'spending') {
                currentAmount = currentMonthEntries
                    .filter(e => !e.isIncome && e.description === goal.name)
                    .reduce((sum, e) => sum + e.amount, 0);
            } else { // saving
                currentAmount = income - expenses;
            }
            const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
            return {
                ...goal,
                currentAmount: Math.max(0, currentAmount), // savings can be negative, but show 0
                progress: Math.max(0, progress),
            };
        });
    }, [budgetGoals, entries, currentMonth]);

    const findIcon = useCallback((goalName: string) => {
        const category = expenseCategories.find(cat => cat.name === goalName);
        return category?.icon;
    }, [expenseCategories]);

    return (
        <div className="space-y-4 overflow-y-auto pb-24">
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">This Month's Goals</h2>
            {progressData.length > 0 ? (
                progressData.map(goal => {
                    const isSpending = goal.type === 'spending';
                    const isOverBudget = isSpending && goal.progress > 100;
                    const progressColor = isSpending ? (isOverBudget ? 'bg-red-500' : 'bg-blue-500') : 'bg-green-500';

                    return (
                        <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center mb-2">
                                <span className="text-xl w-8 text-center">{isSpending ? findIcon(goal.name) || '🎯' : '🌱'}</span>
                                <h3 className="ml-2 font-bold text-gray-800 dark:text-gray-100">{goal.name}</h3>
                            </div>
                            <div className="flex justify-between items-baseline text-sm mb-1">
                                <span className={`font-semibold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {currencySymbol}{goal.currentAmount.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Target: {currencySymbol}{goal.targetAmount.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div 
                                    className={`${progressColor} h-2.5 rounded-full transition-all duration-500`}
                                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                ></div>
                            </div>
                             {isOverBudget && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 text-right">You're over budget!</p>}
                        </div>
                    )
                })
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No goals set for this month.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Go to Settings {'>'} Goals to add one.</p>
                </div>
            )}
        </div>
    );
};

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

const SyncStatusIcon: React.FC<{ status: SyncStatus }> = ({ status }) => {
    const iconMap: Record<SyncStatus, React.ReactNode> = {
        idle: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
        syncing: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg>,
        synced: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>,
        error: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    };
    return <div className="p-2 rounded-full" title={`Sync status: ${status}`}>{iconMap[status]}</div>
};


// --- Main Application Component ---

const App: React.FC = () => {
    const [entries, setEntries] = useState<Entry[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-entries');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading entries from localStorage", error);
            return [];
        }
    });
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-currency');
            return saved ? JSON.parse(saved) : 'USD';
        } catch (error) {
            console.error("Error reading currency from localStorage", error);
            return 'USD';
        }
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<'planner' | 'dashboard' | 'goals'>('planner');
    
    const [incomeCategories, setIncomeCategories] = useState<Category[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-incomeCategories');
            return saved ? JSON.parse(saved) : defaultIncomeCategories;
        } catch (error) {
            console.error("Error reading income categories from localStorage", error);
            return defaultIncomeCategories;
        }
    });
    const [expenseCategories, setExpenseCategories] = useState<Category[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-expenseCategories');
            return saved ? JSON.parse(saved) : defaultExpenseCategories;
        } catch (error) {
            console.error("Error reading expense categories from localStorage", error);
            return defaultExpenseCategories;
        }
    });
    const [recurringEntries, setRecurringEntries] = useState<RecurringEntry[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-recurringEntries');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading recurring entries from localStorage", error);
            return [];
        }
    });
    const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-budgetGoals');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading budget goals from localStorage", error);
            return [];
        }
    });
    
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);

    // Google Sync State
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => localStorage.getItem('spreadsheetId'));
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [cloudEntries, setCloudEntries] = useState<Entry[] | null>(null);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'light';
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    
    // --- LocalStorage Persistence ---
    useEffect(() => {
        localStorage.setItem('incomePlanner-entries', JSON.stringify(entries));
    }, [entries]);

    useEffect(() => {
        localStorage.setItem('incomePlanner-currency', JSON.stringify(selectedCurrency));
    }, [selectedCurrency]);

    useEffect(() => {
        localStorage.setItem('incomePlanner-incomeCategories', JSON.stringify(incomeCategories));
    }, [incomeCategories]);

    useEffect(() => {
        localStorage.setItem('incomePlanner-expenseCategories', JSON.stringify(expenseCategories));
    }, [expenseCategories]);

    useEffect(() => {
        localStorage.setItem('incomePlanner-recurringEntries', JSON.stringify(recurringEntries));
    }, [recurringEntries]);
    
     useEffect(() => {
        localStorage.setItem('incomePlanner-budgetGoals', JSON.stringify(budgetGoals));
    }, [budgetGoals]);

    useEffect(() => {
        if (spreadsheetId) {
            localStorage.setItem('spreadsheetId', spreadsheetId);
        } else {
            localStorage.removeItem('spreadsheetId');
        }
    }, [spreadsheetId]);

    // --- Google API and GIS Initialization ---
     useEffect(() => {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
            (window as any).gapi.load('client', () => {
                if (!GOOGLE_API_KEY) {
                    console.error("Google API Key is missing.");
                    setSyncStatus('error');
                    return;
                }
                (window as any).gapi.client.init({
                    apiKey: GOOGLE_API_KEY,
                    discoveryDocs: DISCOVERY_DOCS,
                }).catch((err: any) => {
                    console.error("Error initializing GAPI client", err);
                    setSyncStatus('error');
                });
            });
        };
        document.body.appendChild(gapiScript);

        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
            if (!GOOGLE_CLIENT_ID) {
                console.error("Google Client ID is missing.");
                setSyncStatus('error');
                return;
            }
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: SCOPES,
                callback: async (tokenResponse: any) => {
                    if (tokenResponse.error) {
                        console.error('Google Auth Error:', tokenResponse.error);
                        setSyncStatus('error');
                        return;
                    }
                    const token = tokenResponse.access_token;
                    setAccessToken(token);
                    (window as any).gapi.client.setToken({ access_token: token });
                    
                    try {
                        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!res.ok) throw new Error('Failed to fetch user info');
                        const profile = await res.json();
                        setUserInfo({ name: profile.name, email: profile.email, imageUrl: profile.picture });
                    } catch (e) {
                        console.error("Could not fetch user info", e);
                    }
                },
            });
            setTokenClient(client);
        };
        document.body.appendChild(gisScript);

        return () => {
            document.body.removeChild(gapiScript);
            document.body.removeChild(gisScript);
        };
    }, []);

    const findOrCreateSpreadsheet = useCallback(async () => {
        let id = spreadsheetId;
        if (id) return id;
    
        try {
            const response = await (window as any).gapi.client.drive.files.list({
                q: `mimeType='application/vnd.google-apps.spreadsheet' and name='${SPREADSHEET_NAME}' and trashed=false`,
                fields: 'files(id, name)',
            });
    
            if (response.result.files.length > 0) {
                id = response.result.files[0].id;
            } else {
                const newSheet = await (window as any).gapi.client.sheets.spreadsheets.create({
                    properties: { title: SPREADSHEET_NAME },
                });
                id = newSheet.result.spreadsheetId;
                await (window as any).gapi.client.sheets.spreadsheets.values.append({
                    spreadsheetId: id,
                    range: 'A1:F1',
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [['ID', 'Amount', 'Description', 'IsIncome', 'Date', 'Time']] },
                });
            }
            setSpreadsheetId(id);
            return id;
        } catch (err) {
            console.error("Error finding or creating spreadsheet", err);
            setSyncStatus('error');
            return null;
        }
    }, [spreadsheetId]);
    
    const loadEntriesFromSheet = useCallback(async (sheetId: string) => {
        try {
            const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'A2:F',
            });
            const values = response.result.values || [];
            return values.map((row: any[]) => ({
                id: Number(row[0]),
                amount: parseFloat(row[1]),
                description: row[2],
                isIncome: row[3] === 'TRUE',
                date: row[4],
                time: row[5],
            })).filter(e => e.id && !isNaN(e.amount));
        } catch (err) {
            console.error("Error loading entries from sheet", err);
            setSyncStatus('error');
            return [];
        }
    }, []);

    const syncAllLocalEntriesToSheet = useCallback(async (sheetId: string) => {
        setSyncStatus('syncing');
        try {
            await (window as any).gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: sheetId,
                range: 'A2:F'
            });

            if (entries.length > 0) {
                 const values = entries.map(e => [e.id, e.amount, e.description, e.isIncome, e.date, e.time]);
                 await (window as any).gapi.client.sheets.spreadsheets.values.append({
                    spreadsheetId: sheetId,
                    range: 'A:F',
                    valueInputOption: 'USER_ENTERED',
                    resource: { values }
                });
            }
            setSyncStatus('synced');
        } catch (err) {
            console.error('Failed to sync all local entries to sheet', err);
            setSyncStatus('error');
        }
    }, [entries]);
    
    useEffect(() => {
        if (accessToken) {
            setSyncStatus('syncing');
            findOrCreateSpreadsheet().then(id => {
                if (id) {
                    loadEntriesFromSheet(id).then(sheetEntries => {
                        const localEntries = entries;
                        if (sheetEntries.length > 0 && localEntries.length > 0) {
                            setCloudEntries(sheetEntries);
                            setIsMergeModalOpen(true);
                        } else if (sheetEntries.length > 0) {
                            setEntries(sheetEntries);
                            setSyncStatus('synced');
                        } else if (localEntries.length > 0) {
                            syncAllLocalEntriesToSheet(id);
                        } else {
                            setSyncStatus('synced');
                        }
                    });
                }
            });
        }
    }, [accessToken, findOrCreateSpreadsheet, loadEntriesFromSheet, syncAllLocalEntriesToSheet, entries]);
    
    const handleSignIn = () => tokenClient?.requestAccessToken({ prompt: '' });
    
    const handleSignOut = () => {
        if (accessToken) {
            (window as any).google.accounts.oauth2.revoke(accessToken, () => {});
            setAccessToken(null);
            setUserInfo(null);
            setSyncStatus('idle');
            setSpreadsheetId(null);
        }
    };

    const handleCreateBackup = async () => {
        if (!spreadsheetId) {
            alert('Cannot create backup. No spreadsheet connected.');
            return;
        }
        setSyncStatus('syncing');
        const backupContent = JSON.stringify({
            entries,
            incomeCategories,
            expenseCategories,
            recurringEntries,
            selectedCurrency,
        }, null, 2);
        const fileName = `IncomePlanner_Backup_${new Date().toISOString().split('T')[0]}.json`;
        try {
            const fileMetadata = { name: fileName, mimeType: 'application/json' };
            const media = { mimeType: 'application/json', body: backupContent };
            await (window as any).gapi.client.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
            });
            alert(`Backup "${fileName}" created successfully in your Google Drive.`);
            setSyncStatus('synced');
        } catch (err) {
            console.error('Backup failed:', err);
            alert('Failed to create backup.');
            setSyncStatus('error');
        }
    };
    
    useEffect(() => {
        const processRecurring = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
    
            const newEntries: Entry[] = [];
            const updatedRecurringEntries = recurringEntries.map(recurring => {
                let nextDueDate = new Date(recurring.nextDueDate + 'T00:00:00');
                let updatedRecurring = { ...recurring };
    
                while (nextDueDate <= today) {
                    const newEntry = {
                        id: Date.now() + Math.random(),
                        amount: recurring.amount,
                        description: recurring.description,
                        isIncome: recurring.isIncome,
                        date: nextDueDate.toLocaleDateString('en-CA'),
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    };
                    newEntries.push(newEntry);
    
                    if (recurring.frequency === 'daily') {
                        nextDueDate.setDate(nextDueDate.getDate() + 1);
                    } else if (recurring.frequency === 'weekly') {
                        nextDueDate.setDate(nextDueDate.getDate() + 7);
                    } else if (recurring.frequency === 'monthly') {
                        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                    }
                }
                
                updatedRecurring.nextDueDate = nextDueDate.toISOString().split('T')[0];
                return updatedRecurring;
            });
            
            if (newEntries.length > 0) {
                setEntries(prev => [...prev, ...newEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
                setRecurringEntries(updatedRecurringEntries);

                if (accessToken && spreadsheetId) {
                    setSyncStatus('syncing');
                    const values = newEntries.map(e => [e.id, e.amount, e.description, e.isIncome, e.date, e.time]);
                     (window as any).gapi.client.sheets.spreadsheets.values.append({
                        spreadsheetId, range: 'A:F', valueInputOption: 'USER_ENTERED', resource: { values }
                    }).then(() => setSyncStatus('synced')).catch(() => setSyncStatus('error'));
                }
            }
        };
    
        processRecurring();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    useEffect(() => {
        const htmlElement = document.documentElement;
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
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
        const combined = [...expenseCategories.map(c => c.name), ...uniqueRecent];
        return [...new Set(combined)];
    }, [entries, expenseCategories]);
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumberInput(e.target.value);
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
        if (accessToken && spreadsheetId) {
            setSyncStatus('syncing');
            const values = [[newEntry.id, newEntry.amount, newEntry.description, newEntry.isIncome, newEntry.date, newEntry.time]];
            (window as any).gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId, range: 'A:F', valueInputOption: 'USER_ENTERED', resource: { values }
            }).then(() => setSyncStatus('synced')).catch(() => setSyncStatus('error'));
        }

        setAmount('');
        setDescription('');
        setError('');
    }, [amount, description, accessToken, spreadsheetId]);

    const handleSelectCurrency = (currencyCode: string) => {
        setSelectedCurrency(currencyCode);
    };
    
    const handleDeleteEntry = (id: number) => {
        if (window.confirm("Are you sure you want to delete this transaction?")) {
            setEntries(prev => prev.filter(e => e.id !== id));
            if (accessToken && spreadsheetId) {
                setSyncStatus('syncing');
                (window as any).gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A:A' })
                    .then((res: any) => {
                        const rowIndex = res.result.values.findIndex((row: any[]) => Number(row[0]) === id);
                        if (rowIndex !== -1) {
                            const deleteRequest = {
                                requests: [{ deleteDimension: { range: { sheetId: 0, dimension: 'ROWS', startIndex: rowIndex + 1, endIndex: rowIndex + 2 }}}]
                            };
                            (window as any).gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId, resource: deleteRequest })
                                .then(() => setSyncStatus('synced'))
                                .catch(() => setSyncStatus('error'));
                        } else {
                            setSyncStatus('synced');
                        }
                    }).catch(() => setSyncStatus('error'));
            }
        }
    };

    const handleOpenEditModal = (entry: Entry) => {
        setEntryToEdit(entry);
        setIsEditModalOpen(true);
    };

    const handleUpdateEntry = (updatedEntry: Entry) => {
        setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
         if (accessToken && spreadsheetId) {
            setSyncStatus('syncing');
             (window as any).gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'A:F' })
                .then((res: any) => {
                    const rowIndex = res.result.values.findIndex((row: any[]) => Number(row[0]) === updatedEntry.id);
                    if (rowIndex !== -1) {
                        const range = `A${rowIndex + 2}:F${rowIndex + 2}`;
                        const values = [[updatedEntry.id, updatedEntry.amount, updatedEntry.description, updatedEntry.isIncome, updatedEntry.date, updatedEntry.time]];
                        (window as any).gapi.client.sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', resource: { values } })
                           .then(() => setSyncStatus('synced'))
                           .catch(() => setSyncStatus('error'));
                    } else {
                         const values = [[updatedEntry.id, updatedEntry.amount, updatedEntry.description, updatedEntry.isIncome, updatedEntry.date, updatedEntry.time]];
                        (window as any).gapi.client.sheets.spreadsheets.values.append({
                            spreadsheetId, range: 'A:F', valueInputOption: 'USER_ENTERED', resource: { values }
                        }).then(() => setSyncStatus('synced')).catch(() => setSyncStatus('error'));
                    }
                }).catch(() => setSyncStatus('error'));
        }
        setIsEditModalOpen(false);
        setEntryToEdit(null);
    };

    const currencySymbol = currencySymbols[selectedCurrency] ?? '$';
    
    // --- Merge Modal Handlers ---
    const handleKeepCloud = () => {
        if (cloudEntries) setEntries(cloudEntries);
        setIsMergeModalOpen(false);
        setCloudEntries(null);
        setSyncStatus('synced');
    };
    
    const handleKeepLocal = () => {
        if (spreadsheetId) syncAllLocalEntriesToSheet(spreadsheetId);
        setIsMergeModalOpen(false);
        setCloudEntries(null);
    };

    const handleMerge = async () => {
        if (cloudEntries && spreadsheetId) {
            setSyncStatus('syncing');
            const cloudIds = new Set(cloudEntries.map(e => e.id));
            const localOnlyEntries = entries.filter(e => !cloudIds.has(e.id));
    
            const mergedEntries = [...cloudEntries, ...localOnlyEntries];
            setEntries(mergedEntries);
    
            if (localOnlyEntries.length > 0) {
                 const values = localOnlyEntries.map(e => [e.id, e.amount, e.description, e.isIncome, e.date, e.time]);
                 try {
                    await (window as any).gapi.client.sheets.spreadsheets.values.append({
                        spreadsheetId, range: 'A:F', valueInputOption: 'USER_ENTERED', resource: { values }
                    });
                    setSyncStatus('synced');
                 } catch(e) {
                     setSyncStatus('error');
                 }
            } else {
                setSyncStatus('synced');
            }
        }
        setIsMergeModalOpen(false);
        setCloudEntries(null);
    };

    const handleExportData = useCallback(() => {
        try {
            const dataToExport = {
                entries,
                selectedCurrency,
                incomeCategories,
                expenseCategories,
                recurringEntries,
                budgetGoals,
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `income-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
        } catch (error) {
            console.error("Failed to export data", error);
            alert("An error occurred while exporting your data.");
        }
    }, [entries, selectedCurrency, incomeCategories, expenseCategories, recurringEntries, budgetGoals]);

    const handleImportData = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    alert('Could not read file content.');
                    return;
                }
                try {
                    const data = JSON.parse(text);
                    if (!data.entries || !data.selectedCurrency || !data.incomeCategories || !data.expenseCategories) {
                        throw new Error("Invalid or corrupted data file.");
                    }
                    if (window.confirm("Are you sure you want to import this data? This will overwrite all current local data.")) {
                        setEntries(data.entries || []);
                        setSelectedCurrency(data.selectedCurrency || 'USD');
                        setIncomeCategories(data.incomeCategories || defaultIncomeCategories);
                        setExpenseCategories(data.expenseCategories || defaultExpenseCategories);
                        setRecurringEntries(data.recurringEntries || []);
                        setBudgetGoals(data.budgetGoals || []);
                        alert("Data imported successfully!");
                    }
                } catch (error) {
                    console.error("Failed to import data", error);
                    alert(`An error occurred while importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            };
            reader.onerror = () => alert('Error reading the file.');
            reader.readAsText(file);
        };
        input.click();
    }, [setEntries, setSelectedCurrency, setIncomeCategories, setExpenseCategories, setRecurringEntries, setBudgetGoals]);

    const renderPage = () => {
        switch (currentPage) {
            case 'planner':
                return <PlannerPage
                    entries={entries}
                    amount={amount}
                    description={description}
                    error={error}
                    currencySymbol={currencySymbol}
                    totalBalance={totalBalance}
                    suggestionList={suggestionList}
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    handleAmountChange={handleAmountChange}
                    setDescription={setDescription}
                    handleAddEntry={handleAddEntry}
                    onEditEntry={handleOpenEditModal}
                    onDeleteEntry={handleDeleteEntry}
                />;
            case 'dashboard':
                return <DashboardPage entries={entries} currencySymbol={currencySymbol} />;
            case 'goals':
                return <GoalsPage entries={entries} budgetGoals={budgetGoals} currencySymbol={currencySymbol} expenseCategories={expenseCategories} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col">
            <header className="bg-white dark:bg-gray-800/80 dark:backdrop-blur-sm dark:border-b dark:border-gray-700 shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 capitalize">
                        {currentPage === 'planner' ? 'Income Planner' : currentPage}
                    </h1>
                    <div className="flex items-center gap-2">
                        {tokenClient && <SyncStatusIcon status={syncStatus} />}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 max-w-md mx-auto w-full flex flex-col">
                {renderPage()}
            </main>
            
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-10">
                <div className="flex justify-around">
                    <button onClick={() => setCurrentPage('planner')} className={`flex-1 py-3 text-center transition-colors ${currentPage === 'planner' ? 'text-blue-500 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        Planner
                    </button>
                    <button onClick={() => setCurrentPage('dashboard')} className={`flex-1 py-3 text-center transition-colors ${currentPage === 'dashboard' ? 'text-blue-500 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        Dashboard
                    </button>
                    <button onClick={() => setCurrentPage('goals')} className={`flex-1 py-3 text-center transition-colors ${currentPage === 'goals' ? 'text-blue-500 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        Goals
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
                recurringEntries={recurringEntries}
                setRecurringEntries={setRecurringEntries}
                budgetGoals={budgetGoals}
                setBudgetGoals={setBudgetGoals}
                currencySymbol={currencySymbol}
                isSignedIn={!!accessToken}
                syncStatus={syncStatus}
                userInfo={userInfo}
                spreadsheetId={spreadsheetId}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                onBackup={handleCreateBackup}
                onExportData={handleExportData}
                onImportData={handleImportData}
            />

            <EditEntryModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                entry={entryToEdit}
                onSave={handleUpdateEntry}
                currencySymbol={currencySymbol}
            />

            <MergeDataModal
                isOpen={isMergeModalOpen}
                onKeepCloud={handleKeepCloud}
                onKeepLocal={handleKeepLocal}
                onMerge={handleMerge}
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
