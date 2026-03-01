import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Simple .env parser to avoid needing the 'dotenv' package
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (e) {
    console.log('No .env file found or could not be read.');
  }
}

async function checkDatabase() {
  loadEnv();
  
  const connectionString = process.env.DATABASE_URL;
  console.log('Checking database connection using:', connectionString);

  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set parsed.');
    return;
  }

  // Connect
  const sql = postgres(connectionString);

  try {
    console.log('✅ Successfully connected to the database.');

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log('⚠️ The database is empty. No tables found.');
    } else {
      console.log('📋 Tables found in the database:');
      tables.forEach(row => console.log(`  - ${row.table_name}`));
    }
  } catch (err) {
    console.error('❌ Database connection or query failed:');
    console.error(err.message);
  } finally {
    await sql.end();
  }
}

checkDatabase();
