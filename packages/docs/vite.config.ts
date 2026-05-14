import { defineConfig, type Plugin } from 'vite'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'

/** Captured once at build/dev start. */
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version?: string }
const APP_VERSION = pkg.version ?? '0.0.0'
const GIT_HASH = (() => {
  try {
    return execSync('git rev-parse --short=6 HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'dev'
  }
})()

/**
 * Per-file `?raw` loader for `.mdx` files.
 *
 * The standard `import.meta.glob('…/*.mdx', { query: '?raw' })` is hijacked
 * by `@mdx-js/rollup`: its `transform` hook strips the query before
 * filtering, so every `.mdx` request — query and all — gets transformed
 * as MDX, never returning raw text. We dodge that by rewriting the id to
 * a Rollup-virtual `\0mdx-raw:…` path that doesn't match MDX's filter.
 */
function mdxRawLoader(): Plugin {
  const PREFIX = '\0mdx-raw:'
  return {
    name: 'mdx-raw-loader',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!id.endsWith('.mdx?raw')) return null
      const base = id.slice(0, -'?raw'.length)
      const resolved = await this.resolve(base, importer, { skipSelf: true })
      if (!resolved) return null
      return PREFIX + resolved.id
    },
    async load(id) {
      if (!id.startsWith(PREFIX)) return null
      const text = await readFile(id.slice(PREFIX.length), 'utf-8')
      return `export default ${JSON.stringify(text)};`
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __GIT_HASH__: JSON.stringify(GIT_HASH),
  },
  plugins: [
    tailwindcss(),
    mdxRawLoader(),
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeShiki,
            {
              themes: { light: 'github-light', dark: 'github-dark' },
              defaultColor: false,
              // Extract `file="…"` from the fenced-block meta string
              // (e.g. ```bash file="terminal"). Returned keys become
              // attributes on the <pre>; PreWrapper strips it off.
              parseMetaString(meta: string) {
                const m = meta.match(/\bfile="([^"]+)"/)
                return m ? { file: m[1] } : null
              },
              transformers: [
                // Shiki drops the original `language-…` class from <code>,
                // so the language is otherwise inaccessible to MDX
                // components. Mirror it onto <pre language="…"> so
                // PreWrapper can hand it to CodeBlock as the lang chip.
                {
                  name: 'forward-language',
                  pre(node: { properties?: Record<string, unknown> }) {
                    const lang = (this as unknown as { options?: { lang?: string } }).options?.lang
                    if (typeof lang === 'string' && lang && lang !== 'text' && lang !== 'plaintext') {
                      node.properties = node.properties || {}
                      node.properties.language = lang
                    }
                  },
                },
              ],
            },
          ],
        ],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react(),
    vike({ prerender: true }),
  ],
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
