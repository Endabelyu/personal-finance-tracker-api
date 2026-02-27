import { Hono } from 'hono';
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
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.route('/api', apiRoutes);

// React Router handler (catch-all for client-side routes)
app.all('*', async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const build = await import('../build/server') as any;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = createRequestHandler({
    build: build.default,
    mode: process.env.NODE_ENV as 'development' | 'production',
  } as any);
  
  return handler(c.req.raw);
});

// Error handler
app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json(
    { error: 'Internal Server Error', message: err.message },
    500
  );
});

// Not found handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Start server
const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};