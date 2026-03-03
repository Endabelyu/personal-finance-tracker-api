/**
 * Simple in-process rate limiter for Hono.
 * Uses a sliding window counter per IP address.
 * For production, replace with Redis-backed or edge-layer rate limiting.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

// Clean up expired windows every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of windows.entries()) {
    if (window.resetAt < now) windows.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * Create a rate limiter middleware.
 * @param maxRequests - max requests per window
 * @param windowMs - window duration in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: any, next: () => Promise<void>) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown';

    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    let win = windows.get(key);
    if (!win || win.resetAt < now) {
      win = { count: 0, resetAt: now + windowMs };
      windows.set(key, win);
    }

    win.count++;

    // Set rate limit headers
    c.res = c.res ?? {};
    c.header?.('X-RateLimit-Limit', String(maxRequests));
    c.header?.('X-RateLimit-Remaining', String(Math.max(0, maxRequests - win.count)));
    c.header?.('X-RateLimit-Reset', String(Math.ceil(win.resetAt / 1000)));

    if (win.count > maxRequests) {
      return c.json(
        { error: 'Too many requests, please slow down.' },
        429
      );
    }

    await next();
  };
}

/** Strict limiter: 20 writes per minute per IP (for POST/PUT/DELETE routes) */
export const writeLimiter = rateLimit(20, 60_000);

/** Lax limiter: 120 reads per minute per IP (for GET routes) */
export const readLimiter = rateLimit(120, 60_000);
