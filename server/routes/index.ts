import { Hono } from 'hono';
import transactions from './transactions';
import budgets from './budgets';
import categories from './categories';
import reports from './reports';
import auth from './auth';
import exportRoutes from './export';

const app = new Hono();

// Mount auth routes at /api/auth
app.route('/auth', auth);

// Mount API routes
app.route('/transactions', transactions);
app.route('/budgets', budgets);
app.route('/categories', categories);
app.route('/reports', reports);
app.route('/export', exportRoutes);

export default app;
export type AppRoutes = typeof app;
