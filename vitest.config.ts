import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/pages/api/**'],
      exclude: ['**/*.test.ts', '**/_schema.ts'],
    },
  },
  resolve: {
    alias: {
      // The Astro virtual module that re-exports zod. In tests we use zod directly.
      'astro:schema': 'zod',
    },
  },
});
