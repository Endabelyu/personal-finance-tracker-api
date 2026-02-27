import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth React client for client-side authentication
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
});

export type Session = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  session: {
    id: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};
/**
 * Helper hooks for common auth operations
 */
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(session: Session | null): session is NonNullable<Session> {
  return session !== null && session.user !== null;
}
