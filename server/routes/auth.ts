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
  const response = await auth.handler(c.req.raw);
  return response;
});

export default app;
export type AuthApp = typeof app;
