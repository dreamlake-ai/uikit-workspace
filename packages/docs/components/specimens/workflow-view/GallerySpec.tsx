import { WorkflowThumb, type WorkflowSpec } from '@dreamlake/uikit'
import { RLHF, TELEOP } from './specs'

// The same four node families compose every data-production shape.
// `WorkflowThumb` is the static, non-interactive mini-render — the card-sized
// twin of the canvas, reusing the real layout engine so the shape is faithful.
const cell = (spec: WorkflowSpec, caption: string) => (
  <div style={{ flex: '1 1 260px', minWidth: 240, maxWidth: 340 }}>
    <div
      style={{
        height: 190,
        border: '1px solid var(--color-uikit-faint)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
        padding: 10,
      }}
    >
      <WorkflowThumb spec={spec} orientation="horizontal" />
    </div>
    <div
      style={{
        fontFamily: 'var(--font-uikit-mono)', fontSize: 10.5,
        color: 'var(--color-uikit-muted)', opacity: 0.85,
        textAlign: 'center', marginTop: 8, letterSpacing: '.02em',
      }}
    >
      {caption}
    </div>
  </div>
)

export const GallerySpec = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    {cell(RLHF, 'rlhf-preference-set — pairwise ranking with an agreement gate')}
    {cell(TELEOP, 'teleop-episode-curation — robot data with a human sign-off')}
  </div>
)
