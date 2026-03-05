import { Hono } from 'hono';
import { auth } from '@server/lib/auth';

const app = new Hono();

/**
 * GET /api/auth/me — returns current user session.
 * Used by the SPA frontend to bootstrap auth state without SSR.
 */
app.get('/me', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) {
    return c.json({ user: null }, 401);
  }
  return c.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
  });
});

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
