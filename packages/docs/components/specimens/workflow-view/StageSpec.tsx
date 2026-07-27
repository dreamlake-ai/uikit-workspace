import { StageNode } from '@dreamlake/uikit'

// A stage is a hub in the flow, drawn with the same card style as every node —
// only the ink kind-dot and the meta line ("stage · N members · M done")
// distinguish it. Members fan out from it.
export const StageSpec = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    <StageNode stage={{ id: 'annotate', title: 'Annotate', detail: 'VLM labels + media prep' }} memberCount={3} doneCount={2} />
  </div>
)
