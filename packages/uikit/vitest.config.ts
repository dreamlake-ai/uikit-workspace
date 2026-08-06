import { defineConfig } from 'vitest/config'

/**
 * Unit tests only, and deliberately so.
 *
 * The one thing under test today is `PipelineGraph/edge-path.ts`, which has
 * zero imports, no React and no DOM — it takes two points and returns an SVG
 * `d` string. So the suite needs no jsdom, no transform pipeline beyond esbuild
 * for TypeScript, and no build step. Keeping `environment: 'node'` is what makes
 * `pnpm --filter @dreamlake/uikit test` a sub-second check that a pre-commit
 * hook or CI job can afford to run on every change.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
