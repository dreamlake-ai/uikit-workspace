import '../src/styles.css'
import type { ReactNode } from 'react'
import { TopBar } from '../src/components/TopBar'
import { LeftNav } from '../src/components/LeftNav'
import { RightTOC, type TocItem } from '../src/components/RightTOC'
import { SearchPalette, SearchProvider } from '../src/components/SearchPalette'
import { useMergedHeader } from '../src/hooks/useMergedHeader'

// TODO(per-page-toc): once we add more pages, hoist this into pageContext
// (vike) or read from MDX frontmatter so each page declares its own TOC.
const tocItems: TocItem[] = [
  { id: 'install', label: 'Install', level: 2 },
  { id: 'first-scene', label: 'Your first scene', level: 2 },
  { id: 'markup', label: 'HTML scaffold', level: 3 },
  { id: 'from-bag', label: 'Replay a recorded bag', level: 2 },
  { id: 'layers', label: 'Built-in layers', level: 2 },
  { id: 'react', label: 'React binding', level: 2 },
  { id: 'next', label: 'Where to go next', level: 2 },
]

export default function Layout({ children }: { children: ReactNode }) {
  useMergedHeader()
  return (
    <SearchProvider>
      <TopBar />
      <div className="grid grid-cols-[240px_minmax(0,1fr)_240px] max-w-[1320px] mx-auto items-start max-[1100px]:grid-cols-[240px_1fr] max-[880px]:grid-cols-[1fr]">
        <LeftNav activeHref="/" />
        {children}
        <RightTOC items={tocItems} />
      </div>
      <SearchPalette />
    </SearchProvider>
  )
}
