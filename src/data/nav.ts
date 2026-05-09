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

// Three nav groups:
//   GET STARTED  — landing
//   STYLE GUIDE  — the seven canonical foundations + zebra-list pattern
//   COMPONENTS   — one representative component example (Button); the
//                  full atom catalog will live in the eventual
//                  @dreamlake/uikit npm package, not in this docs site.
export const navGroups: NavGroup[] = [
  {
    eyebrow: 'GET STARTED',
    count: '01',
    items: [{ href: '/', label: 'Overview' }],
  },
  {
    eyebrow: 'STYLE GUIDE',
    count: '08',
    items: [
      { href: '/color', label: 'Color' },
      { href: '/typography', label: 'Typography' },
      { href: '/spacing-layout', label: 'Spacing & layout' },
      { href: '/iconography', label: 'Iconography' },
      { href: '/elevation', label: 'Elevation & depth' },
      { href: '/border-radius', label: 'Border & radius' },
      { href: '/motion', label: 'Motion' },
      { href: '/zebra-lists', label: 'Zebra lists' },
    ],
  },
  {
    eyebrow: 'COMPONENTS',
    count: '01',
    items: [{ href: '/components/button', label: 'Button' }],
  },
]
