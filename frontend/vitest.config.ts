import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@priskila/api': path.resolve(__dirname, '../packages/api/src/index.ts'),
      '@priskila/types': path.resolve(__dirname, '../packages/types/src/index.ts'),
      '@priskila/ui': path.resolve(__dirname, '../packages/ui/src/index.ts'),
    },
  },
});
