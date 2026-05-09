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
    items: [{ href: '/geometry', label: 'Geometry' }],
  },
  {
    eyebrow: 'ZEBRA LISTS',
    count: '01',
    items: [{ href: '/zebra-lists', label: 'Zebra lists' }],
  },
  {
    eyebrow: 'COMPONENTS · ATOMS',
    count: '06',
    items: [
      { href: '/components/chip', label: 'chip' },
      { href: '/components/status', label: 'status indicator' },
      { href: '/components/kbd', label: 'keyboard hint' },
      { href: '/components/avatar', label: 'avatar' },
      { href: '/components/button', label: 'buttons' },
      { href: '/components/dropdown', label: 'dropdown' },
    ],
  },
  {
    eyebrow: 'COMPONENTS · CHROME',
    count: '03',
    items: [
      { href: '/components/inspector-panel', label: 'inspector panel' },
      { href: '/components/eyebrow-title', label: 'eyebrow + title' },
      { href: '/components/tab-strip', label: 'tab strip' },
    ],
  },
  {
    eyebrow: 'COMPONENTS · LISTS',
    count: '03',
    items: [
      { href: '/components/zebra-row', label: 'zebra row' },
      { href: '/components/nav-rail-item', label: 'nav-rail item' },
      { href: '/components/search-bar', label: 'search bar' },
    ],
  },
  {
    eyebrow: 'REFERENCE',
    count: '02',
    items: [
      { href: '/icons', label: 'Icons' },
      { href: '/donts', label: 'Do · don’t' },
    ],
  },
]
