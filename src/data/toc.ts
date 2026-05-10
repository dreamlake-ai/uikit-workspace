import type { TocItem } from '../components/RightTOC'

// Per-route right-rail TOC. Keyed by `urlPathname` (vike's pageContext).
// Heading IDs come from rehype-slug — pin them to the slug a heading
// actually produces, not magic strings; renaming a heading renames its
// anchor.
//
// Routes without an entry default to `[]` → RightTOC returns null,
// which is the right behavior for pages that have no h2 anchors.
export const tocByRoute: Record<string, TocItem[]> = {
  '/': [
    { id: 'install', label: 'Install', level: 2 },
    { id: 'style-guide', label: 'Style guide', level: 2 },
    { id: 'components', label: 'Components', level: 2 },
  ],
  '/style-guide': [
    { id: 'color', label: 'Color', level: 2 },
    { id: 'typography', label: 'Typography', level: 2 },
    { id: 'spacing--layout', label: 'Spacing & layout', level: 2 },
    { id: 'iconography', label: 'Iconography', level: 2 },
    { id: 'elevation--depth', label: 'Elevation & depth', level: 2 },
    { id: 'border--radius', label: 'Border & radius', level: 2 },
    { id: 'motion', label: 'Motion', level: 2 },
    { id: 'zebra-lists', label: 'Zebra lists', level: 2 },
  ],
  '/components/button': [
    { id: 'usage', label: 'Usage', level: 2 },
    { id: 'variants', label: 'Variants', level: 2 },
    { id: 'states', label: 'States', level: 2 },
    { id: 'props', label: 'Props', level: 2 },
  ],
}
