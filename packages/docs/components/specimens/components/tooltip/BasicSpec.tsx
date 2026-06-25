import { Tooltip, TooltipTrigger, TooltipContent, Button } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <div style={{ display: 'flex', gap: 12 }}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="sm" variant="secondary">
          Hover me
        </Button>
      </TooltipTrigger>
      <TooltipContent>Saves without leaving the page</TooltipContent>
    </Tooltip>
    <Tooltip side="right">
      <TooltipTrigger asChild>
        <Button size="sm" variant="ghost">
          Right
        </Button>
      </TooltipTrigger>
      <TooltipContent>Opens to the right; flips if it would clip.</TooltipContent>
    </Tooltip>
  </div>
)
