import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { usePageContext } from 'vike-react/usePageContext'
import { ThemeProvider } from '../components/ThemeProvider'
import { Topbar } from '../components/Topbar'
import { Sidebar } from '../components/Sidebar'
import { TOC } from '../components/TOC'
import { DocFooter } from '../components/DocFooter'
import { SearchPalette } from '../components/SearchPalette'
import { mdxComponents } from '../components/mdx-components'
import { pages } from '../lib/navigation'
import { siteConfig } from '../site.config'
import '../styles/app.css'

const SPRING = 'cubic-bezier(0.4, 0.7, 0.3, 1)'

/** True once the page H1 has scrolled above the topbar — drives the
 *  brand → breadcrumb crossfade in the topbar without relying on a
 *  `body.is-merged` global class. */
const MergeContext = createContext(false)
export const useMerge = () => useContext(MergeContext)

/** Page-top breadcrumb — always rendered above <h1>; fades out and lets
 *  the topbar breadcrumb take over once the H1 scrolls past the topbar.
 *  Renders on the index page too — even on `/`, the section + title
 *  orient the reader (e.g. "Docs / Get started / Quick start"). */
function PageBreadcrumb() {
  const { urlPathname } = usePageContext() as { urlPathname: string }
  const current = pages.find(p => p.path === urlPathname)
  const merged = useMerge()
  if (!current) return null
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-doc-template-muted uppercase"
      style={{
        gap: 6,
        fontFamily: 'var(--font-doc-template-mono)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.04em',
        height: 36,
        margin: '8px 0 0',
        opacity: merged ? 0 : 1,
        transform: merged ? 'translateY(-6px)' : 'translateY(0)',
        pointerEvents: merged ? 'none' : 'auto',
        transition: `opacity 0.25s ease, transform 0.25s ${SPRING}`,
      }}
    >
      {/* breadcrumbRoot + section render as plain text — there's no
          section index page to navigate to, and the root link just
          targets the page the reader is already oriented to. */}
      {siteConfig.breadcrumbRoot && (
        <>
          <span>{siteConfig.breadcrumbRoot}</span>
          <span style={{ opacity: 0.5 }}>/</span>
        </>
      )}
      {current.section && (
        <>
          <span>{current.section}</span>
          <span style={{ opacity: 0.5 }}>/</span>
        </>
      )}
      <span className="text-doc-template-ink">{current.title}</span>
    </nav>
  )
}

function H1MergeWatcher({ onChange }: { onChange: (m: boolean) => void }) {
  useEffect(() => {
    const TOPBAR_H = 40
    let scheduled = false
    let merged = false
    function check() {
      scheduled = false
      const h1 = document.querySelector<HTMLElement>('main.doc-content h1')
      const next = h1 ? h1.getBoundingClientRect().bottom < TOPBAR_H + 8 : false
      if (next !== merged) {
        merged = next
        onChange(merged)
      }
    }
    function onScroll() {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [onChange])
  return null
}

/** Vike clientRouting:true does not re-render <head>, so on every route
 *  change we sync `document.title` and the description meta tag from the
 *  current page's frontmatter + siteConfig.brand. SSR sets the same values
 *  via +onRenderHtml.tsx for the first paint. */
function HeadSync() {
  const { urlPathname } = usePageContext() as { urlPathname: string }
  useEffect(() => {
    if (typeof document === 'undefined') return
    const current = pages.find(p => p.path === urlPathname)
    document.title = current ? `${current.title} — ${siteConfig.brand}` : siteConfig.brand
    const desc = current?.description ?? ''
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (desc) {
      if (!tag) {
        tag = document.createElement('meta')
        tag.name = 'description'
        document.head.appendChild(tag)
      }
      tag.content = desc
    } else if (tag) {
      tag.remove()
    }
  }, [urlPathname])
  return null
}

export function Layout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [merged, setMerged] = useState(false)
  const { urlPathname } = usePageContext() as { urlPathname: string }
  const currentPage = pages.find(p => p.path === urlPathname)
  const wide = currentPage?.wide === true

  return (
    <ThemeProvider>
      <MDXProvider components={mdxComponents}>
        <MergeContext.Provider value={merged}>
          <Topbar
            searchOpen={searchOpen}
            onOpenSearch={() => setSearchOpen(true)}
            onCloseSearch={() => setSearchOpen(false)}
            query={searchQuery}
            setQuery={setSearchQuery}
          />
          <div
            // Outer container max-width is constant across pages so the
            // sidebar's position never shifts when navigating to a `wide` page.
            // Wide mode only drops the right-rail TOC column and removes the
            // 760px cap on the main column — sidebar geometry is untouched.
            className={
              wide
                ? 'grid items-start mx-auto min-h-screen grid-cols-[minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)]'
                : 'grid items-start mx-auto min-h-screen grid-cols-[minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_240px]'
            }
            style={{ maxWidth: 1320 }}
          >
            <Sidebar />
            <main
              // `doc-content` class kept on <main> so TOC.tsx can find the
              // headings via `document.querySelector('main.doc-content')`,
              // and the H1MergeWatcher can find the page H1 inside it.
              // NOTE: left-aligned in the grid cell (no mx-auto) to match
              // docs.html — the slack at wide viewports sits to the right,
              // keeping the sidebar tight against the content.
              className={
                wide
                  ? 'doc-content w-full min-w-0 px-[18px] pb-20 lg:px-[56px] lg:pb-[120px]'
                  : 'doc-content w-full min-w-0 px-[18px] pb-20 lg:px-[56px] lg:pb-[120px] lg:max-w-[760px]'
              }
            >
              <PageBreadcrumb />
              {children}
              <DocFooter />
            </main>
            {!wide && <TOC />}
          </div>
          <SearchPalette
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            query={searchQuery}
          />
          <H1MergeWatcher onChange={setMerged} />
          <HeadSync />
        </MergeContext.Provider>
      </MDXProvider>
    </ThemeProvider>
  )
}
