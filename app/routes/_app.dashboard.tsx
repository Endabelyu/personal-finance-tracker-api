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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Transaction, Category } from '@app/types';
import {
  StatCardSkeleton,
  ChartSkeleton,
  TransactionItemSkeleton,
} from '@app/components/ui';
import { listCategories } from '@server/lib/services/categories.server';
import { listTransactions } from '@server/lib/services/transactions.server';
import { getFinancialSummary, getMonthlyTrend } from '@server/lib/services/reports.server';

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
  user: { name?: string; email: string };
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
      user: session.user,
    });
  } catch (error) {
    console.error('Dashboard loader error:', error);
    return Response.json({
      summary: { income: 0, expenses: 0, balance: 0, savingsRate: 0, transactionCount: 0 },
      monthlyData: [],
      recentTransactions: [],
      categories: [],
      user: session.user,
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
    <div className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-[#2C2D35]/15"
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
  const { summary, recentTransactions, monthlyData, categories, user } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const firstName = user.name ? user.name.split(' ')[0] : 'User';
  const currentMonthLabel = monthlyData[monthlyData.length - 1] 
    ? formatMonthLabel(monthlyData[monthlyData.length - 1].month) 
    : 'Bulan ini';

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-24 md:pb-6 px-4 pt-4 max-w-lg mx-auto lg:max-w-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/70 flex items-center gap-1">
            Selamat pagi <span className="text-lg">👋</span>
          </p>
          <h1 className="text-2xl font-bold text-white mt-0.5">{firstName}</h1>
        </div>
        <Link to="/profile" className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-2xl shadow-inner cursor-pointer hover:border-white/30 transition-colors">
          😎
        </Link>
      </div>

      {/* Hero Card - Total Saldo */}
      <div className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-[var(--gradient-hero-start)] to-[var(--gradient-hero-end)]">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <div className="w-32 h-32 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/80 mb-1">Total Saldo</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">{formatCurrency(summary.balance).replace('$', 'Rp ')}</h2>
          <p className="text-xs text-white/80 mb-6">Semua akun • {currentMonthLabel}</p>
          
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] flex items-center gap-1 text-white/80 uppercase font-bold"><TrendingUp className="w-3 h-3"/> Masuk</p>
              <p className="text-sm font-bold mt-0.5">+{formatCurrency(summary.income).replace('$', '')}</p>
            </div>
            <div>
              <p className="text-[10px] flex items-center gap-1 text-white/80 uppercase font-bold"><TrendingDown className="w-3 h-3"/> Keluar</p>
              <p className="text-sm font-bold mt-0.5">-{formatCurrency(summary.expenses).replace('$', '')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        {[
          { label: 'Keluar', icon: TrendingDown, color: 'text-emerald-400', route: '/transactions?new=true&type=expense' },
          { label: 'Masuk', icon: TrendingUp, color: 'text-amber-400', route: '/transactions?new=true&type=income' },
          { label: 'Transfer', icon: ArrowRight, color: 'text-blue-400', route: '/transactions' },
          { label: 'Laporan', icon: Receipt, color: 'text-rose-400', route: '/reports' },
        ].map(action => (
          <Link key={action.label} to={action.route} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] glass-card flex items-center justify-center hover:scale-105 transition-transform">
              <action.icon className={`w-6 h-6 ${action.color}`} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-semibold text-white/80">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Akun Saya (Mocked for visual parity with design) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Akun Saya</h3>
          <Link to="/profile" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            + Tambah
          </Link>
        </div>
        
        <div className="flex overflow-x-auto gap-3 pb-4 snap-x -mx-4 px-4 scrollbar-hide">
          <div className="glass-card p-4 min-w-[140px] snap-center flex-shrink-0 border-blue-400/30">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">
              <Wallet className="w-3 h-3 text-blue-400" /> BCA
            </div>
            <p className="text-lg font-bold text-blue-400">5.200.000</p>
            <p className="text-[10px] text-white/50">Tabungan</p>
          </div>
          
          <div className="glass-card p-4 min-w-[140px] snap-center flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">
              <Wallet className="w-3 h-3 text-slate-400" /> Mandiri
            </div>
            <p className="text-lg font-bold text-white">2.100.000</p>
            <p className="text-[10px] text-white/50">Gaji</p>
          </div>
          
          <div className="glass-card p-4 min-w-[140px] snap-center flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">
              <Wallet className="w-3 h-3 text-emerald-400" /> Cash
            </div>
            <p className="text-lg font-bold text-white">1.150.000</p>
            <p className="text-[10px] text-white/50">Dompet</p>
          </div>
        </div>
      </div>

      {/* Banner Insight */}
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0 border border-white/10">
          🤖
        </div>
        <p className="text-[11px] leading-relaxed text-white/80">
          Kamu <span className="text-blue-400 font-bold">hemat 15%</span> buat makan bulan ini! Tapi transport naik 22% 👀
        </p>
      </div>

      {/* Terbaru */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Terbaru</h3>
          <Link to="/transactions" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-white/60">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="glass-card divide-y divide-white/5">
            {recentTransactions.map((transaction) => {
              const category = categories.find((c) => c.id === transaction.categoryId);
              return (
                <TransactionRow key={transaction.id} transaction={transaction} category={category} />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}