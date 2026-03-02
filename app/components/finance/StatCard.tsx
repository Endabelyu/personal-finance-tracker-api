import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  variant?: 'default' | 'income' | 'expense' | 'primary';
  isLoading?: boolean;
}

const variantStyles = {
  default: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-100 dark:border-gray-700/50',
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-300',
    titleColor: 'text-gray-600 dark:text-gray-400',
    valueColor: 'text-gray-900 dark:text-gray-50',
  },
  primary: {
    bg: 'bg-blue-50/50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-700 dark:text-blue-300',
    valueColor: 'text-blue-900 dark:text-blue-50',
  },
  income: {
    bg: 'bg-green-50/50 dark:bg-emerald-900/10',
    border: 'border-green-100 dark:border-emerald-800/30',
    iconBg: 'bg-green-100 dark:bg-emerald-900/40',
    iconColor: 'text-green-600 dark:text-emerald-400',
    titleColor: 'text-green-700 dark:text-emerald-400',
    valueColor: 'text-green-900 dark:text-emerald-50',
  },
  expense: {
    bg: 'bg-red-50/50 dark:bg-rose-900/10',
    border: 'border-red-100 dark:border-rose-800/30',
    iconBg: 'bg-red-100 dark:bg-rose-900/40',
    iconColor: 'text-red-600 dark:text-rose-400',
    titleColor: 'text-red-700 dark:text-rose-400',
    valueColor: 'text-red-900 dark:text-rose-50',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  variant = 'default',
  isLoading,
}: StatCardProps) {
  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <div className={`${styles.bg} border ${styles.border} rounded-xl p-5 animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-32 bg-gray-300 rounded" />
          </div>
          <div className="h-10 w-10 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  const changeIsPositive = change && change > 0;
  const changeIsNegative = change && change < 0;

  return (
    <div
      className={`
        ${styles.bg} border ${styles.border} rounded-xl p-5
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${styles.titleColor} truncate`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${styles.valueColor} mt-1 truncate`}>
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {changeIsPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              ) : changeIsNegative ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-600" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  changeIsPositive
                    ? 'text-green-600 dark:text-emerald-400'
                    : changeIsNegative
                    ? 'text-red-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`
            ${styles.iconBg} ${styles.iconColor}
            w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
