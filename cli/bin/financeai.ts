#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { init } from '../commands/init.js';
import { generate } from '../commands/generate.js';
import { dbMigration, dbPush, dbSeed, dbReset, dbStudio } from '../commands/db.js';
import { testRun, testWatch, testCoverage, testUi } from '../commands/test.js';

const program = new Command();

program
  .name('financeai')
  .description('FinanceAI CLI - Scaffold and manage your personal finance tracker')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize a new FinanceAI project configuration')
  .action(async () => {
    try {
      await init();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Generate commands
const generateCmd = program
  .command('generate')
  .alias('g')
  .description('Generate code files (model, service, controller, test)');

generateCmd
  .command('model <name>')
  .description('Generate a new Drizzle schema model')
  .action(async (name: string) => {
    try {
      await generate('model', name);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

generateCmd
  .command('service <name>')
  .description('Generate a new service class')
  .action(async (name: string) => {
    try {
      await generate('service', name);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

generateCmd
  .command('controller <name>')
  .description('Generate a new Hono controller/route')
  .action(async (name: string) => {
    try {
      await generate('controller', name);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

generateCmd
  .command('test <name>')
  .description('Generate a new Vitest test file')
  .action(async (name: string) => {
    try {
      await generate('test', name);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Database commands
program
  .command('db:migration')
  .alias('db:migrate')
  .description('Generate a new database migration using drizzle-kit')
  .option('-n, --name <name>', 'Migration name')
  .action(async (options: { name?: string }) => {
    try {
      await dbMigration(options.name);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('db:push')
  .description('Push database schema changes using drizzle-kit')
  .action(async () => {
    try {
      await dbPush();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('db:seed')
  .description('Seed the database with initial data')
  .action(async () => {
    try {
      await dbSeed();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('db:reset')
  .description('Reset the database (drops all data)')
  .action(async () => {
    try {
      await dbReset();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('db:studio')
  .description('Open Drizzle Studio for database management')
  .action(async () => {
    try {
      await dbStudio();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Test commands
const testCmd = program
  .command('test')
  .alias('t')
  .description('Run tests using Vitest');

testCmd
  .command('run [pattern]')
  .alias('r')
  .description('Run tests once')
  .action(async (pattern?: string) => {
    try {
      await testRun(pattern, false);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

testCmd
  .command('watch [pattern]')
  .alias('w')
  .description('Run tests in watch mode')
  .action(async (pattern?: string) => {
    try {
      await testWatch(pattern);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

testCmd
  .command('coverage')
  .alias('c')
  .description('Run tests with coverage report')
  .action(async () => {
    try {
      await testCoverage();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

testCmd
  .command('ui')
  .description('Run tests with Vitest UI')
  .action(async () => {
    try {
      await testUi();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Parse arguments
program.parse();