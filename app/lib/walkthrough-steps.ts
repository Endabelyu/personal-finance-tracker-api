import type { WalkthroughStep } from '@app/context/WalkthroughContext';

/**
 * Default walkthrough steps for the Finance Tracker app
 * Guides new users through key features
 */
export const defaultWalkthroughSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Finance Tracker!',
    description: 'Let\'s take a quick tour to help you get started with tracking your finances. You can skip this anytime by pressing Escape.',
    position: 'center',
    route: '/',
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Use the sidebar to navigate between different sections: Dashboard for an overview, Transactions to manage your income and expenses, Budget to set spending limits, and Reports for detailed analytics.',
    targetSelector: '[data-walkthrough="sidebar"]',
    position: 'right',
    route: '/',
  },
  {
    id: 'dashboard-stats',
    title: 'Your Financial Overview',
    description: 'The dashboard shows your key metrics at a glance: total balance, monthly income, expenses, and savings rate. These cards update automatically as you add transactions.',
    targetSelector: '[data-walkthrough="dashboard-stats"]',
    position: 'bottom',
    route: '/',
  },
  {
    id: 'dashboard-chart',
    title: 'Income vs Expenses',
    description: 'This chart visualizes your income and expenses over time. Use it to spot trends and understand your spending patterns better.',
    targetSelector: '[data-walkthrough="dashboard-chart"]',
    position: 'top',
    route: '/',
  },
  {
    id: 'transactions',
    title: 'Managing Transactions',
    description: 'Add your income and expenses here. Use filters to find specific transactions, and export your data anytime for external analysis.',
    targetSelector: '[data-walkthrough="transactions-header"]',
    position: 'bottom',
    route: '/transactions',
  },
  {
    id: 'add-transaction',
    title: 'Add Your First Transaction',
    description: 'Click this button to add a new transaction. You can also use the keyboard shortcut Cmd/Ctrl+N from anywhere in the app for quick access.',
    targetSelector: '[data-walkthrough="add-transaction"]',
    position: 'left',
    route: '/transactions',
  },
  {
    id: 'budget',
    title: 'Set Your Budgets',
    description: 'Create monthly spending limits for different categories. We\'ll track your progress and alert you when you\'re close to exceeding your budget.',
    targetSelector: '[data-walkthrough="budget-header"]',
    position: 'bottom',
    route: '/budget',
  },
  {
    id: 'reports',
    title: 'Detailed Reports',
    description: 'Get insights into your financial health with comprehensive reports. View spending by category, track savings rate over time, and analyze trends.',
    targetSelector: '[data-walkthrough="reports-header"]',
    position: 'bottom',
    route: '/reports',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Power users love our keyboard shortcuts! Cmd/Ctrl+N for new transactions, Cmd/Ctrl+K to search, and Escape to close modals. Look for shortcut hints throughout the app.',
    position: 'center',
    route: '/',
  },
  {
    id: 'help-menu',
    title: 'Help & Support',
    description: 'Access this tour anytime from the help menu in the header. You can also find theme settings and account options there.',
    targetSelector: '[data-walkthrough="help-menu"]',
    position: 'left',
    route: '/',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start tracking your finances. Remember, consistent tracking is the key to financial success. Happy budgeting! 🎉',
    position: 'center',
    route: '/',
  },
];

/**
 * Quick tour steps - shorter version for returning users
 */
export const quickTourSteps: WalkthroughStep[] = [
  {
    id: 'quick-start',
    title: 'Quick Tour',
    description: 'Here\'s a quick refresher on the key features.',
    position: 'center',
  },
  {
    id: 'quick-dashboard',
    title: 'Dashboard',
    description: 'View your financial summary and recent activity.',
    targetSelector: '[data-walkthrough="dashboard-stats"]',
    position: 'bottom',
    route: '/',
  },
  {
    id: 'quick-transactions',
    title: 'Transactions',
    description: 'Add and manage your income and expenses.',
    targetSelector: '[data-walkthrough="add-transaction"]',
    position: 'left',
    route: '/transactions',
  },
  {
    id: 'quick-budget',
    title: 'Budget',
    description: 'Set and monitor your spending limits.',
    targetSelector: '[data-walkthrough="budget-header"]',
    position: 'bottom',
    route: '/budget',
  },
];

/**
 * Feature-specific walkthroughs
 */
export const transactionsWalkthroughSteps: WalkthroughStep[] = [
  {
    id: 'transactions-intro',
    title: 'Transactions Page',
    description: 'This is where you manage all your financial entries.',
    position: 'center',
    route: '/transactions',
  },
  {
    id: 'transactions-filters',
    title: 'Filter & Search',
    description: 'Use filters to find specific transactions by date, type, category, or search keywords.',
    targetSelector: '[data-walkthrough="transactions-filters"]',
    position: 'bottom',
    route: '/transactions',
  },
  {
    id: 'transactions-add',
    title: 'Adding Transactions',
    description: 'Click here to add a new transaction. You can also drag and drop receipts for automatic entry.',
    targetSelector: '[data-walkthrough="add-transaction"]',
    position: 'left',
    route: '/transactions',
  },
  {
    id: 'transactions-export',
    title: 'Export Data',
    description: 'Download your transaction history as CSV for use in spreadsheets or accounting software.',
    targetSelector: '[data-walkthrough="transactions-export"]',
    position: 'left',
    route: '/transactions',
  },
];

export const budgetWalkthroughSteps: WalkthroughStep[] = [
  {
    id: 'budget-intro',
    title: 'Budget Management',
    description: 'Set monthly spending limits and track your progress.',
    position: 'center',
    route: '/budget',
  },
  {
    id: 'budget-month',
    title: 'Monthly Budgets',
    description: 'Budgets are organized by month. Select a month to view or edit its budgets.',
    targetSelector: '[data-walkthrough="budget-month"]',
    position: 'bottom',
    route: '/budget',
  },
  {
    id: 'budget-progress',
    title: 'Budget Progress',
    description: 'Each budget card shows your spending progress. Green means on track, yellow is a warning, and red means you\'ve exceeded the limit.',
    targetSelector: '[data-walkthrough="budget-progress"]',
    position: 'top',
    route: '/budget',
  },
];

export const reportsWalkthroughSteps: WalkthroughStep[] = [
  {
    id: 'reports-intro',
    title: 'Financial Reports',
    description: 'Analyze your financial data with detailed reports and visualizations.',
    position: 'center',
    route: '/reports',
  },
  {
    id: 'reports-date-range',
    title: 'Date Range',
    description: 'Select a specific month or date range to analyze.',
    targetSelector: '[data-walkthrough="reports-date-range"]',
    position: 'bottom',
    route: '/reports',
  },
  {
    id: 'reports-charts',
    title: 'Visual Analytics',
    description: 'Use the charts to understand your spending patterns, income trends, and savings rate over time.',
    targetSelector: '[data-walkthrough="reports-charts"]',
    position: 'top',
    route: '/reports',
  },
];
