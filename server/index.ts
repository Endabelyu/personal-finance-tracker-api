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
  // Build is imported dynamically to avoid issues during development/build
  // when the build directory doesn't exist yet
  // @ts-expect-error - Build directory only exists after build
  const build = await import('../build/server');
  
  const handler = createRequestHandler({
    // @ts-expect-error - Build type is unknown at compile time
    build: build.default,
    mode: process.env.NODE_ENV as 'development' | 'production',
  });
  
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
