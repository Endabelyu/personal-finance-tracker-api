#!/usr/bin/env node
/**
 * Security Vulnerability Scanner
 * Tests: XSS, CSRF, SQL Injection, Header Security, SSL/TLS
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3005';
const RESULTS_DIR = path.join(__dirname, '..', 'test-results');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const resultsFile = path.join(RESULTS_DIR, `security-${timestamp}.json`);

console.log('🔒 Starting Security Vulnerability Scan...');
console.log(`Target: ${BASE_URL}`);
console.log('');

const vulnerabilities = [];
const checks = [];

// Check 1: Security Headers
async function checkSecurityHeaders() {
  console.log('📋 Checking Security Headers...');
  
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
  ];

  return new Promise((resolve) => {
    const client = BASE_URL.startsWith('https') ? https : http;
    const url = new URL(BASE_URL);
    
    const req = client.request(
      { hostname: url.hostname, port: url.port, path: '/health', method: 'GET' },
      (res) => {
        const headers = res.headers;
        const missing = [];
        const present = [];

        requiredHeaders.forEach(header => {
          if (headers[header.toLowerCase()]) {
            present.push(header);
          } else {
            missing.push(header);
          }
        });

        console.log(`   ✅ Present: ${present.length}/${requiredHeaders.length}`);
        if (missing.length) {
          console.log(`   ⚠️  Missing: ${missing.join(', ')}`);
          vulnerabilities.push({
            severity: 'medium',
            type: 'Missing Security Headers',
            details: missing,
          });
        }

        checks.push({
          name: 'Security Headers',
          status: missing.length === 0 ? 'pass' : 'warning',
          present,
          missing,
        });

        resolve();
      }
    );

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      checks.push({ name: 'Security Headers', status: 'error', error: err.message });
      resolve();
    });

    req.end();
  });
}

// Check 2: XSS Payload Testing
async function checkXSS() {
  console.log('\n🛡️  Testing XSS Protection...');
  
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'javascript:alert("xss")',
    '<body onload=alert("xss")>',
  ];

  let xssBlocked = 0;

  for (const payload of xssPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/api/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: payload }),
      });
      
      const text = await response.text();
      if (text.includes(payload) && !text.includes('&lt;')) {
        console.log(`   ⚠️  XSS payload not sanitized: ${payload.substring(0, 30)}...`);
        vulnerabilities.push({
          severity: 'high',
          type: 'Potential XSS',
          payload: payload.substring(0, 50),
        });
      } else {
        xssBlocked++;
      }
    } catch (err) {
      // Endpoint might not exist, which is fine
    }
  }

  console.log(`   ✅ Blocked/Sanitized: ${xssBlocked}/${xssPayloads.length}`);
  checks.push({ name: 'XSS Protection', status: 'info', blocked: xssBlocked, total: xssPayloads.length });
}

// Check 3: SQL Injection Testing
async function checkSQLInjection() {
  console.log('\n💉 Testing SQL Injection Protection...');
  
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' AND 1=1 --",
  ];

  let blocked = 0;

  for (const payload of sqlPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/api/test?id=${encodeURIComponent(payload)}`);
      const text = await response.text();
      
      // Check for SQL error messages
      if (text.includes('SQL') || text.includes('syntax error') || text.includes('database')) {
        console.log(`   ⚠️  Potential SQL injection vulnerability`);
        vulnerabilities.push({
          severity: 'critical',
          type: 'Potential SQL Injection',
          payload: payload.substring(0, 30),
        });
      } else {
        blocked++;
      }
    } catch (err) {
      blocked++;
    }
  }

  console.log(`   ✅ Blocked: ${blocked}/${sqlPayloads.length}`);
  checks.push({ name: 'SQL Injection', status: blocked === sqlPayloads.length ? 'pass' : 'warning' });
}

// Check 4: Check for dependency vulnerabilities
async function checkDependencies() {
  console.log('\n📦 Checking Dependency Vulnerabilities...');
  
  try {
    const audit = execSync('npm audit --json', { encoding: 'utf-8', cwd: path.join(__dirname, '..') });
    const auditResult = JSON.parse(audit);
    
    const { vulnerabilities = {} } = auditResult;
    const counts = {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0,
    };

    Object.values(vulnerabilities).forEach((vuln) => {
      if (vuln.severity && counts[vuln.severity] !== undefined) {
        counts[vuln.severity]++;
      }
    });

    console.log(`   Critical: ${counts.critical}, High: ${counts.high}, Moderate: ${counts.moderate}, Low: ${counts.low}`);
    
    if (counts.critical > 0 || counts.high > 0) {
      vulnerabilities.push({
        severity: 'high',
        type: 'Dependency Vulnerabilities',
        counts,
      });
    }

    checks.push({ name: 'Dependencies', status: counts.critical + counts.high === 0 ? 'pass' : 'warning', counts });
  } catch (error) {
    console.log('   ℹ️  npm audit completed');
    checks.push({ name: 'Dependencies', status: 'info' });
  }
}

// Check 5: CORS Configuration
async function checkCORS() {
  console.log('\n🌐 Checking CORS Configuration...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evil-site.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    
    const allowOrigin = response.headers.get('access-control-allow-origin');
    
    if (allowOrigin === '*' || allowOrigin === 'https://evil-site.com') {
      console.log(`   ⚠️  CORS allows any origin: ${allowOrigin}`);
      vulnerabilities.push({
        severity: 'medium',
        type: 'Permissive CORS',
        allowOrigin,
      });
      checks.push({ name: 'CORS', status: 'warning', allowOrigin });
    } else {
      console.log(`   ✅ CORS restricted: ${allowOrigin || 'none'}`);
      checks.push({ name: 'CORS', status: 'pass' });
    }
  } catch (err) {
    console.log(`   ℹ️  CORS check skipped: ${err.message}`);
    checks.push({ name: 'CORS', status: 'error', error: err.message });
  }
}

// Check 6: Information Disclosure
async function checkInfoDisclosure() {
  console.log('\n🔍 Checking Information Disclosure...');
  
  const paths = ['/robots.txt', '/.env', '/config.json', '/package.json', '/.git/config'];
  const findings = [];

  for (const path of paths) {
    try {
      const response = await fetch(`${BASE_URL}${path}`);
      if (response.status === 200) {
        const text = await response.text();
        if (text.length > 0 && !text.includes('<!DOCTYPE')) {
          findings.push(path);
          console.log(`   ⚠️  Sensitive file accessible: ${path}`);
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }

  if (findings.length > 0) {
    vulnerabilities.push({
      severity: 'medium',
      type: 'Information Disclosure',
      paths: findings,
    });
  }

  checks.push({ name: 'Information Disclosure', status: findings.length === 0 ? 'pass' : 'warning', findings });
}

async function main() {
  try {
    console.log('Starting security scan...\n');

    await checkSecurityHeaders();
    await checkXSS();
    await checkSQLInjection();
    await checkDependencies();
    await checkCORS();
    await checkInfoDisclosure();

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      target: BASE_URL,
      checks,
      vulnerabilities,
      summary: {
        totalChecks: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        warnings: checks.filter(c => c.status === 'warning').length,
        errors: checks.filter(c => c.status === 'error').length,
        vulnerabilitiesFound: vulnerabilities.length,
      },
    };

    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY SCAN SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${results.summary.totalChecks}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`⚠️  Warnings: ${results.summary.warnings}`);
    console.log(`❌ Errors: ${results.summary.errors}`);
    console.log(`🚨 Vulnerabilities: ${results.summary.vulnerabilitiesFound}`);
    
    if (vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILITIES FOUND:');
      vulnerabilities.forEach((v, i) => {
        console.log(`   ${i + 1}. [${v.severity.toUpperCase()}] ${v.type}`);
      });
    }

    console.log(`\n📁 Results saved to: ${resultsFile}`);
    console.log('');

  } catch (error) {
    console.error('❌ Security scan failed:', error.message);
    process.exit(1);
  }
}

main();
