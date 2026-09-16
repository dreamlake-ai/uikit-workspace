import { PanelLayout, panelLeaf, panelSplit } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

// Built inside a function, never at module scope: `panelLeaf`/`panelSplit` mint
// ids from a shared counter, so calling them at import time would burn ids on
// every page that merely imports this file.
const initial = () =>
  panelSplit(
    'row',
    [
      panelLeaf({ title: 'Explorer' }),
      panelSplit('column', [panelLeaf({ title: 'Editor' }), panelLeaf({ title: 'Terminal' })], [62, 38]),
    ],
    [32, 68],
  )

export const BasicSpec = () => (
  <PanelStage>
    <PanelLayout initial={initial} showToolbar className="p-2" />
  </PanelStage>
)
