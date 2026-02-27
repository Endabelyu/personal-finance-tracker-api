import { useState } from 'react';
import { Pencil, Trash2, AlertCircle, Target } from 'lucide-react';
import { Button } from '@app/components/ui/Button';
import { ConfirmDialog } from '@app/components/ui';
import type { Budget, Category } from '@db/schema';

interface BudgetWithSpending extends Budget {
  category: Category;
  spent: string;
  remaining: string;
  percentageUsed: number;
}

interface BudgetCardProps {
  budget: BudgetWithSpending;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function BudgetCard({ budget, onEdit, onDelete, isDeleting }: BudgetCardProps) {
  const limit = parseFloat(budget.limitAmount);
  const spent = parseFloat(budget.spent);
  const remaining = parseFloat(budget.remaining);
  const percentage = budget.percentageUsed;
  
  const [showConfirm, setShowConfirm] = useState(false);

  // Determine status colors
  const getStatusColor = () => {
    if (percentage >= 100) return {
      bar: 'bg-red-500',
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-700',
      icon: 'bg-red-100 text-red-600'
    };
    if (percentage >= 90) return {
      bar: 'bg-yellow-500',
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      text: 'text-yellow-700',
      icon: 'bg-yellow-100 text-yellow-600'
    };
    if (percentage >= 75) return {
      bar: 'bg-yellow-400',
      bg: 'bg-yellow-50/50',
      border: 'border-yellow-100/50',
      text: 'text-yellow-700',
      icon: 'bg-yellow-100 text-yellow-600'
    };
    return {
      bar: 'bg-green-500',
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-green-700',
      icon: 'bg-green-100 text-green-600'
    };
  };

  const status = getStatusColor();

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    onDelete();
  };

  return (
    <>
      <div className={`${status.bg} border ${status.border} rounded-xl p-5 transition-all duration-200 hover:shadow-md`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {budget.category.icon && (
              <span className="text-2xl">{budget.category.icon}</span>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{budget.category.label}</h3>
              <p className="text-xs text-gray-500">{budget.month}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Budget</p>
            <p className="text-sm font-bold text-gray-900">
              ${limit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Spent</p>
            <p className="text-sm font-bold text-red-600">
              ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Remaining</p>
            <p className={`text-sm font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {percentage >= 90 && (
                <AlertCircle className={`w-4 h-4 ${status.text}`} />
              )}
              <span className={`text-sm font-medium ${status.text}`}>
                {percentage}% used
              </span>
            </div>
            {percentage >= 100 ? (
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                Over Budget
              </span>
            ) : percentage >= 90 ? (
              <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                Near Limit
              </span>
            ) : null}
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${status.bar} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Budget?"
        message={`Are you sure you want to delete the budget for "${budget.category.label}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
