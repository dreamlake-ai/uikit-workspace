import type { TocItem } from '../components/RightTOC'

// Per-route right-rail TOC. Keyed by `urlPathname` (vike's pageContext).
// Heading IDs come from rehype-slug — pin them to the slug a heading
// actually produces, not magic strings; renaming a heading renames its
// anchor.
//
// New pages add an entry here. The default for an unmapped route is
// an empty array → RightTOC renders nothing, which is the right
// behavior for pages without enough headings to warrant a TOC.
export const tocByRoute: Record<string, TocItem[]> = {
  '/': [
    { id: 'install', label: 'Install', level: 2 },
    { id: 'foundations', label: 'Foundations', level: 2 },
    { id: 'components', label: 'Components', level: 2 },
  ],
  '/foundations/surfaces': [
    { id: 'tokens', label: 'Tokens', level: 2 },
    { id: 'the-surface-contract', label: 'The surface contract', level: 2 },
    { id: 'why-these-choices', label: 'Why these choices', level: 2 },
  ],
  '/foundations/palette': [
    { id: 'when-adding-a-new-concept', label: 'When adding a new concept', level: 2 },
    { id: 'why-six-and-not-more', label: 'Why six and not more', level: 2 },
  ],
  '/geometry': [
    { id: 'spacing-scale', label: 'Spacing scale', level: 2 },
    { id: 'radii', label: 'Radii', level: 2 },
    { id: 'hairlines', label: 'Hairlines', level: 2 },
    { id: 'shadows', label: 'Shadows', level: 2 },
    { id: 'motion', label: 'Motion', level: 2 },
  ],
  '/zebra-lists': [
    { id: 'the-four-band-model', label: 'The four-band model', level: 2 },
    { id: 'per-state-colors', label: 'Per-state colors', level: 2 },
    { id: 'multi-row-runs', label: 'Multi-row runs', level: 2 },
  ],
  '/components/chip': [
    { id: 'tones', label: 'Tones', level: 2 },
    { id: 'with-a-leading-icon', label: 'With a leading icon', level: 2 },
  ],
  '/components/button': [
    { id: 'variants', label: 'Variants', level: 2 },
    { id: 'states', label: 'States', level: 2 },
  ],
}
