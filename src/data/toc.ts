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
  '/color': [
    { id: 'surfaces', label: 'Surfaces', level: 2 },
    { id: 'ink', label: 'Ink', level: 2 },
    { id: 'when-adding-a-new-concept', label: 'When adding a new concept', level: 2 },
    { id: 'why-six-and-not-more', label: 'Why six and not more', level: 2 },
  ],
  '/spacing-layout': [
    { id: 'spacing-scale', label: 'Spacing scale', level: 2 },
    { id: 'page-grid', label: 'Page grid', level: 2 },
    { id: 'breakpoints', label: 'Breakpoints', level: 2 },
  ],
  '/elevation': [
    { id: 'shadow-scale', label: 'Shadow scale', level: 2 },
    { id: 'z-index-layers', label: 'Z-index layers', level: 2 },
  ],
  '/border-radius': [
    { id: 'radius-scale', label: 'Radius scale', level: 2 },
    { id: 'hairlines--dividers', label: 'Hairlines & dividers', level: 2 },
  ],
  '/motion': [
    { id: 'durations--easings', label: 'Durations & easings', level: 2 },
    { id: 'when-not-to-animate', label: 'When not to animate', level: 2 },
  ],
  '/iconography': [
    { id: 'categories', label: 'Categories', level: 2 },
    { id: 'migration-backlog', label: 'Migration backlog', level: 2 },
  ],
  '/zebra-lists': [
    { id: 'the-four-band-model', label: 'The four-band model', level: 2 },
    { id: 'per-state-colors', label: 'Per-state colors', level: 2 },
    { id: 'multi-row-runs', label: 'Multi-row runs', level: 2 },
  ],
  '/components/button': [
    { id: 'variants', label: 'Variants', level: 2 },
    { id: 'states', label: 'States', level: 2 },
  ],
}
