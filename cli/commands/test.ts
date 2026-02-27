import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';

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

export async function testRun(pattern?: string, watch: boolean = false): Promise<void> {
  console.log(chalk.bold.blue(watch ? '\n👀 Running Tests (Watch Mode)\n' : '\n🧪 Running Tests\n'));
  
  const spinner = ora('Starting tests...').start();
  
  try {
    spinner.stop();
    
    const args = ['vitest', 'run'];
    
    if (watch) {
      args.pop(); // Remove 'run' for watch mode
    }
    
    if (pattern) {
      args.push(pattern);
    }
    
    await runCommand('npx', args);
    
    if (!watch) {
      console.log();
      console.log(chalk.green('✅ Tests completed!'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Tests failed'));
    throw error;
  }
}

export async function testWatch(pattern?: string): Promise<void> {
  await testRun(pattern, true);
}

export async function testCoverage(): Promise<void> {
  console.log(chalk.bold.blue('\n📊 Running Tests with Coverage\n'));
  
  const spinner = ora('Generating coverage report...').start();
  
  try {
    spinner.stop();
    await runCommand('npx', ['vitest', 'run', '--coverage']);
    
    console.log();
    console.log(chalk.green('✅ Coverage report generated!'));
    console.log(chalk.gray('  Open coverage/index.html in your browser to view'));
  } catch (error) {
    spinner.fail(chalk.red('Coverage failed'));
    throw error;
  }
}

export async function testUi(): Promise<void> {
  console.log(chalk.bold.blue('\n🖥️  Running Tests with UI\n'));
  
  const spinner = ora('Starting Vitest UI...').start();
  
  try {
    spinner.stop();
    console.log(chalk.gray('Opening Vitest UI...'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));
    
    await runCommand('npx', ['vitest', '--ui']);
  } catch (error) {
    // UI exits on Ctrl+C, which is expected
    console.log();
    console.log(chalk.gray('Vitest UI stopped'));
  }
}