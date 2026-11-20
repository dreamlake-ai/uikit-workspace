import { useRef, useState } from 'react'
import { PanelLayout, panelGroup, panelLeaf, panelSplit } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

// A layout that already HAS tabs when it mounts. Groups otherwise only arise
// from a user dropping one panel onto another's centre — `panelGroup` is how a
// host seeds them. Drag the divider to narrow the tabbed panel: its active
// Chat tab stays in view while the earlier documents remain horizontally scrollable.
const initial = () =>
  panelSplit(
    'row',
    [
      panelLeaf({ view: 'files', title: 'Files' }),
      panelGroup(
        [
          panelLeaf({ view: 'editor', title: 'index.ts' }),
          panelLeaf({ view: 'editor', title: 'utils.ts' }),
          panelLeaf({ view: 'editor', title: 'README.md' }),
          panelLeaf({ view: 'chat', title: 'Chat' }),
        ],
        3,
      ),
    ],
    [28, 72],
  )

export function TabsSpec() {
  const destination = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState<string[]>([])
  return <PanelStage>
    <div className="flex h-full">
      <div ref={destination} className="w-40 shrink-0 border-r border-uikit-border p-3 text-uikit-12"
        aria-label="Saved tab references">
        <p>Drag a tab here to save its reference.</p>
        {saved.map((title) => <p key={title}>{title}</p>)}
      </div>
      <PanelLayout tabbed initial={initial} className="min-w-0 flex-1 p-2"
        externalDropTarget={(leaf, point) => {
          const element = destination.current
          if (!element || !element.contains(document.elementFromPoint(point.x, point.y))) return null
          return { element, label: 'Save reference', onDrop: () => {
            setSaved((previous) => [...new Set([...previous, leaf.title ?? leaf.id])])
          } }
        }} />
    </div>
  </PanelStage>
}
