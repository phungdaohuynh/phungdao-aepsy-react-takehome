import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(ROOT_DIR, 'src')
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: [path.join(ROOT_DIR, 'src/test/setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**']
  }
});
