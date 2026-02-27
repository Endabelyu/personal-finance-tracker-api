import { redirect } from 'react-router';
import type { Session } from '@app/lib/auth-client';

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
 * Require an authenticated session, redirect to /auth/login if not authenticated
 * Use in loaders that require authentication
 */
export async function requireSession(request: Request): Promise<SessionData> {
  const response = await fetch(`${new URL(request.url).origin}/api/auth/session`, {
    headers: {
      Cookie: request.headers.get('Cookie') || '',
    },
  });

  if (!response.ok) {
    throw redirect('/auth/login');
  }

  const data = await response.json() as { session: Session | null };

  if (!data.session || !data.session.user) {
    throw redirect('/auth/login');
  }

  return {
    userId: data.session.user.id,
    user: data.session.user,
  };
}

/**
 * Get session if it exists, return null otherwise (doesn't redirect)
 * Use in loaders that optionally need session data
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
    throw redirect('/dashboard');
  }
}
