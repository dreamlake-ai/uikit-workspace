import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
// dockit() bundles the whole docs plugin stack (Tailwind v4, `?raw`-MDX
// loader, MDX + shiki, React, Vike). NOTE: it nests Vike's plugin inside
// its own plugin array, which requires vike >= 0.4.260 — earlier versions'
// `vike prerender` CLI cannot see a nested plugin.
import { dockit } from '@dreamlake/dockit/vite'

/**
 * The topbar's version chip tracks the product this site documents:
 * @dreamlake/uikit. Captured once at build/dev start from the workspace
 * package — single source of truth, no lock file needed.
 */
const pkg = JSON.parse(
  readFileSync(new URL('../uikit/package.json', import.meta.url), 'utf-8'),
) as { version?: string }
const APP_VERSION = pkg.version ?? '0.0.0'

const GIT_HASH = (() => {
  try {
    return execSync('git rev-parse --short=6 HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'dev'
  }
})()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __GIT_HASH__: JSON.stringify(GIT_HASH),
  },
  // Spread (not `[dockit()]`): `vike prerender`'s CLI only detects Vike's
  // plugin at the top level of `plugins` — nested one array deeper it
  // sometimes injects a duplicate Vike plugin and the prerender crashes
  // with a @brillout/vite-plugin-server-entry assert.
  plugins: [...dockit()],
  resolve: {
    alias: {
      '@dreamlake/uikit': new URL('../uikit/src/index.ts', import.meta.url).pathname,
    },
  },
  server: {
    port: 3012,
    strictPort: false,
  },
})
