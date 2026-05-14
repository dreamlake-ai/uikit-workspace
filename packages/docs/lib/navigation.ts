export interface PageMeta {
  path: string
  title: string
  section: string
  order: number
  description?: string
  /** True if the page is awaiting review. Surfaced as a chip in the
   *  sidebar so reviewers can spot what still needs eyes on it. */
  draft?: boolean
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
export const groupedPages: NavGroup[] = (() => {
  const order: string[] = []
  const map = new Map<string, PageMeta[]>()
  for (const p of pages) {
    if (!map.has(p.section)) {
      order.push(p.section)
      map.set(p.section, [])
    }
    map.get(p.section)!.push(p)
  }
  return order.map(label => ({ label, items: map.get(label)! }))
})()

export function getAdjacentPages(path: string) {
  const idx = pages.findIndex(p => p.path === path)
  return {
    current: idx >= 0 ? pages[idx] : null,
    prev: idx > 0 ? pages[idx - 1] : null,
    next: idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null,
  }
}
