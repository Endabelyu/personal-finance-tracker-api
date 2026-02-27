import '../styles/animations.css';
import { useState } from 'react';
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData, useSearchParams, Form, useNavigation, Link, useFetcher } from 'react-router';
import { requireSession } from '@app/lib/auth.server';
import { api } from '@app/lib/api-client';
import { TransactionItem } from '@app/components/finance/TransactionItem';
import { TransactionForm } from '@app/components/finance/TransactionForm';
import { Modal, ConfirmDialog } from '@app/components/ui';
import { Button } from '@app/components/ui/Button';
import { Input } from '@app/components/ui/Input';
import { useKeyboardShortcuts } from '@app/hooks/useKeyboardShortcuts';
import { Plus, Search, Loader2, Wallet, FilterX, Receipt, TrendingUp, TrendingDown, Download, SlidersHorizontal } from 'lucide-react';
import { PageHeaderSkeleton, TransactionItemSkeleton, FilterBarSkeleton } from '@app/components/ui';
import { exportTransactionsToCSV, generateExportFilename } from '@app/lib/export';
import { BottomSheet } from '@app/components/ui/BottomSheet';

import type { Transaction, Category } from '@db/schema';

// ============================================================================
// META
// ============================================================================

export const meta: MetaFunction = () => {
  return [
    { title: 'Transactions | Finance Tracker' },
    { name: 'description', content: 'Manage your income and expenses' },
  ];
};

interface LoaderData {
  transactions: Transaction[];
  categories: Category[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
  };
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  const session = await requireSession(request);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const type = url.searchParams.get('type') || undefined;
  const categoryId = url.searchParams.get('category') || undefined;
  const month = url.searchParams.get('month') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const searchParams = new URLSearchParams();
  searchParams.set('page', page.toString());
  searchParams.set('limit', '20');
  if (type) searchParams.set('type', type);
  if (categoryId) searchParams.set('category', categoryId);
  if (month) searchParams.set('month', month);
  if (search) searchParams.set('search', search);

  try {
    const [transactionsRes, categoriesRes] = await Promise.all([
      api.transactions.$get({ query: Object.fromEntries(searchParams) }, {
        headers: { Cookie: request.headers.get('Cookie') || '' }
      }),
      api.categories.$get(undefined, {
        headers: { Cookie: request.headers.get('Cookie') || '' }
      })
    ]);

    if (!transactionsRes.ok) throw new Error('Failed to load transactions');
    if (!categoriesRes.ok) throw new Error('Failed to load categories');

    const transactionsData = await transactionsRes.json();
    const categories = await categoriesRes.json();

    return Response.json({
      transactions: transactionsData.transactions || [],
      categories: categories || [],
      pagination: transactionsData.pagination || { page: 1, totalPages: 1, totalCount: 0 }
    });
  } catch (error) {
    console.error('Loader error:', error);
    return Response.json({
      transactions: [],
      categories: [],
      pagination: { page: 1, totalPages: 1, totalCount: 0 }
    }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  const session = await requireSession(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'delete') {
    const id = formData.get('id') as string;
    try {
      const res = await api.transactions[id].$delete({
        headers: { Cookie: request.headers.get('Cookie') || '' }
      });
      if (!res.ok) throw new Error('Failed to delete');
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Unknown intent' }, { status: 400 });
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getCurrentMonth(): string {
  return formatDateForInput(new Date()).slice(0, 7);
}

// Calculate totals from transactions
function calculateTotals(transactions: Transaction[]) {
  return transactions.reduce(
    (acc, t) => {
      const amount = parseFloat(t.amount.toString());
      if (t.type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

// Transactions Skeleton
function TransactionsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-6">
        <PageHeaderSkeleton />
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <FilterBarSkeleton count={4} />

      {/* Transactions List Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <TransactionItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { transactions, categories, pagination } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const fetcher = useFetcher();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const fetcher = useFetcher();

  const currentType = searchParams.get('type') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentMonth = searchParams.get('month') || getCurrentMonth();
  const currentSearch = searchParams.get('search') || '';

  const totals = calculateTotals(transactions);
  const netAmount = totals.income - totals.expense;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      meta: true,
      handler: () => {
        const searchInput = document.getElementById('search');
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
        }
      },
    },
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
        if (deletingTransaction) {
          setDeletingTransaction(null);
        }
      },
    },
  ]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = () => {
    if (deletingTransaction) {
      fetcher.submit(
        { intent: 'delete', id: deletingTransaction.id },
        { method: 'POST' }
      );
      setDeletingTransaction(null);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both');
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  const hasActiveFilters = currentType || currentCategory || currentSearch || currentMonth !== getCurrentMonth();

  if (isLoading) {
    return <TransactionsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Stats */}
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Title Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage your income and expenses
              <span className="hidden sm:inline text-gray-400 ml-2">
                (Cmd/Ctrl+N to add new)
              </span>
            </p>
          </div>
          
          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterSheetOpen(true)}
            className="md:hidden h-10 px-3"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </Button>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportTransactionsToCSV(transactions, categories, {
                  filename: generateExportFilename('transactions', 'csv'),
                });
              }}
              className="h-11 px-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 touch-target"
              data-walkthrough="add-transaction"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      <div className="flex flex-col gap-6">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your income and expenses
              <span className="hidden sm:inline text-gray-400 ml-2">
                (Cmd/Ctrl+N to add new)
              </span>
            </p>
          </div>
          {/* Add/Export Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                exportTransactionsToCSV(transactions, categories, {
                  filename: generateExportFilename('transactions', 'csv'),
                });
              }}
              className="flex-1 sm:flex-none h-11 px-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 touch-target"
              data-walkthrough="add-transaction"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards - Horizontal Scroll on Mobile */}
        {transactions.length > 0 && (
          <div className="-mx-4 md:mx-0 overflow-x-auto scrollbar-hide">
            <div className="flex md:grid md:grid-cols-3 gap-3 px-4 md:px-0 min-w-max md:min-w-0">
              <div className="w-[130px] md:w-auto flex-shrink-0 bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700">Income</p>
                    <p className="text-lg font-bold text-green-800">
                      ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-[130px] md:w-auto flex-shrink-0 bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700">Expenses</p>
                    <p className="text-lg font-bold text-red-800">
                      ${totals.expense.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`w-[130px] md:w-auto flex-shrink-0 rounded-xl p-4 ${netAmount >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                    <Wallet className={`w-4 h-4 ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net</p>
                    <p className={`text-lg font-bold ${netAmount >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      ${Math.abs(netAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Income Card */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Income</p>
                  <p className="text-xl font-bold text-green-800">
                    ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Expense Card */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Expenses</p>
                  <p className="text-xl font-bold text-red-800">
                    ${totals.expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Net Card */}
            <div className={`${netAmount >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <Wallet className={`w-5 h-5 ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net</p>
                  <p className={`text-xl font-bold ${netAmount >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                    ${Math.abs(netAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Filters - Hidden on Mobile */}
      <div className="hidden md:block bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FilterX className="w-4 h-4" />
            Filters
            <span className="hidden sm:inline text-xs text-gray-400 font-normal">
              (Cmd/Ctrl+K to search)
            </span>
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Month Picker */}
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-600 mb-1.5">
              Month
            </label>
            <Input
              id="month"
              type="month"
              value={currentMonth}
              onChange={(e) => updateFilter('month', e.target.value)}
              className="w-full h-10 touch-target"
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-600 mb-1.5">
              Type
            </label>
            <div className="relative">
              <select
                id="type"
                value={currentType}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-10 text-sm
                  bg-white appearance-none cursor-pointer touch-target
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                  transition-all duration-200"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-600 mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={currentCategory}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-10 text-sm
                  bg-white appearance-none cursor-pointer touch-target
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                  transition-all duration-200"
              >
                <option value="">All Categories</option>
                <optgroup label="Income">
                  {incomeCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Expense">
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-600 mb-1.5">
              Search
              <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded">⌘K</kbd>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search description..."
                value={currentSearch}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full h-10 pl-10 touch-target"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Receipt className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Start tracking your finances by adding your first transaction.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add your first transaction
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction, index) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  category={categories.find(c => c.id === transaction.categoryId)}
                  onEdit={() => handleEdit(transaction)}
                  onDelete={() => handleDelete(transaction)}
                  style={{ animationDelay: `${index * 30}ms` }}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
                <div className="text-sm text-gray-500">
                  Page <span className="font-medium text-gray-900">{pagination.page}</span> of{' '}
                  <span className="font-medium text-gray-900">{pagination.totalPages}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-400">{pagination.totalCount} total</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (pagination.page - 1).toString() })}`}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 touch-target ${
                      pagination.page <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={(e) => pagination.page <= 1 && e.preventDefault()}
                  >
                    Previous
                  </Link>
                  <Link
                    to={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (pagination.page + 1).toString() })}`}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 touch-target ${
                      pagination.page >= pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={(e) => pagination.page >= pagination.totalPages && e.preventDefault()}
                  >
                    Next
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg shadow-blue-500/30"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Mobile Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filters"
      >
        <div className="space-y-5 p-4">
          {/* Month Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <Input
              type="month"
              value={currentMonth}
              onChange={(e) => updateFilter('month', e.target.value)}
              className="w-full h-12 touch-target text-base"
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['', 'income', 'expense'].map((type) => (
                <button
                  key={type || 'all'}
                  onClick={() => updateFilter('type', type)}
                  className={`h-12 rounded-lg text-sm font-medium transition-colors ${
                    currentType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="relative">
              <select
                value={currentCategory}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full h-12 rounded-lg border border-gray-300 px-4 text-base
                  bg-white appearance-none cursor-pointer touch-target
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <optgroup label="Income">
                  {incomeCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Expense">
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={currentSearch}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full h-12 pl-12 touch-target text-base"
              />
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-sm text-gray-500">Active:</span>
              {currentType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                  {currentType}
                  <button onClick={() => updateFilter('type', '')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {currentCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
                  {categories.find(c => c.id === currentCategory)?.label}
                  <button onClick={() => updateFilter('category', '')} className="hover:text-purple-900">×</button>
                </span>
              )}
              {currentSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                  "{currentSearch}"
                  <button onClick={() => updateFilter('search', '')} className="hover:text-gray-900">×</button>
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 h-12"
              >
                Clear All
              </Button>
            )}
            <Button
              onClick={() => setIsFilterSheetOpen(false)}
              className="flex-1 h-12"
            >
              Show Results
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSuccess={handleCloseModal}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="Delete Transaction?"
        message={`Are you sure you want to delete the transaction "${deletingTransaction?.description || 'Unknown'}" for ${deletingTransaction ? `$${parseFloat(deletingTransaction.amount.toString()).toFixed(2)}` : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTransaction(null)}
      />
    </div>
  );
}
