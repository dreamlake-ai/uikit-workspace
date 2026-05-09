export type NavItem = {
  href: string
  label: string
  todo?: boolean
}

export type NavGroup = {
  eyebrow: string
  count: string
  items: NavItem[]
}

// Mirrors the design-guide section structure (staging/dreamlake-design-guide.html).
// Each group's `count` is the design-guide nav's count; `todo: true` items are
// placeholders that subsequent Phase 3 PRs will flip to live.
export const navGroups: NavGroup[] = [
  {
    eyebrow: 'GET STARTED',
    count: '01',
    items: [{ href: '/', label: 'Quick start' }],
  },
  {
    eyebrow: 'FOUNDATIONS',
    count: '03',
    items: [
      { href: '/foundations/surfaces', label: 'Surfaces' },
      { href: '/foundations/palette', label: 'Semantic palette' },
      { href: '/foundations/typography', label: 'Typography' },
    ],
  },
  {
    eyebrow: 'GEOMETRY',
    count: '01',
    items: [{ href: '/geometry', label: 'Geometry', todo: true }],
  },
  {
    eyebrow: 'ZEBRA LISTS',
    count: '01',
    items: [{ href: '/zebra-lists', label: 'Zebra lists', todo: true }],
  },
  {
    eyebrow: 'COMPONENTS · ATOMS',
    count: '07',
    items: [
      { href: '/components/chip', label: 'chip', todo: true },
      { href: '/components/status', label: 'status indicator', todo: true },
      { href: '/components/kbd', label: 'keyboard hint', todo: true },
      { href: '/components/avatar', label: 'avatar', todo: true },
      { href: '/components/button', label: 'buttons', todo: true },
      { href: '/components/timeline', label: 'timeline', todo: true },
      { href: '/components/dropdown', label: 'dropdown', todo: true },
    ],
  },
  {
    eyebrow: 'COMPONENTS · CHROME',
    count: '03',
    items: [
      { href: '/components/inspector-panel', label: 'inspector panel', todo: true },
      { href: '/components/eyebrow-title', label: 'eyebrow + title', todo: true },
      { href: '/components/tab-strip', label: 'tab strip', todo: true },
    ],
  },
  {
    eyebrow: 'COMPONENTS · LISTS',
    count: '03',
    items: [
      { href: '/components/zebra-row', label: 'zebra row', todo: true },
      { href: '/components/nav-rail-item', label: 'nav-rail item', todo: true },
      { href: '/components/search-bar', label: 'search bar', todo: true },
    ],
  },
  {
    eyebrow: 'REFERENCE',
    count: '02',
    items: [
      { href: '/icons', label: 'Icons', todo: true },
      { href: '/donts', label: 'Do · don’t', todo: true },
    ],
  },
]
