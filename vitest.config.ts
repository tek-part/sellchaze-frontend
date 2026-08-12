import { defineConfig } from 'vitest/config';

// Storefront unit tests — pure logic (utils, mappers, settings/data readers, cart reducer).
// Node environment; test files live next to the code as *.test.ts.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/apps/storefront/**/*.test.ts', 'src/shared/**/*.test.ts', 'src/features/**/*.test.ts'],
    css: false,
  },
});
