import { defineConfig } from 'vite'
import vike from 'vike/plugin'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'
import type { ShikiTransformer } from 'shiki'

// Parse the meta string after a fenced code block's language and lift
// `file="..."` onto a data attribute the components map can read.
//   ```ts file="scene.ts"
// becomes <pre data-file="scene.ts" ...>.
function parseShikiMeta(meta: string): Record<string, string> {
  const out: Record<string, string> = {}
  const m = meta.match(/file=["']?([^"'\s]+)/)
  if (m) out['data-file'] = m[1]
  return out
}

// Stamp the original fenced-code language onto <pre data-language="ts">
// so the CodeBlock chrome's lang label can read it. @shikijs/rehype
// doesn't add this attribute on its own.
const stampLanguage: ShikiTransformer = {
  name: 'stamp-language',
  pre(node) {
    if (this.options.lang) node.properties['data-language'] = this.options.lang
  },
}

// MDX must run before vike so .mdx files compile to JS first.
// rehype-slug stamps every heading with a GitHub-style id at compile
// time. rehype-shiki highlights fenced code blocks at build time using
// a dual-theme setup (light + dark; the dark colors come through CSS
// custom properties so [data-theme=dark] can swap them).
// providerImportSource lets MDXProvider in +Layout.tsx supply a
// components map (h2 → anchored H2, pre → CodeBlock chrome).
export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeShiki,
            {
              themes: { light: 'github-light', dark: 'github-dark' },
              defaultColor: false,
              parseMetaString: parseShikiMeta,
              transformers: [stampLanguage],
            },
          ],
        ],
        providerImportSource: '@mdx-js/react',
      }),
    },
    vike(),
    tailwindcss(),
  ],
})
