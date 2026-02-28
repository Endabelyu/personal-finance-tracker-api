import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { createRequestHandler } from 'react-router';

import apiRoutes from './routes';

const app = new Hono();

// Middleware
app.use(logger());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(secureHeaders());

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.route('/api', apiRoutes);

// Serve static assets from build/client
app.use('/assets/*', async (c) => {
  const fs = await import('fs');
  const path = await import('path');
  const filePath = path.join(process.cwd(), 'build/client', c.req.path);
  
  try {
    const file = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1);
    const contentType: Record<string, string> = {
      js: 'application/javascript',
      css: 'text/css',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      json: 'application/json',
      ico: 'image/x-icon',
    };
    return c.newResponse(file, 200, { 'Content-Type': contentType[ext] || 'application/octet-stream' });
  } catch {
    return c.notFound();
  }
});

// Serve other static files (root level)
app.use('/sw.js', async (c) => {
  const fs = await import('fs');
  const path = await import('path');
  try {
    const file = fs.readFileSync(path.join(process.cwd(), 'build/client/sw.js'));
    return c.newResponse(file, 200, { 'Content-Type': 'application/javascript' });
  } catch {
    return c.notFound();
  }
});

// React Router handler (catch-all for SSR)
app.all('*', async (c) => {
  try {
    // Use Function constructor to avoid TypeScript module resolution
    const dynamicImport = new Function('path', 'return import(path)');
    // eslint-disable-next-line
    const build = await dynamicImport('../build/server').catch((e: Error) => {
      console.error('Failed to load build:', e);
      return null;
    }) as any;
    
    if (!build || !build.default) {
      console.error('Build not found or invalid');
      return c.json({ error: 'Build not found' }, 500);
    }
    
    const handler = createRequestHandler({
      build: build.default,
      mode: process.env.NODE_ENV as 'development' | 'production',
    } as any);
    
    return handler(c.req.raw);
  } catch (error) {
    console.error('SSR Error:', error);
    return c.json({ error: 'SSR failed', details: String(error) }, 500);
  }
});

// Error handler
app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// Not found handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Start server
const port = parseInt(process.env.PORT || '3005');
console.log(`🚀 Server starting on port ${port}...`);
console.log(`📁 CWD: ${process.cwd()}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);

const server = serve({
  fetch: app.fetch,
  port,
}, (info: { port: number }) => {
  console.log(`✅ Server running on http://localhost:${info.port}`);
});

// Explicitly handle termination signals to ensure graceful shutdown
// and to keep the event loop alive.
const gracefulShutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});
