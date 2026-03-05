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
  docs: '/api/health',
  metrics: '/metrics',
}));

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
