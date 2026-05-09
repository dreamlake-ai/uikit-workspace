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

export const navGroups: NavGroup[] = [
  {
    eyebrow: 'GET STARTED',
    count: '01',
    items: [{ href: '/', label: 'Quick start' }],
  },
  {
    eyebrow: 'COMPONENTS',
    count: '02',
    items: [
      { href: '/file-tree', label: 'file-tree' },
      { href: '/video-images', label: 'video / images' },
    ],
  },
  {
    eyebrow: 'EXAMPLES',
    count: '01',
    items: [{ href: '#ex-robot-visualizer', label: 'Robot visualizer', todo: true }],
  },
  {
    eyebrow: 'CONCEPTS',
    count: '04',
    items: [
      { href: '#concept-scene', label: 'Scene & layers', todo: true },
      { href: '#concept-clock', label: 'Clock & time', todo: true },
      { href: '#concept-frames', label: 'Frames & TF', todo: true },
      { href: '#concept-transport', label: 'Transports', todo: true },
    ],
  },
  {
    eyebrow: 'HOOKS',
    count: '05',
    items: [
      { href: '#hook-useScene', label: 'useScene', todo: true },
      { href: '#hook-useClock', label: 'useClock', todo: true },
      { href: '#hook-useTopic', label: 'useTopic', todo: true },
      { href: '#hook-useFrame', label: 'useFrame', todo: true },
      { href: '#hook-useSelection', label: 'useSelection', todo: true },
    ],
  },
]
