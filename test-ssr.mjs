// Inspect entry.module specifically
process.env.DATABASE_URL = 'postgresql://deploy:naswa-1998@localhost:5432/finance-tracker';
process.env.BETTER_AUTH_SECRET = 'test-secret-that-is-at-least-32-chars-long';
process.env.BETTER_AUTH_URL = 'http://localhost:3002';
process.env.NODE_ENV = 'production';

async function test() {
  const build = await import('./build/server/index.js');
  
  console.log('=== entry ===');
  console.log('entry type:', typeof build.entry);
  console.log('entry keys:', build.entry ? Object.keys(build.entry) : 'NULL');
  
  if (build.entry) {
    console.log('entry.module type:', typeof build.entry.module);
    console.log('entry.module keys:', build.entry.module ? Object.keys(build.entry.module) : 'NULL/UNDEFINED');
    console.log('entry.module value:', JSON.stringify(build.entry.module).slice(0, 200));
  }
  
  console.log('\n=== routes (first 3) ===');
  if (build.routes) {
    const routeEntries = Object.entries(build.routes).slice(0, 3);
    for (const [id, route] of routeEntries) {
      console.log(`\n${id}:`);
      console.log('  module type:', typeof route.module);
      console.log('  module keys:', route.module ? Object.keys(route.module) : 'NULL/UNDEFINED');
    }
  }
}

test().catch(console.error);
