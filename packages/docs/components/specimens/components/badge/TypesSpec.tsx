import { Badge } from '@dreamlake/uikit'

export const TypesSpec = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    {/* Count / label */}
    <Badge variant="default">3</Badge>
    {/* Circle — single glyph or count */}
    <Badge variant="success" type="circle">
      ✓
    </Badge>
    {/* Dot — bare status indicator, no label */}
    <Badge variant="destructive" type="dot" />
    <Badge variant="warning" type="dot" />
    <Badge variant="secondary" type="dot" />
  </div>
)
