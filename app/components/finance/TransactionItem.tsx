import { useFetcher } from 'react-router';
import { ArrowUpRight, ArrowDownRight, Edit2, Trash2, Loader2 } from 'lucide-react';
import type { Transaction, Category } from '@db/schema';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: React.CSSProperties;
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

// Category badge color mapping
const getCategoryBadgeStyle = (categoryLabel?: string) => {
  const label = categoryLabel?.toLowerCase() || '';
  if (label.includes('food') || label.includes('grocery') || label.includes('dining')) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  if (label.includes('transport') || label.includes('car') || label.includes('gas')) {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }
  if (label.includes('entertainment') || label.includes('fun')) {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  if (label.includes('shopping')) {
    return 'bg-pink-100 text-pink-800 border-pink-200';
  }
  if (label.includes('bill') || label.includes('utility')) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (label.includes('health') || label.includes('medical')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (label.includes('salary') || label.includes('wage')) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (label.includes('freelance')) {
    return 'bg-teal-100 text-teal-800 border-teal-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export function TransactionItem({ transaction, category, onEdit, onDelete, style }: TransactionItemProps) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== 'idle';

  const isIncome = transaction.type === 'income';
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    fetcher.submit(
      { intent: 'delete', id: transaction.id },
      { method: 'POST' }
    );
  };

  return (
    <div
      className={`
        group flex items-center justify-between p-4
        ${isIncome ? 'bg-green-50/40 hover:bg-green-50/70' : 'bg-red-50/40 hover:bg-red-50/70'}
        hover:shadow-sm hover:-translate-y-0.5
        transition-all duration-200 ease-out
        border-b border-gray-100 last:border-b-0
        cursor-pointer
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      style={style}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon with semantic styling */}
        <div
          className={`
            flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
            transition-transform duration-200 group-hover:scale-105
            ${isIncome
              ? 'bg-green-100 text-green-700 ring-2 ring-green-200/50'
              : 'bg-red-100 text-red-700 ring-2 ring-red-200/50'
            }
          `}
        >
          {category?.icon ? (
            <span className="text-xl">{category.icon}</span>
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 truncate">
              {transaction.description || category?.label || 'Uncategorized'}
            </p>
            {/* Category Badge */}
            <span className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              border ${getCategoryBadgeStyle(category?.label)}
            `}>
              {category?.label || 'Uncategorized'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
            <span>{formatDate(transaction.date)}</span>
            {transaction.createdAt && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-400">{new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        {/* Amount with semantic styling */}
        <span
          className={`
            font-bold text-lg tabular-nums tracking-tight
            ${isIncome ? 'text-green-700' : 'text-red-700'}
          `}
        >
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Edit transaction"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Edit2 className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) {
                onDelete();
              } else {
                handleDelete();
              }
            }}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            aria-label="Delete transaction"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
