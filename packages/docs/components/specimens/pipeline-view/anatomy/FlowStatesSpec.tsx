import { FLOW, edgeFlow, type EdgeFlow, type NodeStatus } from '@dreamlake/uikit'

// The six CONNECTOR STATES, each derived from a (source status → target status)
// pair via the same `edgeFlow()` the component uses — no edge stores its look.
// Each row shows the derived swatch (colour + width + dash + animation) next to
// the node-status pair that produces it. (The dl-edge-* keyframes are injected
// by any <PipelineGraph> on the page.)
const CASES: { pair: [NodeStatus, NodeStatus]; note: string }[] = [
  { pair: ['running', 'idle'], note: 'data is flowing now' },
  { pair: ['ok', 'idle'], note: 'produced, waiting on downstream' },
  { pair: ['stale', 'idle'], note: 'upstream went stale' },
  { pair: ['error', 'idle'], note: 'an endpoint failed' },
  { pair: ['ok', 'ok'], note: 'both settled ok' },
  { pair: ['idle', 'idle'], note: 'nothing has run' },
]

function Swatch({ flow }: { flow: EdgeFlow }) {
  const s = FLOW[flow]
  return (
    <svg width="46" height="10" viewBox="0 0 46 10" style={{ flexShrink: 0 }}>
      <line
        x1="1" y1="5" x2="45" y2="5"
        stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash}
        strokeLinecap="round" className={s.anim}
      />
    </svg>
  )
}

export const FlowStatesSpec = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '10px 18px',
      width: '100%',
      fontFamily: 'var(--font-uikit-mono)',
    }}
  >
    {CASES.map(({ pair: [src, dst], note }) => {
      const flow = edgeFlow(src, dst)
      const s = FLOW[flow]
      return (
        <div
          key={flow}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            border: '1px solid var(--color-uikit-faint)',
            background: 'var(--color-uikit-panel)',
          }}
        >
          <Swatch flow={flow} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{flow}</span>
            <span style={{ fontSize: 10, color: 'var(--color-uikit-muted)' }}>
              {src} → {dst} · {note}
            </span>
          </div>
        </div>
      )
    })}
  </div>
)
