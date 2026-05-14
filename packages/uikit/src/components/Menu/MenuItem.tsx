import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface MenuItemProps {
  /** Optional icon rendered before the label. */
  icon?: ReactNode
  label: ReactNode
  /** Use the design's semantic error color and a tinted-red hover. */
  danger?: boolean
  /** Visually muted, non-clickable. */
  disabled?: boolean
  onClick?: () => void
}

export function MenuItem({ icon, label, danger, disabled, onClick }: MenuItemProps) {
  return (
    <div
      role="menuitem"
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      data-danger={danger || undefined}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'flex items-center gap-2.5 px-3.5 py-[7px] select-none cursor-pointer',
        'font-uikit-ui text-[12.5px] font-medium leading-uikit-snug tracking-uikit-snug',
        'text-uikit-ink transition-colors duration-[120ms] ease-out',
        // hover background
        'hover:bg-uikit-ink-4',
        // danger variant
        'data-[danger]:text-uikit-danger data-[danger]:hover:bg-uikit-danger-8',
        // disabled overrides everything else
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        'data-[disabled]:text-uikit-muted',
        'data-[disabled]:hover:bg-transparent',
      )}
    >
      {icon && (
        <span className="inline-flex shrink-0 w-3.5 h-3.5 items-center justify-center opacity-75">
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">{label}</span>
    </div>
  )
}
