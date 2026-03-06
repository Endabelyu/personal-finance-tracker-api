import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from '@db/schema';
import { MiddlewareHandler } from 'hono';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    },
  }),
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.BETTER_AUTH_URL 
    : 'http://localhost:5173',
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    'http://finance-api.endabelyu.com',
    'http://finance-web.endabelyu.com',
    'http://localhost:3005',
    'http://localhost:3002',
    'http://localhost:5174',
    'http://localhost:5173',
  ]

});

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  await next();
};
