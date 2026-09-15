import { PanelLayout, panelGroup, panelLeaf, panelSplit } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

// A layout that already HAS tabs when it mounts. Groups otherwise only arise
// from a user dropping one panel onto another's centre — `panelGroup` is how a
// host seeds them.
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
        ],
        1,
      ),
    ],
    [28, 72],
  )

export const TabsSpec = () => (
  <PanelStage>
    <PanelLayout initial={initial} className="p-2" />
  </PanelStage>
)
