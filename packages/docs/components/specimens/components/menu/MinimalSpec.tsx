import { Menu, MenuItem, MenuDivider } from '@dreamlake/uikit'

export const MinimalSpec = () => (
  <Menu
    align="left"
    width={180}
    trigger={(open) => (
      <span
        data-open={open || undefined}
        className="inline-flex items-center gap-1.5 font-uikit-mono text-uikit-11 font-medium leading-uikit-snug text-uikit-ink px-2.5 py-1.5 rounded-md bg-transparent data-[open]:bg-uikit-ink-6 cursor-pointer transition-[background] duration-[120ms]"
      >
        Actions <span className="opacity-55">▾</span>
      </span>
    )}
  >
    <MenuItem label="Rename" onClick={() => {}} />
    <MenuItem label="Duplicate" onClick={() => {}} />
    <MenuDivider />
    <MenuItem label="Delete" danger onClick={() => {}} />
  </Menu>
)
