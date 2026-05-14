import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface SideNavGroupProps {
  title: string
  /** Optional node rendered to the right of the title — e.g. an icon button. */
  action?: ReactNode
  children?: ReactNode
  className?: string
}

export function SideNavGroup({
  title,
  action,
  children,
  className,
}: SideNavGroupProps) {
  return (
    <div className={cn('mb-[22px] bg-inherit', className)}>
      <div className="sticky top-0 z-10 bg-inherit flex items-center pb-2">
        <span
          className={cn(
            'flex-1 pl-1',
            'font-uikit-mono text-[9.5px] font-medium tracking-uikit-widest uppercase',
            'text-uikit-muted opacity-55',
          )}
        >
          {title}
        </span>
        {action}
      </div>
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  )
}
