import { useState } from 'react'
import { Menu } from '@dreamlake/uikit'

/** Retained exit panels must give focus back before becoming inaccessible. */
export function FocusReturnSpec() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-4">
      <Menu
        open={open}
        onOpenChange={setOpen}
        trigger={() => <button type="button">Navigation menu</button>}
      >
        <a
          href="#focus-return"
          role="menuitem"
          className="block px-2 py-2"
          onClick={() => setOpen(false)}
        >
          Open project
        </a>
      </Menu>
      <input aria-label="Outside menu" placeholder="Outside focus destination" />
    </div>
  )
}
