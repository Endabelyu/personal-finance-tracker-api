import { initSentry, sentryMiddleware } from './lib/sentry';
// Sentry must be initialised before any other imports that might throw
initSentry();

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import apiRoutes from './routes';
import { monitoringMiddleware, getMetrics, getPrometheusMetrics, logMetricsSnapshot } from './lib/monitoring';
import { logger as appLogger } from './lib/logger';

const app = new Hono();

// Middleware
app.use(honoLogger());
app.use('*', monitoringMiddleware as any);
app.use('*', sentryMiddleware as any);
app.use(cors({
  origin: (origin) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return origin || '*';
    return null;
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Trace-ID'],
  exposeHeaders: ['X-Trace-ID'],
}));
app.use(secureHeaders());

// Error handlers
process.on('uncaughtException', (err) => {
  appLogger.error('[Uncaught Exception]', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  appLogger.error('[Unhandled Rejection]', { reason: String(reason) });
});

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/livez', (c) => c.json({ status: 'ok' }));
app.get('/readyz', (c) => c.json({ status: 'ok' }));

// Metrics endpoint — Prometheus format (or JSON if requested)
app.get('/metrics', (c) => {
  const accept = c.req.header('Accept');
  if (accept && accept.includes('application/json')) {
    return c.json(getMetrics());
  }
  return c.text(getPrometheusMetrics());
});

// API routes
app.route('/api', apiRoutes);

// Root — API info
app.get('/', (c) => c.json({
  name: 'Personal Finance Tracker API',
  version: '1.0.0',
  docs: '/docs',
  metrics: '/metrics',
}));

// Basic API Documentation
app.get('/docs', (c) => c.html(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation | Finance Tracker</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
      h1 { color: #2563eb; }
      h2 { color: #1e40af; margin-top: 2rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
      code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #be123c; }
      ul { background: #f8fafc; padding: 1.5rem 2.5rem; border-radius: 8px; border: 1px solid #e2e8f0; }
      li { margin-bottom: 0.5rem; }
      .notice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 1rem; margin-top: 2rem; }
    </style>
  </head>
  <body>
    <h1>Personal Finance Tracker API</h1>
    <p>Welcome to the headless backend API. This server provides pure JSON data to the frontend React application.</p>
    
    <h2>Endpoint Directory</h2>
    <ul>
      <li><code>GET /health</code> — Server health status</li>
      <li><code>GET /metrics</code> — Prometheus performance metrics</li>
      <li><code>/api/auth/*</code> — Authentication & user sessions (Better Auth)</li>
      <li><code>/api/transactions/*</code> — Manage incomes and expenses</li>
      <li><code>/api/budgets/*</code> — Manage monthly budgets</li>
      <li><code>/api/categories/*</code> — Manage transaction categories</li>
      <li><code>/api/reports/*</code> — Generate financial analytics & charts</li>
      <li><code>/api/export/*</code> — Export data to CSV</li>
    </ul>

    <div class="notice">
      <strong>Note on OpenAPI/Swagger:</strong>
      <p>This API is built using native Hono routing. A fully interactive OpenAPI (Swagger) dashboard is not auto-generated because the routes do not currently use the <code>@hono/zod-openapi</code> wrapper. To enable Swagger UI, the core routes would need to be migrated to OpenAPI-specific syntax.</p>
    </div>
  </body>
  </html>
`));

// Error handler
app.onError((err, c) => {
  appLogger.error('Server Error', { error: err.message, stack: err.stack });
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// Not found handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Start server
const port = parseInt(process.env.PORT || '3005');
appLogger.info('Server starting', { port, cwd: process.cwd(), env: process.env.NODE_ENV });

serve({
  fetch: app.fetch,
  port,
}, (info: { port: number }) => {
  appLogger.info('Server running', { url: `http://localhost:${info.port}` });
  setInterval(logMetricsSnapshot, 5 * 60 * 1000).unref();
});
