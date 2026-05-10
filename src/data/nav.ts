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

// Two nav groups:
//   GET STARTED  — landing + the consolidated style guide
//   COMPONENTS   — one representative component example (Button); the
//                  full atom catalog will live in the eventual
//                  @dreamlake/uikit npm package, not in this docs site.
export const navGroups: NavGroup[] = [
  {
    eyebrow: 'GET STARTED',
    count: '02',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/style-guide', label: 'Style guide' },
    ],
  },
  {
    eyebrow: 'COMPONENTS',
    count: '01',
    items: [{ href: '/components/button', label: 'Button' }],
  },
]
