
// FIX: Corrected React import statement. The previous syntax was invalid.
import React from 'react';
import type { Entry, CurrencySymbols, Category, RecurringEntry, BudgetGoal } from './types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';

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

interface BudgetManagerProps {
    budgetGoals: BudgetGoal[];
    setBudgetGoals: React.Dispatch<React.SetStateAction<BudgetGoal[]>>;
    expenseCategories: Category[];
    currencySymbol: string;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgetGoals, setBudgetGoals, expenseCategories, currencySymbol }) => {
    // FIX: Replaced `aistudiocdn` with `React`
    const currentMonth = React.useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

    // FIX: Replaced `aistudiocdn` with `React`
    const [formState, setFormState] = React.useState({
        type: 'spending' as 'spending' | 'saving',
        name: expenseCategories.length > 0 ? expenseCategories[0].name : '',
        customName: 'Monthly Savings',
        targetAmount: '',
    });

    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
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
    // FIX: Replaced `aistudiocdn` with `React`
    const [formState, setFormState] = React.useState({
        amount: '',
        description: '',
        isIncome: true,
        frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
        startDate: new Date().toISOString().split('T')[0],
    });
    // FIX: Replaced `aistudiocdn` with `React`
    const [editingEntry, setEditingEntry] = React.useState<RecurringEntry | null>(null);
    
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
    // FIX: Replaced `aistudiocdn` with `React`
    const [newCategoryName, setNewCategoryName] = React.useState('');
    // FIX: Replaced `aistudiocdn` with `React`
    const [newCategoryIcon, setNewCategoryIcon] = React.useState('');
    // FIX: Replaced `aistudiocdn` with `React`
    const [editingCategory, setEditingCategory] = React.useState<{ index: number; name: string; icon: string; } | null>(null);

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
    onExportData: () => void;
    onImportFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClearAllData: () => void;
    userProfile: { name: string; email: string; picture: string; } | null;
    onGoogleSignIn: () => void;
    onGoogleSignOut: () => void;
    syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
    isGoogleSyncConfigured: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onSelectCurrency, selectedCurrency, 
    incomeCategories, setIncomeCategories, expenseCategories, setExpenseCategories,
    recurringEntries, setRecurringEntries, budgetGoals, setBudgetGoals, currencySymbol,
    onExportData, onImportFileSelect, onClearAllData,
    userProfile, onGoogleSignIn, onGoogleSignOut, syncStatus, isGoogleSyncConfigured,
}) => {
    if (!isOpen) return null;
    // FIX: Replaced `aistudiocdn` with `React`
    const [activeTab, setActiveTab] = React.useState<'currency' | 'income' | 'expense' | 'recurring' | 'goals' | 'sync'>('currency');

    const SyncStatusIndicator: React.FC = () => {
        if (!userProfile) return null;

        const statusConfig = {
            syncing: {
                icon: <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
                text: 'Syncing...',
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
            },
            synced: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
                text: 'Data is up to date',
                color: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300'
            },
            error: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
                text: 'Sync failed. Retrying...',
                color: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
            },
            idle: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>,
                text: 'Changes will sync automatically',
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            },
        };

        const currentStatus = statusConfig[syncStatus];
        
        return (
             <div className={`p-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium mb-4 ${currentStatus.color}`}>
                {currentStatus.icon}
                <span>{currentStatus.text}</span>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'sync':
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Google Sync & Backup</h3>
                        
                        {isGoogleSyncConfigured ? (
                            <>
                                <SyncStatusIndicator/>

                                <div className="text-center p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                    {userProfile ? (
                                        <div className="flex flex-col items-center">
                                            <img src={userProfile.picture} alt="Profile" className="w-16 h-16 rounded-full mb-3" referrerPolicy="no-referrer" />
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{userProfile.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{userProfile.email}</p>
                                            <button 
                                                onClick={onGoogleSignOut}
                                                className="px-6 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg text-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Connect your Google account to automatically back up and sync your data to a private Google Sheet.</p>
                                            <button
                                                onClick={onGoogleSignIn}
                                                className="px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.536-11.088-8.108l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.566,44,31.2,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                                                <span>Connect with Google</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="text-center mt-4">
                                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Privacy Policy</a>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-lg border border-yellow-200 dark:border-yellow-800/60">
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Feature Not Configured</h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    The Google Sync feature requires setup by an administrator. The Google Client ID is missing.
                                </p>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                             <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">Local Data Management</h3>
                             <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Manage your locally stored app data. This does not affect any data synced with Google.</p>
                             <div className="space-y-3">
                                <button onClick={onExportData} className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V5a1 1 0 112 0v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    <span>Export Transactions (CSV)</span>
                                </button>
                                <label
                                    htmlFor="import-data-file"
                                    className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 7.414V13a1 1 0 11-2 0V7.414L6.293 9.707z" clipRule="evenodd" /></svg>
                                    <span>Import Transactions (CSV)</span>
                                </label>
                                <input
                                    id="import-data-file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={onImportFileSelect}
                                />
                                <button onClick={onClearAllData} className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    <span>Clear All Local Data</span>
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
    // FIX: Replaced `aistudiocdn` with `React`
    const [amount, setAmount] = React.useState('');
    // FIX: Replaced `aistudiocdn` with `React`
    const [description, setDescription] = React.useState('');
    // FIX: Replaced `aistudiocdn` with `React`
    const [isIncome, setIsIncome] = React.useState(true);

    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
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
    // FIX: Replaced `aistudiocdn` with `React`
    const [showSuggestions, setShowSuggestions] = React.useState(false);

    const findIcon = React.useCallback((description: string, isIncome: boolean): string | undefined => {
        const list = isIncome ? incomeCategories : expenseCategories;
        const category = list.find(cat => cat.name.toLowerCase() === description.toLowerCase());
        return category?.icon;
    }, [incomeCategories, expenseCategories]);

    const filteredSuggestions = React.useMemo(() => 
        description 
            ? suggestionList.filter(s => 
                s.toLowerCase().includes(description.toLowerCase()) && s.toLowerCase() !== description.toLowerCase()
            ) 
            : suggestionList,
    [suggestionList, description]);

    return (
    <>
        <div className="flex-grow flex flex-col">
            {entries.length > 0 ? (
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4 overflow-hidden flex flex-col">
                   <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 pr-2">
                     {entries.map(entry => (
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
                <div className="mt-4 animate-fade-in relative">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Description (e.g., Salary, Groceries)"
                        className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                        autoComplete="off"
                    />
                     {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-40 overflow-y-auto z-20 animate-fade-in-fast">
                            {filteredSuggestions.map(s => (
                                <div
                                    key={s}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setDescription(s);
                                        setShowSuggestions(false);
                                    }}
                                    className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
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
    // FIX: Replaced `aistudiocdn` with `React`
    const chartData = React.useMemo(() => data.map(([name, value]) => ({ name, value })), [data]);
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
    // FIX: Replaced `aistudiocdn` with `React`
    const { totalIncome, totalExpense, allTimeIncomeByCategory, allTimeExpenseByCategory } = React.useMemo(() => {
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

    // FIX: Replaced `aistudiocdn` with `React`
    const { dailyIncome, dailyExpense } = React.useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const todaysEntries = entries.filter(e => e.date === todayStr);
        const dailyIncome = todaysEntries.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);
        const dailyExpense = todaysEntries.filter(e => !e.isIncome).reduce((sum, e) => sum + e.amount, 0);
        return { dailyIncome, dailyExpense };
    }, [entries]);

    // FIX: Replaced `aistudiocdn` with `React`
    const weeklyChartData = React.useMemo(() => {
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

    // FIX: Replaced `aistudiocdn` with `React`
    const { monthlyExpenseByCategory, totalMonthlyExpense } = React.useMemo(() => {
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

    // FIX: Replaced `aistudiocdn` with `React`
    const yearlyTrendData = React.useMemo(() => {
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
    // FIX: Replaced `aistudiocdn` with `React`
    const currentMonth = React.useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

    // FIX: Replaced `aistudiocdn` with `React`
    const progressData = React.useMemo(() => {
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

    // FIX: Replaced `aistudiocdn` with `React`
    const findIcon = React.useCallback((goalName: string) => {
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

// --- Main Application Component ---

const App: React.FC = () => {
    // FIX: Replaced `aistudiocdn` with `React`
    const [entries, setEntries] = React.useState<Entry[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-entries');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading entries from localStorage", error);
            return [];
        }
    });
    // FIX: Replaced `aistudiocdn` with `React`
    const [amount, setAmount] = React.useState<string>('');
    // FIX: Replaced `aistudiocdn` with `React`
    const [description, setDescription] = React.useState<string>('');
    // FIX: Replaced `aistudiocdn` with `React`
    const [selectedCurrency, setSelectedCurrency] = React.useState<string>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-currency');
            return saved ? JSON.parse(saved) : 'USD';
        } catch (error) {
            console.error("Error reading currency from localStorage", error);
            return 'USD';
        }
    });
    // FIX: Replaced `aistudiocdn` with `React`
    const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
    // FIX: Replaced `aistudiocdn` with `React`
    const [error, setError] = React.useState<string>('');
    // FIX: Replaced `aistudiocdn` with `React`
    const [currentPage, setCurrentPage] = React.useState<'planner' | 'dashboard' | 'goals'>('dashboard');
    
    // FIX: Replaced `aistudiocdn` with `React`
    const [incomeCategories, setIncomeCategories] = React.useState<Category[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-incomeCategories');
            return saved ? JSON.parse(saved) : defaultIncomeCategories;
        } catch (error) {
            console.error("Error reading income categories from localStorage", error);
            return defaultIncomeCategories;
        }
    });
    // FIX: Replaced `aistudiocdn` with `React`
    const [expenseCategories, setExpenseCategories] = React.useState<Category[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-expenseCategories');
            return saved ? JSON.parse(saved) : defaultExpenseCategories;
        } catch (error) {
            console.error("Error reading expense categories from localStorage", error);
            return defaultExpenseCategories;
        }
    });
    // FIX: Replaced `aistudiocdn` with `React`
    const [recurringEntries, setRecurringEntries] = React.useState<RecurringEntry[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-recurringEntries');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading recurring entries from localStorage", error);
            return [];
        }
    });
    // FIX: Replaced `aistudiocdn` with `React`
    const [budgetGoals, setBudgetGoals] = React.useState<BudgetGoal[]>(() => {
        try {
            const saved = localStorage.getItem('incomePlanner-budgetGoals');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading budget goals from localStorage", error);
            return [];
        }
    });
    
    // FIX: Replaced `aistudiocdn` with `React`
    const [isEditModalOpen, setIsEditModalOpen] = React.useState<boolean>(false);
    // FIX: Replaced `aistudiocdn` with `React`
    const [entryToEdit, setEntryToEdit] = React.useState<Entry | null>(null);

    // FIX: Replaced `aistudiocdn` with `React`
    const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'light';
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // --- Google State & Configuration ---
    // The Client ID is required for Google Sign-In. It is safe to be public.
    const googleClientId = "368572319708-ilhc8di33bkvnt01rg88kfmfce38bifr.apps.googleusercontent.com";

    // --- ACTION REQUIRED ---
    // For Google Sheets sync to work, you must replace the placeholder value below with your actual Google API Key.
    // Get an API Key from the Google Cloud Console. See the administrator guide for instructions.
    // The sign-in button will work without this, but data syncing will fail until the key is provided.
    // FIX: Explicitly type GOOGLE_API_KEY as string to prevent TypeScript errors
    // when comparing it to the placeholder string literal in subsequent checks.
    const GOOGLE_API_KEY: string = "AIzaSyCuUSQNbKUX_2OYeuaZLLJgG2de8prd54c";

    const isGoogleSyncConfigured = !!googleClientId;
    const [tokenClient, setTokenClient] = React.useState<any>(null);
    const [userProfile, setUserProfile] = React.useState<{ name: string; email: string; picture: string; } | null>(null);
    const [accessToken, setAccessToken] = React.useState<string | null>(null);
    const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [spreadsheetId, setSpreadsheetId] = React.useState<string | null>(() => localStorage.getItem('incomePlanner-spreadsheetId'));


    // --- Google Handlers & Effects ---
    const handleGoogleSignOut = React.useCallback(() => {
        if (accessToken) {
            window.google?.accounts?.oauth2.revoke(accessToken, () => {});
        }
        setAccessToken(null);
        setUserProfile(null);
        setSpreadsheetId(null);
        localStorage.removeItem('incomePlanner-spreadsheetId');
    }, [accessToken]);

    React.useEffect(() => {
        const initializeGsi = () => {
            if (window.google && googleClientId) {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: googleClientId,
                    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
                    callback: async (tokenResponse: any) => {
                        if (tokenResponse.access_token) {
                            setAccessToken(tokenResponse.access_token);
                            try {
                                const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
                                });
                                if (!response.ok) throw new Error('Failed to fetch user info.');
                                const profile = await response.json();
                                setUserProfile({ name: profile.name, email: profile.email, picture: profile.picture });
                            } catch (error) {
                                console.error("Error fetching user profile:", error);
                                handleGoogleSignOut();
                            }
                        }
                    },
                });
                setTokenClient(client);
            }
        };

        if (!isGoogleSyncConfigured) return;

        if (window.google) {
            initializeGsi();
        } else {
            const gsiScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (gsiScript) {
                gsiScript.addEventListener('load', initializeGsi);
            }
        }
    }, [googleClientId, handleGoogleSignOut, isGoogleSyncConfigured]);

    React.useEffect(() => {
        const initializeGapi = async () => {
            if (window.gapi && accessToken && GOOGLE_API_KEY !== "PASTE_YOUR_GOOGLE_API_KEY_HERE") {
                 await new Promise((resolve) => window.gapi.load('client', resolve));
                 await window.gapi.client.init({
                    apiKey: GOOGLE_API_KEY,
                    discoveryDocs: [
                        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
                        "https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest"
                    ],
                });
                window.gapi.client.setToken({ access_token: accessToken });
            }
        };
        initializeGapi();
    }, [accessToken, GOOGLE_API_KEY]);

    const handleGoogleSignIn = React.useCallback(() => {
        if (tokenClient) tokenClient.requestAccessToken();
    }, [tokenClient]);

    // --- Background Sync Logic ---
    const syncData = React.useCallback(async () => {
        if (!accessToken || !window.gapi?.client?.sheets || !isGoogleSyncConfigured || GOOGLE_API_KEY === "PASTE_YOUR_GOOGLE_API_KEY_HERE") {
             if (GOOGLE_API_KEY === "PASTE_YOUR_GOOGLE_API_KEY_HERE" && accessToken) {
                console.error("Google Sync stopped: API Key is missing.");
                setSyncStatus('error');
            }
            return;
        }

        setSyncStatus('syncing');
        try {
            let sheetId = spreadsheetId;
            if (!sheetId) {
                const fileListResponse = await window.gapi.client.drive.files.list({
                    q: "name='IncomeExpenseAppData' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
                    fields: 'files(id)',
                });
                if (fileListResponse.result.files && fileListResponse.result.files.length > 0) {
                    sheetId = fileListResponse.result.files[0].id!;
                } else {
                    const createResponse = await window.gapi.client.sheets.spreadsheets.create({
                        properties: { title: 'IncomeExpenseAppData' },
                        sheets: [{
                            properties: { title: 'Transactions' },
                            data: [{ rowData: [{ values: [
                                { userEnteredValue: { stringValue: 'ID' } },
                                { userEnteredValue: { stringValue: 'Date' } },
                                { userEnteredValue: { stringValue: 'Time' } },
                                { userEnteredValue: { stringValue: 'Type' } },
                                { userEnteredValue: { stringValue: 'Amount' } },
                                { userEnteredValue: { stringValue: 'Description' } },
                            ]}]}]
                        }]
                    });
                    sheetId = createResponse.result.spreadsheetId!;
                }
                setSpreadsheetId(sheetId);
                localStorage.setItem('incomePlanner-spreadsheetId', sheetId);
            }
            
            const existingIdsResponse = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: 'Transactions!A2:A',
            });
            const existingIds = new Set(existingIdsResponse.result.values?.flat().map(id => Number(id)) || []);

            const newEntries = entries.filter(entry => !existingIds.has(entry.id));

            if (newEntries.length === 0) {
                setSyncStatus('synced');
                return;
            }

            const rowsToAppend = newEntries.map(entry => [
                entry.id, entry.date, entry.time, entry.isIncome ? 'Income' : 'Expense', entry.amount, entry.description
            ]);
            
            await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: 'Transactions!A:F',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: rowsToAppend },
            });

            setSyncStatus('synced');
        } catch (error: any) {
            console.error("Google Sheets sync failed:", error);
            if (error.result?.error?.code === 401) handleGoogleSignOut();
            setSyncStatus('error');
        }
    }, [accessToken, entries, spreadsheetId, handleGoogleSignOut, isGoogleSyncConfigured, GOOGLE_API_KEY]);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            if (accessToken) syncData();
        }, 2000);
        return () => clearTimeout(handler);
    }, [entries, accessToken, syncData]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (accessToken) syncData();
        }, 60000);
        return () => clearInterval(interval);
    }, [accessToken, syncData]);


    // --- LocalStorage Persistence ---
    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
        localStorage.setItem('incomePlanner-entries', JSON.stringify(entries));
    }, [entries]);

    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
        localStorage.setItem('incomePlanner-currency', JSON.stringify(selectedCurrency));
    }, [selectedCurrency]);

    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
        localStorage.setItem('incomePlanner-incomeCategories', JSON.stringify(incomeCategories));
    }, [incomeCategories]);

    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
        localStorage.setItem('incomePlanner-expenseCategories', JSON.stringify(expenseCategories));
    }, [expenseCategories]);

    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
        localStorage.setItem('incomePlanner-recurringEntries', JSON.stringify(recurringEntries));
    }, [recurringEntries]);
    
     // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
        localStorage.setItem('incomePlanner-budgetGoals', JSON.stringify(budgetGoals));
    }, [budgetGoals]);
    
    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
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
            }
        };
    
        processRecurring();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // FIX: Replaced `aistudiocdn` with `React`
    React.useEffect(() => {
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

    // FIX: Replaced `aistudiocdn` with `React`
    const totalBalance = React.useMemo(() => {
        return entries.reduce((sum, entry) => {
            return sum + (entry.isIncome ? entry.amount : -entry.amount);
        }, 0);
    }, [entries]);

    // FIX: Replaced `aistudiocdn` with `React`
    const suggestionList = React.useMemo(() => {
        const recentDescriptions = entries
            .slice(-10)
            .reverse()
            .map(e => e.description);
        const uniqueRecent = [...new Set(recentDescriptions)];
        const allCategories = [...incomeCategories.map(c => c.name), ...expenseCategories.map(c => c.name)];
        const combined = [...allCategories, ...uniqueRecent];
        return [...new Set(combined)];
    }, [entries, incomeCategories, expenseCategories]);
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumberInput(e.target.value);
        setAmount(formatted);
    };

    // FIX: Replaced `aistudiocdn` with `React`
    const handleAddEntry = React.useCallback((isIncome: boolean) => {
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

    const handleExportData = React.useCallback(() => {
        if (entries.length === 0) {
            alert("No transaction data to export.");
            return;
        }

        try {
            const header = ['id', 'amount', 'description', 'isIncome', 'date', 'time'];
            
            const escapeCsvField = (field: any): string => {
                const stringField = String(field);
                if (stringField.includes(',')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            };

            const rows = entries.map(e => 
                [e.id, e.amount, escapeCsvField(e.description), e.isIncome, e.date, e.time].join(',')
            );

            const csvContent = [header.join(','), ...rows].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `income-planner-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Failed to export data", error);
            alert("An error occurred while exporting your data.");
        }
    }, [entries]);

    const handleImportFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                alert('Could not read file content.');
                return;
            }
            try {
                const rows = text.split('\n').filter(row => row.trim() !== '');
                if (rows.length < 2) {
                    throw new Error("CSV file is empty or contains only a header.");
                }

                const header = rows[0].trim().split(',');
                if (header[0] !== 'id' || header[1] !== 'amount' || header[3] !== 'isIncome') {
                    throw new Error("Invalid CSV file format. Please use a file exported from this app.");
                }
                
                const importedEntries: Entry[] = rows.slice(1).map(row => {
                    const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
                    const cleanValues = values.map(v => v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1).replace(/""/g, '"') : v);
                    
                    const entry: Entry = {
                        id: Number(cleanValues[0]),
                        amount: Number(cleanValues[1]),
                        description: cleanValues[2] || '',
                        isIncome: cleanValues[3] === 'true',
                        date: cleanValues[4] || '',
                        time: cleanValues[5] || '',
                    };

                    if (isNaN(entry.id) || isNaN(entry.amount) || !entry.date || !entry.time) {
                        throw new Error(`Skipping invalid row: ${row}`);
                    }
                    return entry;
                });

                if (importedEntries.length === 0) {
                    throw new Error("No valid transactions found in the file.");
                }

                if (window.confirm(`Are you sure you want to import ${importedEntries.length} transactions? This will REPLACE all current transaction data.`)) {
                    setEntries(importedEntries);
                    alert("Transactions imported successfully!");
                }
            } catch (error) {
                console.error("Failed to import data", error);
                alert(`An error occurred while importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        reader.onerror = () => alert('Error reading the file.');
        reader.readAsText(file);
        
        event.target.value = '';
    }, [setEntries]);

    const handleClearAllData = () => {
        if (window.confirm("Are you absolutely sure you want to delete all local data? This includes all transactions, categories, goals, and recurring entries. This action cannot be undone.")) {
            setEntries([]);
            setIncomeCategories(defaultIncomeCategories);
            setExpenseCategories(defaultExpenseCategories);
            setRecurringEntries([]);
            setBudgetGoals([]);
            setSpreadsheetId(null);

            localStorage.removeItem('incomePlanner-entries');
            localStorage.removeItem('incomePlanner-incomeCategories');
            localStorage.removeItem('incomePlanner-expenseCategories');
            localStorage.removeItem('incomePlanner-recurringEntries');
            localStorage.removeItem('incomePlanner-budgetGoals');
            localStorage.removeItem('incomePlanner-spreadsheetId');

            alert("All local data has been cleared.");
            setIsSettingsOpen(false);
        }
    };

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
                onExportData={handleExportData}
                onImportFileSelect={handleImportFileChange}
                onClearAllData={handleClearAllData}
                userProfile={userProfile}
                onGoogleSignIn={handleGoogleSignIn}
                onGoogleSignOut={handleGoogleSignOut}
                syncStatus={syncStatus}
                isGoogleSyncConfigured={isGoogleSyncConfigured}
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
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-fast { animation: fade-in-fast 0.15s ease-out forwards; }
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
