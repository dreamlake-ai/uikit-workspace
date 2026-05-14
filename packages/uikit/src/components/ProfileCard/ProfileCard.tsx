import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface ProfileCardProps {
  title: ReactNode
  tag?: ReactNode // small badge/chip immediately after title
  titleRight?: ReactNode // right-aligned header meta (timestamp, version)
  description?: ReactNode
  footer?: ReactNode
  hoverActions?: ReactNode // revealed on hover, anchored to bottom-right
  onClick?: () => void
  className?: string
}

export function ProfileCard({
  title,
  tag,
  titleRight,
  description,
  footer,
  hoverActions,
  onClick,
  className,
}: ProfileCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-xl border border-uikit-faint',
        'px-4 py-3.5 min-w-0',
        'font-uikit-ui text-uikit-ink',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* header */}
      <div className="flex items-baseline gap-2.5">
        <span className="text-uikit-14 font-medium tracking-uikit-tight leading-uikit-snug">
          {title}
        </span>
        {tag && (
          <span className="font-uikit-mono text-[10.5px] opacity-80 whitespace-nowrap">
            {tag}
          </span>
        )}
        <span className="flex-1" />
        {titleRight && (
          <span className="font-uikit-mono text-uikit-11 text-uikit-muted opacity-65 tracking-uikit-snug whitespace-nowrap">
            {titleRight}
          </span>
        )}
      </div>

      {/* description */}
      {description && (
        <div className="mt-1.5 text-uikit-13 font-normal opacity-75 leading-normal tracking-uikit-snug">
          {description}
        </div>
      )}

      {/* footer */}
      {footer && (
        <div className="mt-1.5 font-uikit-mono text-uikit-11 opacity-75 tracking-uikit-snug truncate">
          {footer}
        </div>
      )}

      {/* hover actions */}
      {hoverActions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute right-3 bottom-[9px] inline-flex items-center gap-1.5',
            'font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug',
            'opacity-0 pointer-events-none transition-opacity duration-[120ms]',
            'group-hover:opacity-100 group-hover:pointer-events-auto',
          )}
        >
          {hoverActions}
        </div>
      )}
    </div>
  )
}
