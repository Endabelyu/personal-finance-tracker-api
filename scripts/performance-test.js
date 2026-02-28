#!/usr/bin/env node
/**
 * Performance Testing Suite
 * Tests: Response time, throughput, memory usage, P95/P99 latency
 */

const autocannon = require('autocannon');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3005';
const RESULTS_DIR = path.join(__dirname, '..', 'test-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const resultsFile = path.join(RESULTS_DIR, `performance-${timestamp}.json`);

console.log('🚀 Starting Performance Tests...');
console.log(`Target: ${BASE_URL}`);
console.log('');

// Test configurations
const tests = [
  {
    name: 'Health Check - Light Load',
    path: '/health',
    connections: 10,
    duration: 30,
    pipelining: 1,
  },
  {
    name: 'API - Moderate Load',
    path: '/api/health',
    connections: 50,
    duration: 30,
    pipelining: 10,
  },
  {
    name: 'Stress Test - Heavy Load',
    path: '/health',
    connections: 100,
    duration: 60,
    pipelining: 10,
  },
  {
    name: 'Spike Test - Burst',
    path: '/health',
    connections: 200,
    duration: 15,
    pipelining: 1,
  },
];

const results = {
  timestamp: new Date().toISOString(),
  target: BASE_URL,
  tests: [],
};

async function runTest(config) {
  console.log(`\n📊 Running: ${config.name}`);
  console.log(`   Connections: ${config.connections}, Duration: ${config.duration}s`);

  const instance = autocannon({
    url: `${BASE_URL}${config.path}`,
    connections: config.connections,
    duration: config.duration,
    pipelining: config.pipelining,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await autocannon.track(instance, {
    renderProgressBar: true,
    renderResultsTable: true,
  });

  const testResult = {
    name: config.name,
    config,
    metrics: {
      requestsPerSecond: result.requests.average,
      latency: {
        average: result.latency.average,
        min: result.latency.min,
        max: result.latency.max,
        p50: result.latency.p50,
        p75: result.latency.p75,
        p90: result.latency.p90,
        p95: result.latency.p95,
        p99: result.latency.p99,
      },
      throughput: {
        average: result.throughput.average,
        min: result.throughput.min,
        max: result.throughput.max,
      },
      errors: result.errors,
      timeouts: result.timeouts,
    },
  };

  // Print summary
  console.log(`\n   ✅ RPS: ${testResult.metrics.requestsPerSecond.toFixed(2)}`);
  console.log(`   ⏱️  Latency: Avg=${testResult.metrics.latency.average}ms, P95=${testResult.metrics.latency.p95}ms, P99=${testResult.metrics.latency.p99}ms`);
  console.log(`   📈 Throughput: ${(testResult.metrics.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`   ❌ Errors: ${testResult.metrics.errors}`);

  return testResult;
}

async function runMemoryProfile() {
  console.log('\n🧠 Running Memory Profile...');
  
  const memBefore = process.memoryUsage();
  
  // Run a sustained load test
  const instance = autocannon({
    url: `${BASE_URL}/health`,
    connections: 50,
    duration: 60,
  });

  await autocannon.track(instance);
  
  // Force GC if available
  if (global.gc) {
    global.gc();
  }
  
  const memAfter = process.memoryUsage();
  
  const memoryResult = {
    name: 'Memory Profile',
    heapUsed: {
      before: Math.round(memBefore.heapUsed / 1024 / 1024),
      after: Math.round(memAfter.heapUsed / 1024 / 1024),
      delta: Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024),
    },
    rss: {
      before: Math.round(memBefore.rss / 1024 / 1024),
      after: Math.round(memAfter.rss / 1024 / 1024),
    },
  };

  console.log(`   Heap Used: ${memoryResult.heapUsed.before}MB → ${memoryResult.heapUsed.after}MB (${memoryResult.heapUsed.delta >= 0 ? '+' : ''}${memoryResult.heapUsed.delta}MB)`);
  
  return memoryResult;
}

async function main() {
  try {
    // Check if server is running
    try {
      execSync(`curl -s -o nul -w "%{http_code}" ${BASE_URL}/health`, { stdio: 'pipe' });
      console.log('✅ Server is running');
    } catch {
      console.error('❌ Server is not running at', BASE_URL);
      console.log('   Please start the server first: npm run dev');
      process.exit(1);
    }

    // Run all tests
    for (const test of tests) {
      const result = await runTest(test);
      results.tests.push(result);
    }

    // Run memory profile
    const memoryResult = await runMemoryProfile();
    results.tests.push(memoryResult);

    // Save results
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));
    
    results.tests.forEach(test => {
      if (test.metrics && test.metrics.requestsPerSecond) {
        const passed = test.metrics.latency.p95 < 500 && test.metrics.errors === 0;
        console.log(`${passed ? '✅' : '⚠️'}  ${test.name}`);
        console.log(`   RPS: ${test.metrics.requestsPerSecond.toFixed(0)} | P95: ${test.metrics.latency.p95}ms | Errors: ${test.metrics.errors}`);
      }
    });
    
    console.log('\n📁 Results saved to:', resultsFile);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
