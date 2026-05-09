import '../src/styles.css'
import type { ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { TopBar } from '../src/components/TopBar'
import { LeftNav } from '../src/components/LeftNav'
import { RightTOC, type TocItem } from '../src/components/RightTOC'
import { SearchPalette, SearchProvider } from '../src/components/SearchPalette'
import { useMergedHeader } from '../src/hooks/useMergedHeader'
import { mdxComponents } from '../src/mdx-components'

// Doc-content wrapper. Descendant variants style raw HTML elements (h1,
// h3, p, ul, ol, li, code, table, th, td) emitted by MDX or hand-written
// JSX so page bodies stay readable. The chrome primitives (H2, Lede,
// Crumbs, CodeBlock, Callout, In) carry their own utilities.
const docContentCx = [
  'doc-content min-w-0 max-w-[760px] px-14 pb-[120px] max-[1100px]:max-w-full max-[880px]:px-[18px] max-[880px]:pt-6 max-[880px]:pb-20',
  '[&>h1]:font-ui [&>h1]:text-[32px] [&>h1]:font-bold [&>h1]:tracking-[-0.025em] [&>h1]:[margin:18px_0_10px] [&>h1]:text-ink [&>h1]:leading-[1.1]',
  '[&>h3]:font-ui [&>h3]:text-[15px] [&>h3]:font-semibold [&>h3]:tracking-[-0.005em] [&>h3]:mt-7 [&>h3]:mb-2 [&>h3]:text-ink [&>h3]:[scroll-margin-top:124px]',
  '[&>p]:font-ui [&>p]:text-[14.5px] [&>p]:leading-[1.65] [&>p]:text-ink [&>p]:m-0 [&>p]:mb-3.5 [&>p]:[text-wrap:pretty]',
  '[&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.88em] [&_:not(pre)>code]:bg-chip [&_:not(pre)>code]:text-ink [&_:not(pre)>code]:py-px [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:border [&_:not(pre)>code]:border-faint [&_:not(pre)>code]:tracking-[-0.005em]',
  '[&>ol]:font-ui [&>ol]:text-[14.5px] [&>ol]:leading-[1.65] [&>ol]:text-ink [&>ol]:m-0 [&>ol]:mb-3.5 [&>ol]:pl-[22px]',
  '[&>ul]:font-ui [&>ul]:text-[14.5px] [&>ul]:leading-[1.65] [&>ul]:text-ink [&>ul]:m-0 [&>ul]:mb-3.5 [&>ul]:pl-[22px]',
  '[&_li]:mb-1 [&_li::marker]:text-muted',
  '[&>table]:w-full [&>table]:border-collapse [&>table]:font-ui [&>table]:text-[13px] [&>table]:[margin:14px_0_22px]',
  '[&_thead_th]:text-left [&_thead_th]:font-mono [&_thead_th]:text-[10px] [&_thead_th]:font-semibold [&_thead_th]:text-muted [&_thead_th]:tracking-[0.12em] [&_thead_th]:uppercase [&_thead_th]:py-2 [&_thead_th]:px-3 [&_thead_th]:border-b [&_thead_th]:border-faint [&_thead_th]:bg-[color-mix(in_srgb,var(--color-ink)_2%,var(--color-bg))]',
  '[&_tbody_td]:py-[9px] [&_tbody_td]:px-3 [&_tbody_td]:border-b [&_tbody_td]:border-faint [&_tbody_td]:text-ink [&_tbody_td]:align-top [&_tbody_td]:leading-[1.5]',
  '[&_tbody_tr:last-child_td]:border-b-0',
  '[&_tbody_td_code]:font-mono [&_tbody_td_code]:text-xs',
].join(' ')

// TODO(per-page-toc): once we add more pages, hoist this into pageContext
// (vike) or read from MDX frontmatter so each page declares its own TOC.
// IDs come from rehype-slug — pin them to slugs, not magic strings;
// renaming a heading renames its anchor.
const tocItems: TocItem[] = [
  { id: 'install', label: 'Install', level: 2 },
  { id: 'your-first-scene', label: 'Your first scene', level: 2 },
  { id: 'html-scaffold', label: 'HTML scaffold', level: 3 },
  { id: 'replay-a-recorded-bag', label: 'Replay a recorded bag', level: 2 },
  { id: 'built-in-layers', label: 'Built-in layers', level: 2 },
  { id: 'react-binding', label: 'React binding', level: 2 },
  { id: 'where-to-go-next', label: 'Where to go next', level: 2 },
]

export default function Layout({ children }: { children: ReactNode }) {
  useMergedHeader()
  return (
    <SearchProvider>
      <TopBar />
      <div className="grid grid-cols-[240px_minmax(0,1fr)_240px] max-w-[1320px] mx-auto items-start max-[1100px]:grid-cols-[240px_1fr] max-[880px]:grid-cols-[1fr]">
        <LeftNav activeHref="/" />
        <MDXProvider components={mdxComponents}>
          <main className={docContentCx}>{children}</main>
        </MDXProvider>
        <RightTOC items={tocItems} />
      </div>
      <SearchPalette />
    </SearchProvider>
  )
}
