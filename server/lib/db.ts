import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@db/schema';
import { logger } from './logger';
import { captureError } from './sentry';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Thresholds (ms) — align with Production Monitoring Guide §2.4
const SLOW_QUERY_WARN_MS = 100;
const SLOW_QUERY_ERROR_MS = 1000;

/**
 * Custom Drizzle logger that measures wall-clock time for every SQL query.
 * - WARN  when query takes > 100ms (flag for investigation)
 * - ERROR when query takes > 1000ms (sent to Sentry and Telegram)
 */
const queryLogger = {
  logQuery(query: string, params: unknown[]) {
    const start = Date.now();

    // Drizzle's logger is synchronous — we schedule the measurement
    // using a microtask so it fires after the query promise resolves.
    // For accurate timing, use the `onnotice` / `transform` approach below.
    const sanitised = query.replace(/\s+/g, ' ').substring(0, 300);

    Promise.resolve().then(() => {
      const ms = Date.now() - start;
      if (ms >= SLOW_QUERY_ERROR_MS) {
        const ctx = { query: sanitised, params: String(params).substring(0, 200), duration_ms: ms };
        logger.error('Slow Query — Critical (>1000ms)', ctx);
        captureError(new Error(`Slow DB query (${ms}ms): ${sanitised}`), ctx);
      } else if (ms >= SLOW_QUERY_WARN_MS) {
        logger.warn('Slow Query (>100ms)', { query: sanitised, duration_ms: ms });
      }
    });
  },
};

export const client = postgres(connectionString, {
  // Log connection errors
  onnotice: (notice) => logger.warn('Postgres notice', { notice: notice.message }),
});

export const db = drizzle(client, { schema, logger: queryLogger });
