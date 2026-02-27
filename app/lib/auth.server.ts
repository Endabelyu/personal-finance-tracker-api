// Re-export from session.ts for backward compatibility
// Use @app/lib/session for new code
export { requireSession, getSession, requireAnonymous } from './session';
export type { SessionData } from './session';
