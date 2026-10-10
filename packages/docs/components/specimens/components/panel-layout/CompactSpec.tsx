import { useState } from 'react'
import { PanelLayout, panelGroup, panelLeaf, panelSplit } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

const initial = () => panelSplit('row', [
  panelLeaf({ title: 'Files' }),
  panelGroup([panelLeaf({ title: 'Draft' }), panelLeaf({ title: 'Preview' })]),
  panelLeaf({ title: 'Chat' }),
], [22, 53, 25])

export function CompactSpec() {
  const [compact, setCompact] = useState(false)
  return <>
    <label className="flex items-center gap-2 mb-3 text-sm">
      <input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} />
      Narrow screen: one panel at a time
    </label>
    <PanelStage>
      <PanelLayout
        initial={initial}
        compact={compact}
        closable={() => false}
        renderBody={leaf => <textarea
          aria-label={`${leaf.title} draft`}
          defaultValue={`Edit ${leaf.title}, switch panels, then restore the wide layout. Your draft stays here.`}
          className="flex-1 min-h-0 min-w-0 resize-none bg-transparent p-3 text-sm"
        />}
      />
    </PanelStage>
  </>
}
