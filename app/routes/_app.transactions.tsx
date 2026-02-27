import '../styles/animations.css';
import { useState } from 'react';
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData, useSearchParams, useNavigation, useFetcher } from 'react-router';
import { requireSession } from '@app/lib/auth.server';
import { api } from '@app/lib/api-client';
import { TransactionItem } from '@app/components/finance/TransactionItem';
import { TransactionForm } from '@app/components/finance/TransactionForm';
import { Modal } from '@app/components/ui/Modal';
import { Button } from '@app/components/ui/Button';
import { Input } from '@app/components/ui/Input';
import { useKeyboardShortcuts } from '@app/hooks/useKeyboardShortcuts';
import { Plus, Search, Filter, ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { Transaction, Category } from '@db/schema';

export const meta: MetaFunction = () => {
  return [
    { title: 'Transactions | Finance Tracker' },
    { name: 'description', content: 'View and manage your transactions' },
  ];
};

interface LoaderData {
  transactions: Transaction[];
  categories: Category[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  const session = await requireSession(request);
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const page = searchParams.get('page') || '1';
  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const month = searchParams.get('month') || '';
  const search = searchParams.get('search') || '';
  
  try {
    const [transactionsRes, categoriesRes] = await Promise.all([
      fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/transactions?page=${page}&type=${type}&category=${category}&month=${month}&search=${search}`, {
        headers: { Cookie: request.headers.get('Cookie') || '' }
      }),
      api.categories.$get(undefined, {
        headers: { Cookie: request.headers.get('Cookie') || '' }
      })
    ]);
    
    const transactionsData = await transactionsRes.json().catch(() => ({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } }));
    const categories = await categoriesRes.json().catch(() => []);
    
    return Response.json({
      transactions: transactionsData.items || [],
      categories: categories || [],
      pagination: transactionsData.pagination || { page: 1, totalPages: 1, total: 0 }
    });
  } catch (error) {
    console.error('Transactions loader error:', error);
    return Response.json({
      transactions: [],
      categories: [],
      pagination: { page: 1, totalPages: 1, total: 0 }
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
      const res = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Cookie: cookie }
      });
      if (!res.ok) throw new Error('Failed to delete');
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
  }
  
  return Response.json({ error: 'Unknown intent' }, { status: 400 });
}

function calculateTotals(transactions: Transaction[]) {
  return transactions.reduce(
    (acc, t) => {
      const amount = parseFloat(t.amount.toString());
      if (t.type === 'income') acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function TransactionsPage() {
  const { transactions, categories, pagination } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';
  const fetcher = useFetcher();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  
  const currentType = searchParams.get('type') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentMonth = searchParams.get('month') || getCurrentMonth();
  const currentSearch = searchParams.get('search') || '';
  
  const totals = calculateTotals(transactions);
  const netAmount = totals.income - totals.expense;
  
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      meta: true,
      handler: () => setIsModalOpen(true),
    },
    {
      key: 'Escape',
      handler: () => {
        if (isModalOpen) setIsModalOpen(false);
      },
    },
  ]);
  
  const updateFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    setSearchParams(newParams);
  };
  
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
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
  
  if (isLoading) {
    return <div className="space-y-6 animate-fade-in"><p>Loading...</p></div>;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage your income and expenses
              <span className="hidden sm:inline text-gray-400 ml-2">(Cmd/Ctrl+N to add new)</span>
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Income</p>
              <p className="text-xl font-bold text-green-800">${totals.income.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">Expenses</p>
              <p className="text-xl font-bold text-red-800">${totals.expense.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className={`${netAmount >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-xl p-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <Wallet className={`w-5 h-5 ${netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net</p>
              <p className={`text-xl font-bold ${netAmount >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>${Math.abs(netAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={currentSearch}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        <select
          value={currentType}
          onChange={(e) => updateFilters({ type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          value={currentCategory}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <Input
          type="month"
          value={currentMonth}
          onChange={(e) => updateFilters({ month: e.target.value })}
          className="w-auto"
        />
      </div>
      
      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first transaction.</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        ) : (
          <>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onEdit={() => handleEdit(transaction)}
                onDelete={() => handleDelete(transaction)}
              />
            ))}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({ page: String(pagination.page - 1) })}
                  disabled={pagination.page <= 1}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({ page: String(pagination.page + 1) })}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
      
      {/* Mobile FAB */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg shadow-blue-500/30"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
