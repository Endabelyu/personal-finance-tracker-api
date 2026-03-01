import { redirect } from 'react-router';
// auth is a server-only import - this file must only be imported in .server.ts files or loaders
import { auth } from '@server/lib/auth';

/**
 * Session data returned from requireSession
 */
export interface SessionData {
  userId: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

/**
 * Require an authenticated session, redirect to /auth/login if not authenticated.
 * Uses Better Auth server API directly — no HTTP round-trip.
 */
export async function requireSession(request: Request): Promise<SessionData> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || !session.user) {
    throw redirect('/auth/login');
  }

  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
  };
}

/**
 * Get session if it exists, return null otherwise (doesn't redirect)
 */
export async function getSession(request: Request): Promise<SessionData | null> {
  try {
    return await requireSession(request);
  } catch {
    return null;
  }
}

/**
 * Redirect to dashboard if already authenticated
 * Use in auth pages (login/register) to prevent access when logged in
 */
export async function requireAnonymous(request: Request): Promise<void> {
  const session = await getSession(request);
  if (session) {
    throw redirect('/');
  }
}
