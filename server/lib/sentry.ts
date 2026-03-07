import * as Sentry from '@sentry/node';

/**
 * Initialise Sentry for the backend.
 * Must be called BEFORE any other imports (routes, DB, etc.) in index.ts.
 * Sentry is a no-op when SENTRY_DSN is not set — safe for local dev.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Only warn in production — it's expected to be unset in local dev
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Sentry] SENTRY_DSN not set — error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.npm_package_version,

    // Capture 100% of transactions in dev; lower in production via env var
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),

    integrations: [
      // Capture unhandled promise rejections automatically
      Sentry.onUnhandledRejectionIntegration({ mode: 'strict' }),
    ],

    beforeSend(event) {
      // Strip any accidentally included auth tokens from request headers
      if (event.request?.headers) {
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });

  console.info('[Sentry] Initialised — reporting to DSN (environment: ' + (process.env.NODE_ENV ?? 'development') + ')');
}

/**
 * Capture an exception manually (use in catch blocks where you re-throw).
 */
export function captureError(err: unknown, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}

/**
 * Hono middleware that captures unhandled 5xx errors in Sentry.
 */
export async function sentryMiddleware(
  c: { req: { path: string; method: string }; res?: { status: number } },
  next: () => Promise<void>
) {
  try {
    await next();
    const status = (c.res as any)?.status ?? 200;
    if (status >= 500) {
      Sentry.addBreadcrumb({
        message: `${c.req.method} ${c.req.path} → ${status}`,
        level: 'error',
      });
    }
  } catch (err) {
    captureError(err, { path: c.req.path, method: c.req.method });
    throw err; // re-throw so Hono error handler still runs
  }
}
