import { Collapsible, CollapsibleTrigger, CollapsibleContent, Button } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <Collapsible defaultOpen style={{ width: 280 }}>
    <CollapsibleTrigger asChild>
      <Button variant="secondary" size="sm">
        Toggle details
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent className="pt-2">
      <div
        style={{
          fontSize: 12,
          color: 'var(--uikit-muted)',
          border: '1px solid var(--faint)',
          borderRadius: 10,
          padding: 12,
        }}
      >
        Collapsible content animates its height open and closed with a pure-CSS
        grid transition — no measured keyframes, no extra dependencies.
      </div>
    </CollapsibleContent>
  </Collapsible>
)
