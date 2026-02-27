import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

export interface TemplateVars {
  [key: string]: string;
}

export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '');
}

export function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '');
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function pluralize(str: string): string {
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  if (str.endsWith('y') && !/[aeiou]y$/.test(str)) {
    return str.slice(0, -1) + 'ies';
  }
  return str + 's';
}

export function processTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (vars[key] !== undefined) {
      return vars[key];
    }
    
    // Handle transform suffixes
    const [baseKey, transform] = key.split('_');
    const value = vars[baseKey];
    
    if (value === undefined) return match;
    
    switch (transform) {
      case 'camel':
        return toCamelCase(value);
      case 'pascal':
        return toPascalCase(value);
      case 'kebab':
        return toKebabCase(value);
      case 'snake':
        return toSnakeCase(value);
      case 'plural':
        return pluralize(value.toLowerCase());
      case 'pluralSnake':
        return pluralize(toSnakeCase(value));
      default:
        return value;
    }
  });
}

export async function loadTemplate(templateName: string): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.template.txt`);
  
  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template not found: ${templateName}`);
  }

  return fs.readFile(templatePath, 'utf-8');
}

export async function generateFromTemplate(
  templateName: string,
  vars: TemplateVars,
  outputPath: string
): Promise<void> {
  const template = await loadTemplate(templateName);
  const processed = processTemplate(template, vars);
  
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, processed, 'utf-8');
}

export function createTemplateVars(name: string): TemplateVars {
  return {
    name,
    name_camel: toCamelCase(name),
    name_pascal: toPascalCase(name),
    name_kebab: toKebabCase(name),
    name_snake: toSnakeCase(name),
    name_plural: pluralize(name.toLowerCase()),
    name_pluralSnake: pluralize(toSnakeCase(name)),
  };
}