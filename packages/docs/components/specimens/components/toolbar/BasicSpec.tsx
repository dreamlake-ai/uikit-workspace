import { Toolbar, ToolbarGroup, ToolbarSeparator, Button } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <Toolbar className="w-fit">
    <ToolbarGroup>
      <Button size="sm" variant="ghost">
        Cut
      </Button>
      <Button size="sm" variant="ghost">
        Copy
      </Button>
      <Button size="sm" variant="ghost">
        Paste
      </Button>
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <Button size="sm" variant="ghost">
        Undo
      </Button>
      <Button size="sm" variant="ghost">
        Redo
      </Button>
    </ToolbarGroup>
  </Toolbar>
)
