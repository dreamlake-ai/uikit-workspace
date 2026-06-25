import { Card, CardTitle } from '@dreamlake/uikit'

export const CollapsibleSpec = () => (
  <Card
    size="md"
    collapsible
    collapsedContent={<CardTitle>Advanced settings</CardTitle>}
    style={{ width: 320 }}
  >
    <CardTitle>Advanced settings</CardTitle>
    <div className="pt-2 text-uikit-12 text-uikit-muted">
      Body shown while expanded. Click the chevron to collapse to just the title row.
    </div>
  </Card>
)
