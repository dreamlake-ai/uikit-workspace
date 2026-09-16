import { useRef } from 'react'
import {
  PanelLayout,
  panelLeaf,
  panelSplit,
  usePersistedPanelLayout,
  type PanelLayoutHandle,
} from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

const fresh = () =>
  panelSplit('row', [panelLeaf({ title: 'Left' }), panelLeaf({ title: 'Right' })], [45, 55])

export const PersistSpec = () => {
  const ref = useRef<PanelLayoutHandle>(null)

  // Restores on mount, saves on change. The hook owns the parts that are easy to
  // get wrong: unwrapping the versioned envelope BEFORE shape-checking it,
  // migrating an older tree, lifting the id counters past whatever it restored,
  // and collapsing the burst of changes a divider drag produces into one write.
  const persisted = usePersistedPanelLayout({
    key: 'uikit-docs:panel-layout-demo',
    fallback: fresh,
  })

  return (
    <div className="flex flex-col gap-2">
      <PanelStage height={300}>
        <PanelLayout
          ref={ref}
          // `initial` RESTORES; `resetTo` starts over. Wiring the toolbar's
          // Reset to `initial` would hand back the very layout you're clearing.
          initial={persisted.initial}
          resetTo={persisted.reset}
          onChange={persisted.onChange}
          showToolbar
          className="p-2"
        />
      </PanelStage>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            // `reset` forgets the saved layout AND returns a fresh tree; it
            // doesn't touch what's on screen, so hand it to `replaceRoot`.
            ref.current?.replaceRoot(persisted.reset())
          }}
          className="font-uikit-ui text-uikit-11 font-semibold px-2.5 py-1 rounded-[6px] border border-uikit-faint bg-uikit-panel text-uikit-ink hover:bg-uikit-ink-5 cursor-pointer"
        >
          Clear saved layout
        </button>
        <span className="font-uikit-mono text-uikit-10 text-uikit-muted">
          split / drag / resize, then reload the page — it comes back
        </span>
      </div>
    </div>
  )
}
