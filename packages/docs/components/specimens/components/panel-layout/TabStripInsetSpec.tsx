import { PanelLayout, panelGroup, panelLeaf, panelSplit } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

// The same tabbed layout as the Tab groups demo, with the tab strip pulled in
// to 2px from the panel's left and top edges. The header row shrinks to
// 2 + 26 = 28px, and the tabs still stand on the panel below and join it.
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

export const TabStripInsetSpec = () => (
  <PanelStage>
    <PanelLayout tabbed tabStripInset={{ left: 2, top: 2 }} initial={initial} className="p-2" />
  </PanelStage>
)
