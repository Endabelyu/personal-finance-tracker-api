#!/usr/bin/env node
/**
 * Production Monitoring Script
 * Continuously monitors app health, performance, and logs metrics
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3005';
const INTERVAL = parseInt(process.env.MONITOR_INTERVAL || '30000'); // 30 seconds
const LOG_FILE = process.env.MONITOR_LOG || path.join(__dirname, '..', 'logs', 'monitor.log');

// Ensure logs directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const metrics = {
  checks: 0,
  successes: 0,
  failures: 0,
  responseTimes: [],
  errors: [],
  startTime: Date.now(),
};

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, logLine + '\n');
}

async function checkHealth() {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    const duration = Date.now() - startTime;
    metrics.checks++;
    metrics.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (metrics.responseTimes.length > 100) {
      metrics.responseTimes.shift();
    }
    
    if (response.status === 200) {
      metrics.successes++;
      const data = await response.json().catch(() => null);
      
      // Check response time thresholds
      if (duration > 1000) {
        log(`⚠️  SLOW: Health check took ${duration}ms`);
      } else if (duration > 500) {
        log(`⚡ WARNING: Health check took ${duration}ms`);
      }
      
      return { status: 'ok', duration, data };
    } else {
      metrics.failures++;
      log(`❌ ERROR: Health check returned ${response.status}`);
      return { status: 'error', code: response.status, duration };
    }
  } catch (error) {
    metrics.checks++;
    metrics.failures++;
    const duration = Date.now() - startTime;
    
    const errorMsg = error.message;
    metrics.errors.push({ time: Date.now(), error: errorMsg });
    
    // Keep only last 50 errors
    if (metrics.errors.length > 50) {
      metrics.errors.shift();
    }
    
    log(`💥 FAIL: ${errorMsg}`);
    return { status: 'fail', error: errorMsg, duration };
  }
}

function calculateStats() {
  if (metrics.responseTimes.length === 0) return null;
  
  const sorted = [...metrics.responseTimes].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    count: sorted.length,
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

function printStats() {
  const stats = calculateStats();
  if (!stats) return;
  
  const uptime = ((metrics.successes / metrics.checks) * 100).toFixed(2);
  const runtime = Math.round((Date.now() - metrics.startTime) / 1000 / 60);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MONITORING STATS');
  console.log('='.repeat(60));
  console.log(`Runtime: ${runtime} minutes`);
  console.log(`Checks: ${metrics.checks} | Success: ${metrics.successes} | Fail: ${metrics.failures}`);
  console.log(`Uptime: ${uptime}%`);
  console.log(`\nResponse Times (last ${stats.count} requests):`);
  console.log(`  Avg: ${stats.avg}ms | Min: ${stats.min}ms | Max: ${stats.max}ms`);
  console.log(`  P50: ${stats.p50}ms | P95: ${stats.p95}ms | P99: ${stats.p99}ms`);
  
  if (metrics.errors.length > 0) {
    console.log(`\nRecent Errors (${metrics.errors.length}):`);
    metrics.errors.slice(-5).forEach(e => {
      console.log(`  - ${new Date(e.time).toLocaleTimeString()}: ${e.error}`);
    });
  }
  console.log('='.repeat(60) + '\n');
}

async function runCheck() {
  const result = await checkHealth();
  
  // Print simple status line
  const statusIcon = result.status === 'ok' ? '✅' : '❌';
  console.log(`${statusIcon} ${new Date().toLocaleTimeString()} - ${result.duration}ms`);
}

// Main monitoring loop
log('🚀 Starting Production Monitor');
log(`Target: ${BASE_URL}`);
log(`Interval: ${INTERVAL}ms`);
log(`Log file: ${LOG_FILE}`);
log('');

// Run initial check
runCheck();

// Schedule regular checks
const checkInterval = setInterval(runCheck, INTERVAL);

// Print stats every 5 minutes
const statsInterval = setInterval(printStats, 5 * 60 * 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Shutting down monitor...');
  clearInterval(checkInterval);
  clearInterval(statsInterval);
  printStats();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Shutting down monitor...');
  clearInterval(checkInterval);
  clearInterval(statsInterval);
  process.exit(0);
});

console.log('Monitor running. Press Ctrl+C to stop.\n');
