import { Hono } from 'hono';
import { auth } from '@server/lib/auth';

const app = new Hono();

/**
 * Mount Better Auth handler at /api/auth/**
 * This handles all auth routes:
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 */
app.all('/*', async (c) => {
  console.log(`[AUTH] Env URL: ${process.env.BETTER_AUTH_URL}`);
  console.log(`[AUTH] Resolved baseURL: ${auth.options.baseURL}`);
  console.log(`[AUTH] Incoming request path: ${c.req.raw.url}`);
  const response = await auth.handler(c.req.raw);
  console.log(`[AUTH] Better Auth responded with status: ${response.status}`);
  return response;
});

export default app;
export type AuthApp = typeof app;
