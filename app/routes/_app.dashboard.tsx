import { useState } from 'react';
import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData, useNavigation, Link } from 'react-router';
import { requireSession } from '@app/lib/auth.server';
import { StatCard } from '@app/components/finance/StatCard';
import { Button } from '@app/components/ui/Button';
import { useKeyboardShortcuts } from '@app/hooks/useKeyboardShortcuts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Receipt,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Transaction, Category } from '@db/schema';
import {
  StatCardSkeleton,
  ChartSkeleton,
  TransactionItemSkeleton,
} from '@app/components/ui';
import { listCategories } from '@server/lib/services/categories';
import { listTransactions } from '@server/lib/services/transactions';
import { getFinancialSummary, getMonthlyTrend } from '@server/lib/services/reports';

// ============================================================================
// META
// ============================================================================

export const meta: MetaFunction = () => {
  return [
    { title: 'Dashboard | Finance Tracker' },
    { name: 'description', content: 'Overview of your financial health and recent transactions' },
  ];
};

// ============================================================================
// TYPES
// ============================================================================

interface SummaryStats {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  transactionCount: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface LoaderData {
  summary: SummaryStats;
  recentTransactions: Transaction[];
  monthlyData: MonthlyData[];
  categories: Category[];
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  const session = await requireSession(request);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    const [summary, monthlyData, transactionsData, categoriesData] = await Promise.all([
      getFinancialSummary(session.userId, currentMonth),
      getMonthlyTrend(session.userId, 6),
      listTransactions({ userId: session.userId, limit: 5, page: 1 }),
      listCategories(),
    ]);

    return Response.json({
      summary,
      monthlyData,
      recentTransactions: transactionsData.items,
      categories: categoriesData,
    });
  } catch (error) {
    console.error('Dashboard loader error:', error);
    return Response.json({
      summary: { income: 0, expenses: 0, balance: 0, savingsRate: 0, transactionCount: 0 },
      monthlyData: [],
      recentTransactions: [],
      categories: [],
    }, { status: 500 });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 capitalize">{entry.name}:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
  category,
}: {
  transaction: Transaction;
  category?: Category;
}) {
  const isIncome = transaction.type === 'income';
  const categoryColor = category?.color || '#9ca3af';

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {transaction.description || category?.label || 'Transaction'}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(typeof transaction.date === 'string' ? transaction.date : transaction.date.toISOString())} • {category?.label || 'Uncategorized'}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-semibold whitespace-nowrap ml-4 ${
          isIncome ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isIncome ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount.toString()))}
      </span>
    </div>
  );
}

function EmptyTransactions() {
  return (
    <div className="text-center py-10 px-4">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
        <Receipt className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">No transactions yet</h3>
      <p className="text-xs text-gray-500 mb-4">
        Start tracking your finances by adding your first transaction.
      </p>
      <Link to="/transactions">
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Transaction
        </Button>
      </Link>
    </div>
  );
}

// Dashboard Skeleton Loading State
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts and Recent Transactions Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height="h-80" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <TransactionItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardPage() {
  const { summary, recentTransactions, monthlyData, categories } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  // Keyboard shortcut: Cmd/Ctrl+K to navigate to transactions
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      meta: true,
      handler: () => {
        window.location.href = '/transactions';
      },
    },
  ]);

  // Format monthly data for chart
  const chartData = monthlyData.map((d) => ({
    name: formatMonthLabel(d.month),
    fullMonth: d.month,
    income: d.income,
    expenses: d.expenses,
    balance: d.balance,
  }));

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* Desktop Header */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your financial health
          </p>
        </div>
        <Link to="/transactions">
          <Button className="w-full sm:w-auto touch-target">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Stats Grid - 2x2 on Mobile, 4x1 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-walkthrough="dashboard-stats">
        <StatCard
          title="Total Balance"
          value={formatCurrency(summary.balance)}
          icon={Wallet}
          variant="primary"
          isLoading={false}
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(summary.income)}
          icon={TrendingUp}
          variant="income"
          isLoading={false}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(summary.expenses)}
          icon={TrendingDown}
          variant="expense"
          isLoading={false}
        />
        <StatCard
          title="Savings Rate"
          value={`${summary.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          variant={summary.savingsRate >= 20 ? 'income' : summary.savingsRate >= 0 ? 'default' : 'expense'}
          isLoading={false}
        />
      </div>

      {/* Charts and Recent Transactions - Single Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Monthly Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 order-2 md:order-1">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            Income vs Expenses
          </h2>
          {chartData.length === 0 ? (
            <div className="h-48 md:h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          ) : (
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={(value: number) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                    width={45}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 16 }}
                    iconType="circle"
                  />
                  <Bar
                    name="income"
                    dataKey="income"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    name="expenses"
                    dataKey="expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expenses
          </h2>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value: number) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
                    width={50}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    iconType="circle"
                  />
                  <Bar
                    name="income"
                    dataKey="income"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    name="expenses"
                    dataKey="expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm order-1 md:order-2">
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span className="hidden sm:inline">View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyTransactions />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={categories.find((c) => c.id === transaction.categoryId)}
                />
              ))}
            </div>
          )}

          {recentTransactions.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 md:hidden">
              <Link to="/transactions">
                <Button variant="outline" className="w-full">
                  View All Transactions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB - Floating Action Button */}
      <Link
        to="/transactions"
        className="md:hidden fixed bottom-20 right-4 z-30"
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
    </div>
  );
}