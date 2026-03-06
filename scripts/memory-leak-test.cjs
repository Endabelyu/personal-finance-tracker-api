#!/usr/bin/env node
/**
 * Memory Leak Detection Test
 * Monitors heap usage over time under sustained load
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const RESULTS_DIR = path.join(__dirname, '..', 'test-results');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const resultsFile = path.join(RESULTS_DIR, `memory-leak-${timestamp}.json`);

console.log('🧠 Starting Memory Leak Detection Test...');
console.log(`Target: ${BASE_URL}`);
console.log('This test runs for 5 minutes to detect memory growth...\n');

const memorySnapshots = [];
let snapshotInterval;

function takeSnapshot(label) {
  if (global.gc) {
    global.gc();
  }
  
  const mem = process.memoryUsage();
  const snapshot = {
    timestamp: Date.now(),
    label,
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    rss: Math.round(mem.rss / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024),
    arrayBuffers: Math.round(mem.arrayBuffers / 1024 / 1024),
  };
  
  memorySnapshots.push(snapshot);
  return snapshot;
}

function analyzeMemoryGrowth() {
  console.log('\n📊 Memory Analysis:');
  console.log('='.repeat(60));
  
  if (memorySnapshots.length < 2) {
    console.log('Insufficient data for analysis');
    return null;
  }

  const first = memorySnapshots[0];
  const last = memorySnapshots[memorySnapshots.length - 1];
  const duration = (last.timestamp - first.timestamp) / 1000 / 60; // minutes

  // Calculate growth rates
  const heapGrowth = last.heapUsed - first.heapUsed;
  const heapGrowthRate = heapGrowth / duration;
  const rssGrowth = last.rss - first.rss;

  console.log(`Test Duration: ${duration.toFixed(1)} minutes`);
  console.log(`Snapshots Taken: ${memorySnapshots.length}`);
  console.log('');
  console.log('Heap Usage:');
  console.log(`  Start: ${first.heapUsed} MB`);
  console.log(`  End:   ${last.heapUsed} MB`);
  console.log(`  Growth: ${heapGrowth >= 0 ? '+' : ''}${heapGrowth} MB (${heapGrowthRate.toFixed(2)} MB/min)`);
  console.log('');
  console.log('RSS Usage:');
  console.log(`  Start: ${first.rss} MB`);
  console.log(`  End:   ${last.rss} MB`);
  console.log(`  Growth: ${rssGrowth >= 0 ? '+' : ''}${rssGrowth} MB`);
  console.log('');

  // Detect potential leak
  let leakStatus = 'clean';
  let leakConfidence = 'low';

  // Heuristics for memory leak detection
  if (heapGrowthRate > 5) {
    leakStatus = 'suspected';
    leakConfidence = 'high';
  } else if (heapGrowthRate > 1) {
    leakStatus = 'suspected';
    leakConfidence = 'medium';
  } else if (heapGrowthRate > 0.5) {
    leakStatus = 'warning';
    leakConfidence = 'low';
  }

  if (leakStatus !== 'clean') {
    console.log(`⚠️  Memory Leak ${leakStatus.toUpperCase()} (${leakConfidence} confidence)`);
    console.log(`   Growth rate of ${heapGrowthRate.toFixed(2)} MB/min is concerning`);
  } else {
    console.log('✅ No significant memory leak detected');
  }

  return {
    duration,
    heapGrowth,
    heapGrowthRate,
    rssGrowth,
    leakStatus,
    leakConfidence,
  };
}

async function runMemoryTest() {
  // Take baseline snapshot
  console.log('Taking baseline snapshot...');
  takeSnapshot('baseline');

  // Start periodic snapshots
  snapshotInterval = setInterval(() => {
    const snap = takeSnapshot('during-test');
    console.log(`💾 Snapshot: Heap=${snap.heapUsed}MB, RSS=${snap.rss}MB`);
  }, 30000); // Every 30 seconds

  // Run sustained load test
  console.log('\n🚀 Starting sustained load test (5 minutes)...\n');
  
  const instance = autocannon({
    url: `${BASE_URL}/health`,
    connections: 50,
    duration: 300, // 5 minutes
    pipelining: 5,
  });

  autocannon.track(instance, {
    renderProgressBar: true,
    renderResultsTable: false,
  });

  const result = await instance;

  // Stop snapshots
  clearInterval(snapshotInterval);

  // Take final snapshot
  console.log('\nTaking final snapshot...');
  takeSnapshot('final');

  // Analyze results
  const analysis = analyzeMemoryGrowth();

  const results = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    snapshots: memorySnapshots,
    performance: {
      requestsPerSecond: result.requests.average,
      latency: result.latency,
      errors: result.errors,
    },
    analysis,
  };

  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  console.log('\n📁 Results saved to:', resultsFile);
  console.log('');

  // Exit with error code if leak suspected
  if (analysis?.leakStatus === 'suspected' && analysis?.leakConfidence === 'high') {
    console.log('❌ High confidence memory leak detected!');
    process.exit(1);
  }
}

runMemoryTest().catch((err) => {
  console.error('❌ Memory test failed:', err.message);
  clearInterval(snapshotInterval);
  process.exit(1);
});
