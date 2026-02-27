import { useState } from 'react';
import { useFetcher } from 'react-router';
import { Button, Input } from '@app/components/ui';
import { Loader2, DollarSign, Calendar, Tag, FileText, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { Transaction, Category } from '@db/schema';

interface TransactionFormProps {
  transaction?: Transaction | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ transaction, categories, onSuccess, onCancel }: TransactionFormProps) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const isEditing = !!transaction;

  const [type, setType] = useState<'income' | 'expense'>((transaction?.type as 'income' | 'expense') || 'expense');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter categories by selected type
  const availableCategories = categories.filter(c =>
    c.type === type || c.type === 'both'
  );

  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {};

    const amount = formData.get('amount') as string;
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    const categoryId = formData.get('categoryId') as string;
    if (!categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    const date = formData.get('date') as string;
    if (!date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!validateForm(formData)) return;

    const data: Record<string, string> = {
      intent: isEditing ? 'update' : 'create',
      type: formData.get('type') as string,
      amount: formData.get('amount') as string,
      categoryId: formData.get('categoryId') as string,
      description: (formData.get('description') as string) || '',
      date: formData.get('date') as string,
    };

    if (isEditing && transaction?.id) {
      data.id = transaction.id;
    }

    fetcher.submit(data, {
      method: 'POST',
    });

    onSuccess();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type Selection - Segmented Control */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2.5">
          Transaction Type
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`
              relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold
              transition-all duration-200 ease-out
              ${type === 'expense'
                ? 'bg-white text-red-600 shadow-sm ring-1 ring-red-100'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
          >
            <ArrowDownCircle className={`w-4 h-4 ${type === 'expense' ? 'text-red-500' : ''}`} />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`
              relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold
              transition-all duration-200 ease-out
              ${type === 'income'
                ? 'bg-white text-green-600 shadow-sm ring-1 ring-green-100'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
          >
            <ArrowUpCircle className={`w-4 h-4 ${type === 'income' ? 'text-green-500' : ''}`} />
            Income
          </button>
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Amount Input with Currency Formatting */}
      <div>
        <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
          Amount
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <DollarSign className={`
              w-5 h-5 transition-colors duration-200
              ${type === 'income' ? 'text-green-500' : 'text-red-500'}
            `} />
          </div>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            defaultValue={transaction?.amount ? parseFloat(transaction.amount.toString()).toFixed(2) : ''}
            className={`
              pl-11 pr-4 py-2.5 text-lg font-semibold
              ${type === 'income'
                ? 'focus:border-green-500 focus:ring-green-500/20'
                : 'focus:border-red-500 focus:ring-red-500/20'
              }
              ${errors.amount ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
              transition-all duration-200
            `}
          />
          {/* Focus indicator ring */}
          <div className={`
            absolute inset-0 rounded-md pointer-events-none opacity-0 group-focus-within:opacity-100
            transition-opacity duration-200
            ${type === 'income' ? 'ring-2 ring-green-500/20' : 'ring-2 ring-red-500/20'}
          `} />
        </div>
        {errors.amount && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500" />
            {errors.amount}
          </p>
        )}
      </div>

      {/* Category Select */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-2">
          Category
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Tag className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          </div>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={transaction?.categoryId || ''}
            className={`
              w-full rounded-lg border px-10 py-2.5 text-sm
              bg-white appearance-none cursor-pointer
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
              ${errors.categoryId ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}
            `}
          >
            <option value="" disabled>Select a category</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon && `${category.icon} `}{category.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.categoryId && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500" />
            {errors.categoryId}
          </p>
        )}
        {availableCategories.length === 0 && (
          <p className="mt-1.5 text-sm text-amber-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            No categories available for {type}. Please use a different type.
          </p>
        )}
      </div>

      {/* Date Input */}
      <div>
        <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
          Date
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Calendar className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          </div>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : today}
            className={`
              pl-10
              ${errors.date ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
            `}
          />
        </div>
        {errors.date && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500" />
            {errors.date}
          </p>
        )}
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
          Description
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <FileText className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          </div>
          <Input
            id="description"
            name="description"
            type="text"
            placeholder="e.g., Grocery shopping at Whole Foods"
            defaultValue={transaction?.description || ''}
            className="pl-10"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-11"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || availableCategories.length === 0}
          className={`
            flex-1 h-11 font-semibold
            ${type === 'income'
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            isEditing ? 'Update Transaction' : `Add ${type === 'income' ? 'Income' : 'Expense'}`
          )}
        </Button>
      </div>
    </form>
  );
}
