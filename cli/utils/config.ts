import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = '.financeai.json';

export interface FinanceAIConfig {
  name: string;
  version: string;
  database: {
    dialect: 'postgresql' | 'mysql' | 'sqlite';
    url: string;
  };
  paths: {
    schema: string;
    migrations: string;
    routes: string;
    tests: string;
  };
  createdAt: string;
}

export const defaultConfig: FinanceAIConfig = {
  name: 'personal-finance-tracker',
  version: '1.0.0',
  database: {
    dialect: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/financetracker',
  },
  paths: {
    schema: './db/schema',
    migrations: './db/migrations',
    routes: './server/routes',
    tests: './tests',
  },
  createdAt: new Date().toISOString(),
};

export async function readConfig(cwd: string = process.cwd()): Promise<FinanceAIConfig | null> {
  const configPath = path.join(cwd, CONFIG_FILE);
  
  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  try {
    const content = await fs.readJson(configPath);
    return content as FinanceAIConfig;
  } catch (error) {
    throw new Error(`Failed to parse ${CONFIG_FILE}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function writeConfig(
  config: Partial<FinanceAIConfig>,
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = path.join(cwd, CONFIG_FILE);
  const fullConfig: FinanceAIConfig = {
    ...defaultConfig,
    ...config,
    createdAt: new Date().toISOString(),
  };

  await fs.writeJson(configPath, fullConfig, { spaces: 2 });
}

export async function configExists(cwd: string = process.cwd()): Promise<boolean> {
  const configPath = path.join(cwd, CONFIG_FILE);
  return fs.pathExists(configPath);
}

export function getConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, CONFIG_FILE);
}