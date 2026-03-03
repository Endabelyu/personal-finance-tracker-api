import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { createRequestHandler } from 'react-router';

import apiRoutes from './routes';
import { monitoringMiddleware, getMetrics, getPrometheusMetrics, logMetricsSnapshot } from './lib/monitoring';
import { logger as appLogger } from './lib/logger';

const app = new Hono();

// Middleware
app.use(honoLogger());
app.use('*', monitoringMiddleware as any);
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.BETTER_AUTH_URL || 'https://personal-finance-tracker.endabelyu.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(secureHeaders());

// Error handlers at the very top to catch any synchronous module loading errors
process.on('uncaughtException', (err) => {
  appLogger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  appLogger.error('Unhandled Rejection', { reason: String(reason) });
});

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

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

// Serve hashed assets (React Router build output) - immutable, 1 year cache
app.use(
  '/assets/*',
  serveStatic({
    root: './build/client',
    onFound: (_path, c) => {
      c.res.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

// Serve other static files (favicon, manifest, robots, sw.js, etc.) - 1 hour cache
app.use(
  '*',
  serveStatic({
    root: './build/client',
    onFound: (_path, c) => {
      c.res.headers.set('Cache-Control', 'public, max-age=3600');
    },
  })
);

// Initialize React Router SSR handler once at startup
// When compiled to build/custom-server/index.js, '../server/index.js' resolves to build/server/index.js
const isCompiledServer = import.meta.url.includes('custom-server');
const buildPath = isCompiledServer ? '../server/index.js' : '../build/server/index.js';

let rrHandler: ((request: Request) => Promise<Response>) | null = null;

async function getSSRHandler() {
  if (rrHandler) return rrHandler;

  const build = await import(/* @vite-ignore */ buildPath).catch((e: Error) => {
    appLogger.error('Failed to load React Router build', { error: e.message });
    return null;
  }) as any;

  if (!build) {
    appLogger.error('Build not found or could not be loaded');
    return null;
  }

  appLogger.info('React Router build loaded', { exports: Object.keys(build).length });

  rrHandler = createRequestHandler(
    build,
    process.env.NODE_ENV as 'development' | 'production',
  );

  return rrHandler;
}

// React Router handler (catch-all for SSR)
app.all('*', async (c) => {
  try {
    const handler = await getSSRHandler();

    if (!handler) {
      return c.json({ error: 'Build not found — run npm run build first' }, 500);
    }

    return handler(c.req.raw);
  } catch (error) {
    appLogger.error('SSR Error', { error: String(error) });
    return c.json({ error: 'SSR failed', details: String(error) }, 500);
  }
});

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

const server = serve({
  fetch: app.fetch,
  port,
}, (info: { port: number }) => {
  appLogger.info('Server running', { url: `http://localhost:${info.port}` });
  // Log p99/memory metrics every 5 minutes
  setInterval(logMetricsSnapshot, 5 * 60 * 1000).unref();
});
