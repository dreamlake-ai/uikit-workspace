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
    { id: 'your-first-scene', label: 'Your first scene', level: 2 },
    { id: 'html-scaffold', label: 'HTML scaffold', level: 3 },
    { id: 'replay-a-recorded-bag', label: 'Replay a recorded bag', level: 2 },
    { id: 'built-in-layers', label: 'Built-in layers', level: 2 },
    { id: 'react-binding', label: 'React binding', level: 2 },
    { id: 'where-to-go-next', label: 'Where to go next', level: 2 },
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
}
