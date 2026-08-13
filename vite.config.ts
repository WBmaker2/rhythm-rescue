import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/rhythm-rescue/' : '/',
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
