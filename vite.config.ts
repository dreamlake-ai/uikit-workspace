import { defineConfig } from 'vite'
import vike from 'vike/plugin'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

export default defineConfig({
  plugins: [
    // MDX must run before vike so .mdx files compile to JS first.
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
        providerImportSource: '@mdx-js/react',
      }),
    },
    vike(),
    tailwindcss(),
  ],
})
