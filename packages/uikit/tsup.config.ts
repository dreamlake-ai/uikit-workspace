import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

// Builds the publishable bundle: a single ESM entry + type declarations.
//
// Only the .tsx code is built — styles.css ships raw (it's Tailwind v4
// @theme source that the *consumer's* Tailwind compiles). React, react-dom,
// its jsx-runtime, and lucide-react are externalized as peers; clsx and
// tailwind-merge are runtime deps and tsup externalizes them automatically.

// Inject package name/version so UIKitBadge can display them without a
// (rootDir-violating) JSON import. In source/workspace consumption these
// globals are undefined and the component falls back gracefully.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  name: string
  version: string
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react'],
  define: {
    __UIKIT_NAME__: JSON.stringify(pkg.name),
    __UIKIT_VERSION__: JSON.stringify(pkg.version),
  },
})
