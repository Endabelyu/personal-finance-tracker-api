import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { writeConfig, configExists, getConfigPath, type FinanceAIConfig } from '../utils/config.js';

export async function init(): Promise<void> {
  console.log(chalk.bold.blue('\n🚀 FinanceAI CLI - Initialize Project\n'));

  const exists = await configExists();
  if (exists) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: chalk.yellow('.financeai.json already exists. Overwrite?'),
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.gray('Initialization cancelled.'));
      return;
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: 'personal-finance-tracker',
    },
    {
      type: 'list',
      name: 'databaseDialect',
      message: 'Database dialect:',
      choices: ['postgresql', 'mysql', 'sqlite'],
      default: 'postgresql',
    },
    {
      type: 'input',
      name: 'databaseUrl',
      message: 'Database URL:',
      default: 'postgresql://postgres:password@localhost:5432/financetracker',
    },
    {
      type: 'input',
      name: 'schemaPath',
      message: 'Schema directory:',
      default: './db/schema',
    },
    {
      type: 'input',
      name: 'migrationsPath',
      message: 'Migrations directory:',
      default: './db/migrations',
    },
    {
      type: 'input',
      name: 'routesPath',
      message: 'Routes directory:',
      default: './server/routes',
    },
    {
      type: 'input',
      name: 'testsPath',
      message: 'Tests directory:',
      default: './tests',
    },
  ]);

  const spinner = ora('Creating configuration...').start();

  try {
    const config: Partial<FinanceAIConfig> = {
      name: answers.name,
      database: {
        dialect: answers.databaseDialect,
        url: answers.databaseUrl,
      },
      paths: {
        schema: answers.schemaPath,
        migrations: answers.migrationsPath,
        routes: answers.routesPath,
        tests: answers.testsPath,
      },
    };

    await writeConfig(config);

    spinner.succeed(chalk.green('Configuration created successfully!'));
    console.log(chalk.gray(`  → ${getConfigPath()}`));
    console.log();
    console.log(chalk.blue('Next steps:'));
    console.log(`  ${chalk.gray('1.')} Run ${chalk.cyan('financeai db:migration')} to create initial migration`);
    console.log(`  ${chalk.gray('2.')} Run ${chalk.cyan('financeai db:push')} to apply migrations`);
    console.log(`  ${chalk.gray('3.')} Run ${chalk.cyan('financeai db:seed')} to seed initial data`);
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Failed to create configuration'));
    throw error;
  }
}
