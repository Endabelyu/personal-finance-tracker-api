import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.git', 'app/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/db/**',
        '**/dist/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, './server'),
      '@db': path.resolve(__dirname, './db'),
    },
  },
});
