export interface PageMeta {
  path: string
  title: string
  section: string
  order: number
  description?: string
  /** True if the page is awaiting review. Surfaced as a chip in the
   *  sidebar so reviewers can spot what still needs eyes on it. */
  draft?: boolean
  /** True if the page should be hidden from the sidebar by default.
   *  Toggle visibility via the "show hidden" global state (Cmd+Shift+D).
   *  The page is still reachable via direct URL. */
  hidden?: boolean
  /** True to emit `<meta name="robots" content="noindex, nofollow">`
   *  and exclude the page from the pagefind search index. Use for
   *  internal/dev pages that should not be discoverable by spiders. */
  noindex?: boolean
  /** Right-rail TOC depth. 3 (default) surfaces H2 + H3; 2 limits the
   *  rail to H2 only. Set in frontmatter on long pages where H3 noise
   *  crowds the rail. */
  tocLevel?: 2 | 3
  /** When true, the main column drops its `max-w-[760px]` cap so a wide
   *  preview (e.g. a full-page layout) can use the remaining grid space. */
  wide?: boolean
}

interface PageFrontmatter {
  title?: string
  section?: string
  order?: number
  description?: string
  draft?: boolean
  hidden?: boolean
  noindex?: boolean
  tocLevel?: 2 | 3
  wide?: boolean
}

interface PageModule {
  // remark-mdx-frontmatter v5 exposes the YAML block as a single `frontmatter` export.
  frontmatter?: PageFrontmatter
}

const modules = import.meta.glob<PageModule>('../pages/**/+Page.mdx', { eager: true })

export const pages: PageMeta[] = Object.entries(modules)
  .map(([filePath, mod]) => {
    const dir = filePath.replace('../pages/', '').replace('/+Page.mdx', '')
    const fm = mod.frontmatter ?? {}
    return {
      path: dir === 'index' ? '/' : `/${dir}`,
      title: fm.title ?? dir,
      section: fm.section ?? '',
      order: fm.order ?? 99,
      description: fm.description,
      draft: fm.draft === true,
      hidden: fm.hidden === true,
      noindex: fm.noindex === true,
      tocLevel: fm.tocLevel,
      wide: fm.wide === true,
    }
  })
  .sort((a, b) => a.order - b.order)

export interface NavGroup {
  label: string
  items: PageMeta[]
}

/** Group pages by `section`, preserving the order in which sections first appear. */
function groupPages(items: PageMeta[]): NavGroup[] {
  const order: string[] = []
  const map = new Map<string, PageMeta[]>()
  for (const p of items) {
    if (!map.has(p.section)) {
      order.push(p.section)
      map.set(p.section, [])
    }
    map.get(p.section)!.push(p)
  }
  return order.map(label => ({ label, items: map.get(label)! }))
}

/** All pages grouped — includes hidden ones. Components filter for
 *  visibility themselves so the toggle can flip live without reflowing
 *  the data layer. */
export const groupedPages: NavGroup[] = groupPages(pages)

/** Same shape, but filtered to only-visible pages. Equivalent to
 *  `groupedPages` when no page declares `hidden: true`. */
export const groupedVisiblePages: NavGroup[] = groupPages(
  pages.filter(p => !p.hidden),
)

/** Prev/next adjacency. By default skips `hidden: true` pages so a
 *  reader walking the docs sequentially never lands on an internal
 *  page they couldn't see in the sidebar. Pass `{ includeHidden: true }`
 *  (e.g. from `useHiddenToggle()`) to make hidden pages part of the
 *  sequence. If the *current* page is itself hidden it is always
 *  included so the user can step out of it. */
export function getAdjacentPages(
  path: string,
  opts: { includeHidden?: boolean } = {},
) {
  const here = pages.find(p => p.path === path)
  const list =
    opts.includeHidden || here?.hidden
      ? pages
      : pages.filter(p => !p.hidden)
  const idx = list.findIndex(p => p.path === path)
  return {
    current: idx >= 0 ? list[idx] : null,
    prev: idx > 0 ? list[idx - 1] : null,
    next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
  }
}
