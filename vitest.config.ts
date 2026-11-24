import path from 'node:path'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  resolve: {
    alias: {
      // in teste nu suntem in React Server Components: markerul „server-only” devine modulul gol
      'server-only': path.resolve('node_modules/server-only/empty.js'),
      '@payload-config': path.resolve('src/payload.config.ts'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integrare/**/*.test.ts'],
    testTimeout: 120_000, hookTimeout: 120_000,
    // testul de integrare scrie in baza de dezvoltare: fisierele nu ruleaza in paralel
    fileParallelism: false,
  },
})
