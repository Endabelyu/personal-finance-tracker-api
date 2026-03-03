/**
 * Monitoring Middleware
 * Tracks: request latency (p50/p95/p99), memory usage, error rate
 */

import { logger } from './logger';

interface LatencyBucket {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  count: number;
  errors: number;
}

// Rolling window of request durations (last 1000 requests)
const latencies: number[] = [];
const MAX_SAMPLES = 1000;
let totalErrors = 0;
let totalRequests = 0;

function recordLatency(ms: number, isError: boolean) {
  if (latencies.length >= MAX_SAMPLES) latencies.shift();
  latencies.push(ms);
  totalRequests++;
  if (isError) totalErrors++;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function getMetrics(): LatencyBucket & {
  errorRate: string;
  memory: NodeJS.MemoryUsage;
  uptime: number;
} {
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.length > 0
    ? sorted.reduce((s, v) => s + v, 0) / sorted.length
    : 0;

  return {
    count: totalRequests,
    errors: totalErrors,
    errorRate: totalRequests > 0
      ? `${((totalErrors / totalRequests) * 100).toFixed(2)}%`
      : '0%',
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    avg: Math.round(avg),
    memory: process.memoryUsage(),
    uptime: Math.round(process.uptime()),
  };
}

export function getPrometheusMetrics(): string {
  const m = getMetrics();
  return [
    `# HELP http_requests_total Total number of HTTP requests`,
    `# TYPE http_requests_total counter`,
    `http_requests_total ${m.count}`,
    
    `# HELP http_errors_total Total number of HTTP errors`,
    `# TYPE http_errors_total counter`,
    `http_errors_total ${m.errors}`,

    `# HELP http_request_duration_milliseconds_p50 P50 request latency in ms`,
    `# TYPE http_request_duration_milliseconds_p50 gauge`,
    `http_request_duration_milliseconds_p50 ${m.p50}`,

    `# HELP http_request_duration_milliseconds_p95 P95 request latency in ms`,
    `# TYPE http_request_duration_milliseconds_p95 gauge`,
    `http_request_duration_milliseconds_p95 ${m.p95}`,

    `# HELP http_request_duration_milliseconds_p99 P99 request latency in ms`,
    `# TYPE http_request_duration_milliseconds_p99 gauge`,
    `http_request_duration_milliseconds_p99 ${m.p99}`,

    `# HELP http_request_duration_milliseconds_avg Average request latency in ms`,
    `# TYPE http_request_duration_milliseconds_avg gauge`,
    `http_request_duration_milliseconds_avg ${m.avg}`,

    `# HELP process_uptime_seconds Process uptime in seconds`,
    `# TYPE process_uptime_seconds counter`,
    `process_uptime_seconds ${m.uptime}`,

    `# HELP nodejs_memory_heap_used_bytes Node.js heap memory used in bytes`,
    `# TYPE nodejs_memory_heap_used_bytes gauge`,
    `nodejs_memory_heap_used_bytes ${m.memory.heapUsed}`,

    `# HELP nodejs_memory_heap_total_bytes Node.js heap memory total in bytes`,
    `# TYPE nodejs_memory_heap_total_bytes gauge`,
    `nodejs_memory_heap_total_bytes ${m.memory.heapTotal}`,

    `# HELP nodejs_memory_rss_bytes Node.js RSS memory in bytes`,
    `# TYPE nodejs_memory_rss_bytes gauge`,
    `nodejs_memory_rss_bytes ${m.memory.rss}`
  ].join('\n') + '\n';
}

/**
 * Hono middleware that instruments every request with latency tracking.
 * Usage: app.use('*', monitoringMiddleware);
 */
export async function monitoringMiddleware(
  c: { req: { path: string }; res: { status: number } },
  next: () => Promise<void>
) {
  const start = Date.now();
  try {
    await next();
    const ms = Date.now() - start;
    const isError = (c.res?.status ?? 200) >= 500;
    recordLatency(ms, isError);

    // Log slow requests (> 500ms)
    if (ms > 500) {
      logger.warn(`Slow Request Detected`, { path: c.req.path, duration_ms: ms });
    }
  } catch (err) {
    const ms = Date.now() - start;
    recordLatency(ms, true);
    throw err;
  }
}

/**
 * Log a periodic snapshot of health metrics (call every N minutes via setInterval).
 */
export function logMetricsSnapshot() {
  const m = getMetrics();
  logger.info('Metrics Snapshot', {
    uptime_s: m.uptime,
    requests: m.count,
    errors: m.errors,
    errorRate: m.errorRate,
    latency_p50_ms: m.p50,
    latency_p95_ms: m.p95,
    latency_p99_ms: m.p99,
    latency_avg_ms: m.avg,
    heapUsed_MB: Math.round(m.memory.heapUsed / 1024 / 1024),
    heapTotal_MB: Math.round(m.memory.heapTotal / 1024 / 1024),
    rss_MB: Math.round(m.memory.rss / 1024 / 1024)
  });
}
