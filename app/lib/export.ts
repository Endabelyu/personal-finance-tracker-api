import type { Transaction, Category } from '@app/types';

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'locale' | 'us';
}

const DEFAULT_OPTIONS: ExportOptions = {
  filename: 'transactions.csv',
  includeHeaders: true,
  dateFormat: 'locale',
};

function formatDate(date: Date | string, format: ExportOptions['dateFormat']): string {
  const d = new Date(date);
  
  switch (format) {
    case 'iso':
      return d.toISOString().split('T')[0];
    case 'us':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'locale':
    default:
      return d.toLocaleDateString();
  }
}

function formatCurrency(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return value.toFixed(2);
}

function escapeCSV(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCSVRow(values: string[]): string {
  return values.map(escapeCSV).join(',') + '\n';
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  options: ExportOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create category lookup map
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  let csv = '';
  
  // Add headers
  if (opts.includeHeaders) {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    csv += generateCSVRow(headers);
  }
  
  // Add transaction rows
  for (const t of transactions) {
    const category = categoryMap.get(t.categoryId);
    const row = [
      formatDate(t.date, opts.dateFormat),
      t.description || '',
      category?.label || 'Uncategorized',
      t.type,
      t.type === 'income' ? formatCurrency(t.amount) : `-${formatCurrency(t.amount)}`,
    ];
    csv += generateCSVRow(row);
  }
  
  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', opts.filename || 'transactions.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

export function exportTransactionsToJSON(
  transactions: Transaction[],
  categories: Category[],
  options: { filename?: string } = {}
): void {
  const filename = options.filename || 'transactions.json';
  
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  const data = transactions.map(t => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: parseFloat(t.amount.toString()),
    type: t.type,
    category: categoryMap.get(t.categoryId)?.label || 'Uncategorized',
    categoryId: t.categoryId,
    notes: undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generateExportFilename(baseName: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${baseName}_${date}.${extension}`;
}
