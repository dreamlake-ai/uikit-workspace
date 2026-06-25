import { Popover, PopoverTrigger, PopoverContent, PopoverClose, Button } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button size="sm" variant="secondary">
        Open popover
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
        <div className="text-uikit-12 font-medium text-uikit-ink">Quick settings</div>
        <div className="text-uikit-11 text-uikit-muted">
          Anchored to the trigger; flips and shifts to stay on-screen.
        </div>
        <PopoverClose asChild>
          <Button size="sm">Done</Button>
        </PopoverClose>
      </div>
    </PopoverContent>
  </Popover>
)
