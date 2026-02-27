import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { readConfig } from '../utils/config.js';
import { loadTemplate, processTemplate, createTemplateVars, pluralize, toKebabCase } from '../utils/template.js';

type GeneratorType = 'model' | 'service' | 'controller' | 'test';

interface GeneratorOptions {
  type: GeneratorType;
  name: string;
}

async function generateModel(name: string): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error('No .financeai.json found. Run "financeai init" first.');
  }

  const vars = createTemplateVars(name);
  const schemaDir = path.resolve(config.paths.schema);
  const outputPath = path.join(schemaDir, `${toKebabCase(name)}.ts`);

  if (await fs.pathExists(outputPath)) {
    throw new Error(`Model ${name} already exists at ${outputPath}`);
  }

  const template = await loadTemplate('model');
  const processed = processTemplate(template, vars);

  await fs.ensureDir(schemaDir);
  await fs.writeFile(outputPath, processed, 'utf-8');

  console.log(chalk.green(`  ✓ Created model: ${path.relative(process.cwd(), outputPath)}`));
}

async function generateService(name: string): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error('No .financeai.json found. Run "financeai init" first.');
  }

  const vars = createTemplateVars(name);
  const servicesDir = path.resolve('./server/services');
  const outputPath = path.join(servicesDir, `${toKebabCase(pluralize(name))}.ts`);

  if (await fs.pathExists(outputPath)) {
    throw new Error(`Service ${name} already exists at ${outputPath}`);
  }

  const template = await loadTemplate('service');
  const processed = processTemplate(template, vars);

  await fs.ensureDir(servicesDir);
  await fs.writeFile(outputPath, processed, 'utf-8');

  console.log(chalk.green(`  ✓ Created service: ${path.relative(process.cwd(), outputPath)}`));
}

async function generateController(name: string): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error('No .financeai.json found. Run "financeai init" first.');
  }

  const vars = createTemplateVars(name);
  const routesDir = path.resolve(config.paths.routes);
  const outputPath = path.join(routesDir, `${toKebabCase(pluralize(name))}.ts`);

  if (await fs.pathExists(outputPath)) {
    throw new Error(`Controller ${name} already exists at ${outputPath}`);
  }

  const template = await loadTemplate('controller');
  const processed = processTemplate(template, vars);

  await fs.ensureDir(routesDir);
  await fs.writeFile(outputPath, processed, 'utf-8');

  console.log(chalk.green(`  ✓ Created controller: ${path.relative(process.cwd(), outputPath)}`));
  console.log(chalk.gray(`    Don't forget to add the route to your main app!`));
}

async function generateTest(name: string): Promise<void> {
  const config = await readConfig();
  if (!config) {
    throw new Error('No .financeai.json found. Run "financeai init" first.');
  }

  const vars = createTemplateVars(name);
  const testsDir = path.resolve(config.paths.tests);
  const outputPath = path.join(testsDir, `${toKebabCase(pluralize(name))}.test.ts`);

  if (await fs.pathExists(outputPath)) {
    throw new Error(`Test ${name} already exists at ${outputPath}`);
  }

  const template = await loadTemplate('test');
  const processed = processTemplate(template, vars);

  await fs.ensureDir(testsDir);
  await fs.writeFile(outputPath, processed, 'utf-8');

  console.log(chalk.green(`  ✓ Created test: ${path.relative(process.cwd(), outputPath)}`));
}

export async function generate(type: GeneratorType, name: string): Promise<void> {
  console.log(chalk.bold.blue(`\n📝 Generating ${type}: ${name}\n`));

  const spinner = ora('Generating...').start();

  try {
    switch (type) {
      case 'model':
        spinner.stop();
        await generateModel(name);
        break;
      case 'service':
        spinner.stop();
        await generateService(name);
        break;
      case 'controller':
        spinner.stop();
        await generateController(name);
        break;
      case 'test':
        spinner.stop();
        await generateTest(name);
        break;
      default:
        throw new Error(`Unknown generator type: ${type}`);
    }

    console.log();
    console.log(chalk.green('✨ Generation complete!'));
  } catch (error) {
    spinner.fail(chalk.red('Generation failed'));
    throw error;
  }
}
