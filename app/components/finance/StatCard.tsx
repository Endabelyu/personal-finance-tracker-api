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
    bg: 'bg-gray-50',
    border: 'border-gray-100',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    titleColor: 'text-gray-600',
    valueColor: 'text-gray-900',
  },
  primary: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-700',
    valueColor: 'text-blue-900',
  },
  income: {
    bg: 'bg-green-50',
    border: 'border-green-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    titleColor: 'text-green-700',
    valueColor: 'text-green-900',
  },
  expense: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-700',
    valueColor: 'text-red-900',
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
                    ? 'text-green-600'
                    : changeIsNegative
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 truncate">{changeLabel}</span>
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
