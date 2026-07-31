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
        Actions{' '}
        <span
          data-menu-arrow
          data-open={open || undefined}
          className="opacity-55 inline-block rotate-0 data-[open]:rotate-180 transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        >
          ▾
        </span>
      </span>
    )}
  >
    <MenuItem label="Rename" onClick={() => {}} />
    <MenuItem label="Duplicate" onClick={() => {}} />
    <MenuDivider />
    <MenuItem label="Delete" danger onClick={() => {}} />
  </Menu>
)
