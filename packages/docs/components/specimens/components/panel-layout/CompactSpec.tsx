import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button, PanelLayout, panelGroup, panelLeaf, panelSplit } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

const initial = () => panelSplit('row', [
  panelLeaf({ view: 'list', title: 'Files' }),
  panelGroup([panelLeaf({ view: 'notes', title: 'Notes' }), panelLeaf({ title: 'Preview' })]),
  panelLeaf({ title: 'Chat' }),
], [22, 53, 25])

export function CompactSpec() {
  const [compact, setCompact] = useState(false)
  const [navigation, setNavigation] = useState(false)
  return <>
    <label className="flex items-center gap-2 mb-3 text-sm">
      <input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} />
      Narrow screen: one panel at a time
    </label>
    {navigation && <p className="mb-3 text-sm text-uikit-muted">Navigation is open.</p>}
    <PanelStage>
      <PanelLayout
        initial={initial}
        compact={compact}
        compactLeading={<Button variant="action" tone="muted" icon size="md"
          aria-label="Menu" aria-pressed={navigation} onClick={() => setNavigation(!navigation)}>
          <Menu size={14} />
        </Button>}
        compactPanelAsAction={leaf => leaf.view === 'list'}
        compactPanelLabel={(leaf, active) => leaf.view === 'list' ? 'List'
          : leaf.view === 'notes' ? (active ? '@workspace/notes' : 'notes')
          : leaf.title ?? 'Document'}
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
