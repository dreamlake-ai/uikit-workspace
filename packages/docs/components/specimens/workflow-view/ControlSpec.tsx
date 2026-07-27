import { ControlNodeCard } from '@dreamlake/uikit'
import { CONTROLS } from './specs'

// control-flow nodes — condition · switch · loop (while | foreach) · approval.
// A glyph replaces the kind-dot; the meta line summarises the control config.
export const ControlSpec = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    {CONTROLS.map((n) => <ControlNodeCard key={n.id} node={n} />)}
  </div>
)
