import '../styles/animations.css';
import { useState } from 'react';
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData, useSearchParams, useNavigation, useFetcher } from 'react-router';
import { requireSession } from '@app/lib/auth.server';
import { api } from '@app/lib/api-client';
import { BudgetCard } from '@app/components/finance/BudgetCard';
import { BudgetForm } from '@app/components/finance/BudgetForm';
import { Modal } from '@app/components/ui/Modal';
import { Button } from '@app/components/ui/Button';
import { Input } from '@app/components/ui/Input';
import { useKeyboardShortcuts } from '@app/hooks/useKeyboardShortcuts';
import { Plus, Loader2, Wallet, Target, AlertCircle, Calendar, TrendingUp, PiggyBank } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeaderSkeleton, BudgetCardSkeleton, StatCardSkeleton } from '@app/components/ui';
import { BottomSheet } from '@app/components/ui/BottomSheet';

import type { Budget, Category } from '@db/schema';

// ============================================================================
// META
// ============================================================================

export const meta: MetaFunction = () => {
  return [
    { title: 'Budget | Finance Tracker' },
    { name: 'description', content: 'Set and track your spending limits by category' },
  ];
};

interface BudgetWithSpending extends Budget {
  category: Category;
  spent: string;
  remaining: string;
  percentageUsed: number;
}

interface LoaderData {
  budgets: BudgetWithSpending[];
  categories: Category[];
  month: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  const session = await requireSession(request);

  const url = new URL(request.url);
  const month = url.searchParams.get('month') || getCurrentMonth();

  try {
    const [budgetsRes, categoriesRes] = await Promise.all([
      fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/budgets?month=${month}`, {
        headers: { Cookie: request.headers.get('Cookie') || '' }
      }),
      api.categories.$get(undefined, {
        headers: { Cookie: request.headers.get('Cookie') || '' }
      })
    ]);

    const budgetsData = await budgetsRes.json().catch(() => ({ items: [] }));
    const categories = await categoriesRes.json().catch(() => []);

    return Response.json({
      budgets: budgetsData.items || [],
      categories: categories || [],
      month
    });
  } catch (error) {
    console.error('Budget loader error:', error);
    return Response.json({
      budgets: [],
      categories: [],
      month
    }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const cookie = request.headers.get('Cookie') || '';

  if (intent === 'delete') {
    const id = formData.get('id') as string;
    try {
      const res = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { Cookie: cookie }
      });
      if (!res.ok) throw new Error('Failed to delete');
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: 'Failed to delete budget' }, { status: 500 });
    }
  }

  if (intent === 'create' || intent === 'update') {
    const categoryId = formData.get('categoryId') as string;
    const limitAmount = formData.get('limitAmount') as string;
    const month = formData.get('month') as string;
    const id = formData.get('id') as string;

    try {
      if (intent === 'update' && id) {
        const res = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/budgets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookie
          },
          body: JSON.stringify({ limitAmount })
        });
        if (!res.ok) throw new Error('Failed to update');
        return Response.json({ success: true });
      } else {
        const res = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/budgets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookie
          },
          body: JSON.stringify({ categoryId, limitAmount, month })
        });
        if (!res.ok) throw new Error('Failed to create');
        return Response.json({ success: true });
      }
    } catch (error) {
      return Response.json({ error: 'Failed to save budget' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Unknown intent' }, { status: 400 });
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthForDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function calculateSummary(budgets: BudgetWithSpending[]) {
  return budgets.reduce(
    (acc, budget) => {
      const limit = parseFloat(budget.limitAmount);
      const spent = parseFloat(budget.spent);
      acc.totalBudgeted += limit;
      acc.totalSpent += spent;
      acc.totalRemaining += parseFloat(budget.remaining);
      if (budget.percentageUsed >= 100) acc.overBudgetCount++;
      else if (budget.percentageUsed >= 90) acc.nearLimitCount++;
      return acc;
    },
    { totalBudgeted: 0, totalSpent: 0, totalRemaining: 0, overBudgetCount: 0, nearLimitCount: 0 }
  );
}

// Budget Skeleton
function BudgetSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-6">
        <PageHeaderSkeleton />
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        {/* Overall Progress Skeleton */}
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Budget Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <BudgetCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const { budgets, categories, month } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';
  const fetcher = useFetcher();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentMonth = searchParams.get('month') || getCurrentMonth();

  const summary = calculateSummary(budgets);
  const overallPercentage = summary.totalBudgeted > 0
    ? Math.round((summary.totalSpent / summary.totalBudgeted) * 100)
    : 0;

  // Get expense categories without budgets
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');
  const budgetedCategoryIds = new Set(budgets.map(b => b.categoryId));
  const categoriesWithoutBudget = expenseCategories.filter(c => !budgetedCategoryIds.has(c.id));

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      meta: true,
      handler: () => {
        setIsModalOpen(true);
      },
    },
    {
      key: 'Escape',
      handler: () => {
        if (isModalOpen) {
          handleCloseModal();
        }
      },
    },
  ]);

  const updateMonth = (newMonth: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newMonth) {
      newParams.set('month', newMonth);
    } else {
      newParams.delete('month');
    }
    setSearchParams(newParams);
  };

  const handleEdit = (budget: BudgetWithSpending) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    fetcher.submit(
      { intent: 'delete', id },
      { method: 'POST' }
    );
  };

  if (isLoading) {
    return <BudgetSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Budget</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Track spending limits
              <span className="hidden sm:inline text-gray-400 ml-2">
                (Cmd/Ctrl+N to add new)
              </span>
            </p>
          </div>
          
          {/* Desktop Add Button */}
          <Button
            onClick={handleAddNew}
            className="hidden md:flex h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 touch-target"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set Budget
          </Button>
        </div>

        {/* Mobile Month Selector - Horizontal Scroll */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-2">
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - 6 + i);
              const monthStr = d.toISOString().slice(0, 7);
              const isCurrent = monthStr === currentMonth;
              const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              return (
                <button
                  key={monthStr}
                  onClick={() => updateMonth(monthStr)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Budget</h1>
            <p className="text-sm text-gray-500 mt-1">
              Set and track your spending limits by category
              <span className="hidden sm:inline text-gray-400 ml-2">
                (Cmd/Ctrl+N to add new)
              </span>
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            className="w-full sm:w-auto h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 touch-target"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set Budget
          </Button>
        </div>

        {/* Desktop Month Picker & Summary Cards */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Month Picker Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4" data-walkthrough="budget-month">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              Select Month
            </label>
            <Input
              type="month"
              value={currentMonth}
              onChange={(e) => updateMonth(e.target.value)}
              className="w-full touch-target"
            />
          </div>

          {/* Total Budgeted Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Budgeted</p>
                <p className="text-xl font-bold text-blue-800">
                  ${summary.totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Total Spent Card */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Total Spent</p>
                <p className="text-xl font-bold text-red-800">
                  ${summary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Remaining/Status Card */}
          <div className={`${summary.totalRemaining >= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'} border rounded-xl p-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.totalRemaining >= 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                <Wallet className={`w-5 h-5 ${summary.totalRemaining >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${summary.totalRemaining >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                  {summary.totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
                </p>
                <p className={`text-xl font-bold ${summary.totalRemaining >= 0 ? 'text-green-800' : 'text-orange-800'}`}>
                  ${Math.abs(summary.totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Summary - Horizontal Scroll */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max pb-2">
            {/* Total Budgeted */}
            <div className="w-[140px] flex-shrink-0 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-blue-700">Budgeted</p>
              </div>
              <p className="text-lg font-bold text-blue-800">
                ${summary.totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
            </div>

            {/* Total Spent */}
            <div className="w-[140px] flex-shrink-0 bg-red-50 border border-red-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                </div>
                <p className="text-xs font-medium text-red-700">Spent</p>
              </div>
              <p className="text-lg font-bold text-red-800">
                ${summary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
            </div>

            {/* Remaining */}
            <div className={`w-[140px] flex-shrink-0 rounded-xl p-3 ${summary.totalRemaining >= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'} border`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${summary.totalRemaining >= 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <Wallet className={`w-3.5 h-3.5 ${summary.totalRemaining >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
                <p className={`text-xs font-medium ${summary.totalRemaining >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                  {summary.totalRemaining >= 0 ? 'Left' : 'Over'}
                </p>
              </div>
              <p className={`text-lg font-bold ${summary.totalRemaining >= 0 ? 'text-green-800' : 'text-orange-800'}`}>
                ${Math.abs(summary.totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Month Picker Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4" data-walkthrough="budget-month">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              Select Month
            </label>
            <Input
              type="month"
              value={currentMonth}
              onChange={(e) => updateMonth(e.target.value)}
              className="w-full touch-target"
            />
          </div>

          {/* Total Budgeted Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Budgeted</p>
                <p className="text-xl font-bold text-blue-800">
                  ${summary.totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Total Spent Card */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Total Spent</p>
                <p className="text-xl font-bold text-red-800">
                  ${summary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Remaining/Status Card */}
          <div className={`${summary.totalRemaining >= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'} border rounded-xl p-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.totalRemaining >= 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                <Wallet className={`w-5 h-5 ${summary.totalRemaining >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${summary.totalRemaining >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                  {summary.totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
                </p>
                <p className={`text-xl font-bold ${summary.totalRemaining >= 0 ? 'text-green-800' : 'text-orange-800'}`}>
                  ${Math.abs(summary.totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        {budgets.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Overall Budget Usage</h3>
              <span className={`text-sm font-bold ${
                overallPercentage > 90 ? 'text-red-600' :
                overallPercentage > 75 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {overallPercentage}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage > 90 ? 'bg-red-500' :
                  overallPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary.overBudgetCount > 0 && (
                <span className="text-red-600 font-medium">{summary.overBudgetCount} categories over budget. </span>
              )}
              {summary.nearLimitCount > 0 && (
                <span className="text-yellow-600 font-medium">{summary.nearLimitCount} near limit. </span>
              )}
              {summary.overBudgetCount === 0 && summary.nearLimitCount === 0 && (
                'All categories within budget. Great job!'
              )}
            </p>
          </div>
        )}
      </div>

      {/* Budget Cards Grid */}
      <div className="space-y-6 pb-20 md:pb-0">
        {budgets.length === 0 && categoriesWithoutBudget.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No budgets set</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Start tracking your spending by setting budget limits for your expense categories.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Set your first budget
            </Button>
          </div>
        ) : (
          <>
            {/* Active Budgets */}
            {budgets.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Active Budgets
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {budgets.map((budget) => (
                    <BudgetCard
                      key={budget.id}
                      budget={budget}
                      onEdit={() => handleEdit(budget)}
                      onDelete={() => handleDelete(budget.id)}
                      isDeleting={deletingId === budget.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Categories Without Budgets */}
            {categoriesWithoutBudget.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Categories Without Budgets
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {categoriesWithoutBudget.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer active:scale-[0.98]"
                      onClick={() => {
                        setEditingBudget({
                          id: '',
                          categoryId: category.id,
                          category,
                          month: currentMonth,
                          limitAmount: '0',
                          spent: '0',
                          remaining: '0',
                          percentageUsed: 0,
                          userId: '',
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        } as BudgetWithSpending);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {category.icon && (
                            <span className="text-2xl">{category.icon}</span>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-700">{category.label}</h3>
                            <p className="text-sm text-gray-500">No limit set • Tap to add</p>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <Button
        onClick={handleAddNew}
        className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg shadow-blue-500/30"
      >
        <Plus className="w-6 h-6" />
      </Button>
      <div className="space-y-6">
        {budgets.length === 0 && categoriesWithoutBudget.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No budgets set</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Start tracking your spending by setting budget limits for your expense categories.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Set your first budget
            </Button>
          </div>
        ) : (
          <>
            {/* Active Budgets */}
            {budgets.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Active Budgets
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {budgets.map((budget) => (
                    <BudgetCard
                      key={budget.id}
                      budget={budget}
                      onEdit={() => handleEdit(budget)}
                      onDelete={() => handleDelete(budget.id)}
                      isDeleting={deletingId === budget.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Categories Without Budgets */}
            {categoriesWithoutBudget.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Categories Without Budgets
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {categoriesWithoutBudget.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-5 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {category.icon && (
                            <span className="text-2xl">{category.icon}</span>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-700">{category.label}</h3>
                            <p className="text-sm text-gray-500">No limit set</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBudget({
                              id: '',
                              categoryId: category.id,
                              category,
                              month: currentMonth,
                              limitAmount: '0',
                              spent: '0',
                              remaining: '0',
                              percentageUsed: 0,
                              userId: '',
                              createdAt: new Date(),
                              updatedAt: new Date(),
                            } as BudgetWithSpending);
                            setIsModalOpen(true);
                          }}
                          className="touch-target"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Set Limit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBudget?.id ? 'Edit Budget' : 'Set Budget'}
      >
        <BudgetForm
          budget={editingBudget}
          categories={expenseCategories}
          currentMonth={currentMonth}
          onSuccess={handleCloseModal}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
