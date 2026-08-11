import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    host: '127.0.0.1',
  },
  test: {
    environment: 'node',
    exclude: ['tests/e2e/**'],
  },
});
