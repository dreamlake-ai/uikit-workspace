import { useState } from 'react'
import {
  Button,
  MouseCursorAltIcon,
  MouseCursorIcon,
  Toggle,
  ToggleButton,
  ToggleButtons,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@dreamlake/uikit'
import { CodeXml, Globe, Plus, Pointer, Rotate3d } from 'lucide-react'

// A faithful rebuild of the Vuer studio's floating top toolbar: a segmented
// `ToggleButtons` for the select modes, a standalone `Toggle` for the
// world/local coordinate mode, a ghost button for the scene editor, a
// separator, then the Add action. `variant="floating"` adds the overlay shadow.
export const StudioSpec = () => {
  const [mode, setMode] = useState('object')
  const [worldMode, setWorldMode] = useState(false)
  return (
    <Toolbar variant="floating" className="w-fit">
      <ToolbarGroup>
        <ToggleButtons
          value={mode}
          onValueChange={setMode}
          padding={false}
          variant="primary"
        >
          <ToggleButton icon value="object">
            <MouseCursorAltIcon />
          </ToggleButton>
          <ToggleButton icon value="group">
            <MouseCursorIcon />
          </ToggleButton>
          <ToggleButton icon value="off">
            <Pointer className="size-4" />
          </ToggleButton>
        </ToggleButtons>

        <Toggle
          variant="primary"
          pressed={worldMode}
          onPressedChange={setWorldMode}
          className="size-8"
        >
          {worldMode ? (
            <Globe className="size-4" />
          ) : (
            <Rotate3d className="size-4" />
          )}
        </Toggle>

        <Button variant="ghost" icon size="md">
          <CodeXml className="size-4" />
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <Button variant="secondary" size="md">
          <Plus className="size-4" /> Add
        </Button>
      </ToolbarGroup>
    </Toolbar>
  )
}
