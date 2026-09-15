import { PanelLayout, panelLeaf, panelSplit } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

// Only these two views may share a tab group. `settings` is a SINGLETON: drag
// its handle onto another panel's centre and the drop resolves to the nearest
// EDGE instead of merging — the centre zone is never offered for it, so the
// drag preview and the drop always agree.
const TABBABLE = new Set(['editor', 'terminal'])
const isTabbable = (view: string | undefined) => !!view && TABBABLE.has(view)

const initial = () =>
  panelSplit(
    'row',
    [
      panelLeaf({ view: 'settings', title: 'Settings (singleton)' }),
      panelSplit(
        'column',
        [panelLeaf({ view: 'editor', title: 'Editor' }), panelLeaf({ view: 'terminal', title: 'Terminal' })],
        [60, 40],
      ),
    ],
    [38, 62],
  )

export const SingletonSpec = () => (
  <PanelStage>
    <PanelLayout initial={initial} isTabbable={isTabbable} className="p-2" />
  </PanelStage>
)
