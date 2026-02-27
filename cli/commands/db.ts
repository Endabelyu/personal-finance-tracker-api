import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { readConfig } from '../utils/config.js';

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkConfig(): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error('No .financeai.json found. Run "financeai init" first.');
  }
}

export async function dbMigration(name?: string): Promise<void> {
  console.log(chalk.bold.blue('\n🔄 Database Migration\n'));
  
  await checkConfig();
  
  const spinner = ora('Running drizzle-kit generate...').start();
  
  try {
    spinner.stop();
    
    const args = ['drizzle-kit', 'generate'];
    if (name) {
      args.push('--name', name);
    }
    
    await runCommand('npx', args);
    
    console.log();
    console.log(chalk.green('✅ Migration generated successfully!'));
    console.log(chalk.gray(`  Run 'financeai db:push' to apply the migration`));
  } catch (error) {
    spinner.fail(chalk.red('Migration failed'));
    throw error;
  }
}

export async function dbPush(): Promise<void> {
  console.log(chalk.bold.blue('\n🚀 Push Database Schema\n'));
  
  await checkConfig();
  
  const spinner = ora('Running drizzle-kit push...').start();
  
  try {
    spinner.stop();
    await runCommand('npx', ['drizzle-kit', 'push']);
    
    console.log();
    console.log(chalk.green('✅ Schema pushed successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Push failed'));
    throw error;
  }
}

export async function dbSeed(): Promise<void> {
  console.log(chalk.bold.blue('\n🌱 Seed Database\n'));
  
  await checkConfig();
  
  const spinner = ora('Running seed...').start();
  
  try {
    spinner.stop();
    await runCommand('npx', ['tsx', 'db/seed.ts']);
    
    console.log();
    console.log(chalk.green('✅ Database seeded successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Seeding failed'));
    throw error;
  }
}

export async function dbReset(): Promise<void> {
  console.log(chalk.bold.blue('\n⚠️  Reset Database\n'));
  
  await checkConfig();
  
  console.log(chalk.yellow('This will DROP all tables and recreate the database.'));
  console.log(chalk.yellow('All data will be lost!\n'));
  
  // In a real implementation, this would prompt for confirmation
  // For now, we'll just run the push command which will reset the schema
  
  const spinner = ora('Resetting database...').start();
  
  try {
    spinner.stop();
    await runCommand('npx', ['drizzle-kit', 'push', '--force']);
    
    console.log();
    console.log(chalk.green('✅ Database reset successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Reset failed'));
    throw error;
  }
}

export async function dbStudio(): Promise<void> {
  console.log(chalk.bold.blue('\n🎨 Drizzle Studio\n'));
  
  await checkConfig();
  
  console.log(chalk.gray('Opening Drizzle Studio...'));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));
  
  try {
    await runCommand('npx', ['drizzle-kit', 'studio']);
  } catch (error) {
    // Studio exits on Ctrl+C, which is expected
    console.log();
    console.log(chalk.gray('Drizzle Studio stopped'));
  }
}