import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface SideNavProps {
  /** Pinned top area — logo, workspace label, collapse button, etc. */
  header: ReactNode
  /** Pinned bottom area — shortcuts, account row, etc. */
  footer?: ReactNode
  children?: ReactNode
  className?: string
}

export function SideNav({ header, footer, children, className }: SideNavProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 overflow-hidden',
        'bg-uikit-rail text-uikit-ink font-uikit-ui',
        className,
      )}
    >
      <div className="shrink-0">{header}</div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-inherit px-3.5 pb-[18px]">
        {children}
      </div>
      {footer && (
        <div className="shrink-0 bg-inherit pt-3 px-3.5 pb-3.5">{footer}</div>
      )}
    </div>
  )
}
