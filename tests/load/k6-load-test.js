/**
 * k6 Load Test — Finance Tracker API
 * Production Monitoring Guide §6.2
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run:
 *   k6 run tests/load/k6-load-test.js
 *   k6 run --env BASE_URL=https://api.yourdomain.com tests/load/k6-load-test.js
 *
 * Run modes:
 *   k6 run --env SCENARIO=baseline tests/load/k6-load-test.js  # 30 min baseline
 *   k6 run --env SCENARIO=load     tests/load/k6-load-test.js  # 1h peak load
 *   k6 run --env SCENARIO=stress   tests/load/k6-load-test.js  # 2x peak stress
 *   k6 run --env SCENARIO=spike    tests/load/k6-load-test.js  # 10x spike test
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SCENARIO = __ENV.SCENARIO || 'load';

// ── Custom metrics ─────────────────────────────────────────────────────────
const errorRate    = new Rate('custom_error_rate');
const latencyTrend = new Trend('custom_latency_ms', true);

// ── SLA thresholds (Production Monitoring Guide §13) ───────────────────────
const SLA_THRESHOLDS = {
  http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
  http_req_failed:   ['rate<0.01'],   // < 1% error rate
  custom_error_rate: ['rate<0.01'],
};

// ── Scenario definitions (§6.1) ────────────────────────────────────────────
const SCENARIOS = {
  baseline: {
    executor: 'constant-vus',
    vus: 10,
    duration: '30m',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m',  target: 50  },  // ramp up
      { duration: '55m', target: 50  },  // stay at peak (1h total)
      { duration: '3m',  target: 0   },  // ramp down
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '5m',  target: 100 },  // ramp to 2x peak
      { duration: '20m', target: 100 },
      { duration: '5m',  target: 0   },
    ],
  },
  spike: {
    executor: 'ramping-arrival-rate',
    startRate: 5,
    timeUnit: '1s',
    preAllocatedVUs: 500,
    maxVUs: 1000,
    stages: [
      { duration: '30s', target: 5   },  // normal
      { duration: '30s', target: 500 },  // spike: 10x in 30s
      { duration: '3m',  target: 5   },  // recover
      { duration: '1m',  target: 0   },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus: 15,
    duration: '48h',   // run with: k6 run --env SCENARIO=soak ...
  },
};

export const options = {
  scenarios: {
    [SCENARIO]: SCENARIOS[SCENARIO] || SCENARIOS.load,
  },
  thresholds: SLA_THRESHOLDS,
};

// ── Test payload ────────────────────────────────────────────────────────────
function testHealthEndpoint() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/health`);
  latencyTrend.add(Date.now() - start);

  const ok = check(res, {
    'health: status 200':       (r) => r.status === 200,
    'health: has status field':  (r) => r.json('status') === 'ok',
    'health: latency < 200ms':   (r) => r.timings.duration < 200,
  });
  errorRate.add(!ok);
}

function testMetricsEndpoint() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/metrics`);
  latencyTrend.add(Date.now() - start);

  check(res, {
    'metrics: status 200':      (r) => r.status === 200,
    'metrics: has content':     (r) => r.body.length > 100,
  });
}

function testApiWithAuth(sessionCookie) {
  const headers = { Cookie: sessionCookie };

  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/transactions`, { headers });
  latencyTrend.add(Date.now() - start);

  const ok = check(res, {
    'transactions: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'transactions: latency < 500ms':   (r) => r.timings.duration < 500,
  });
  errorRate.add(!ok);
}

// ── Main virtual user scenario ─────────────────────────────────────────────
export default function () {
  testHealthEndpoint();
  sleep(0.5);

  testMetricsEndpoint();
  sleep(0.5);

  // Unauthenticated API call (tests rate limiter, no-auth 401 path)
  testApiWithAuth('');
  sleep(1);
}

// ── Summary report (printed after run) ────────────────────────────────────
export function handleSummary(data) {
  const p50  = data.metrics.http_req_duration?.values?.['p(50)']  ?? 'N/A';
  const p95  = data.metrics.http_req_duration?.values?.['p(95)']  ?? 'N/A';
  const p99  = data.metrics.http_req_duration?.values?.['p(99)']  ?? 'N/A';
  const errRate = (data.metrics.http_req_failed?.values?.rate ?? 0) * 100;
  const reqs = data.metrics.http_reqs?.values?.count ?? 0;

  const passed = Object.values(data.root_group?.checks ?? {})
    .every(c => c.fails === 0);

  const summary = `
╔══════════════════════════════════════════╗
║      Finance Tracker — Load Test Results ║
╠══════════════════════════════════════════╣
║  Scenario    : ${SCENARIO.padEnd(26)}║
║  Total Reqs  : ${String(reqs).padEnd(26)}║
║  p50 Latency : ${(typeof p50 === 'number' ? p50.toFixed(1) + 'ms' : p50).padEnd(26)}║
║  p95 Latency : ${(typeof p95 === 'number' ? p95.toFixed(1) + 'ms' : p95).padEnd(26)}║
║  p99 Latency : ${(typeof p99 === 'number' ? p99.toFixed(1) + 'ms' : p99).padEnd(26)}║
║  Error Rate  : ${(errRate.toFixed(3) + '%').padEnd(26)}║
║  SLA Result  : ${(passed ? '✅ PASS' : '❌ FAIL').padEnd(26)}║
╚══════════════════════════════════════════╝
`;
  console.log(summary);

  return {
    'stdout': summary,
    'test-results/load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
