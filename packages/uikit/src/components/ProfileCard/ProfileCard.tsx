import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface ProfileCardProps {
  title: ReactNode
  tag?: ReactNode // small badge/chip immediately after title
  titleRight?: ReactNode // right-aligned header meta (timestamp, version)
  description?: ReactNode
  footer?: ReactNode
  /** Right-aligned content alongside `footer`. Use for ACL chips, member
   *  avatars, status badges — anything that should sit on the footer's right
   *  while `footer` keeps the left-side stats. Shares the footer row's mono
   *  typography; wrap in a styled element to override. */
  footerRight?: ReactNode
  /** Hover-revealed actions anchored to the card's top-right. Use for the
   *  edit/delete pattern. When this slot is provided, `titleRight` auto-fades
   *  on hover so the two don't visually collide. Clicks do not bubble to
   *  `onClick`. */
  topRightActions?: ReactNode
  /** Hover-revealed actions anchored to the card's bottom-right. Use for
   *  primary inline actions (fork, open, etc). Clicks do not bubble to
   *  `onClick`. */
  hoverActions?: ReactNode
  onClick?: () => void
  className?: string
}

export function ProfileCard({
  title,
  tag,
  titleRight,
  description,
  footer,
  footerRight,
  topRightActions,
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
          <span
            className={cn(
              'font-uikit-mono text-uikit-11 text-uikit-muted opacity-65 tracking-uikit-snug whitespace-nowrap',
              // When topRightActions are also present, fade titleRight on
              // hover so the hover-revealed cluster doesn't collide with
              // the meta (e.g. timestamp behind edit/delete buttons).
              topRightActions && 'transition-opacity duration-[120ms] group-hover:opacity-0',
            )}
          >
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

      {/* footer (+ optional right-aligned cluster) */}
      {(footer || footerRight) && (
        <div className="mt-1.5 flex items-center gap-3 min-w-0 font-uikit-mono text-uikit-11 tracking-uikit-snug">
          {footer ? (
            <div className="flex-1 min-w-0 truncate opacity-75">{footer}</div>
          ) : (
            <span className="flex-1" />
          )}
          {footerRight && (
            <div className="flex-shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap">
              {footerRight}
            </div>
          )}
        </div>
      )}

      {/* top-right hover actions (edit / delete pattern) */}
      {topRightActions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute right-3 top-3 inline-flex items-center gap-1',
            'opacity-0 pointer-events-none transition-opacity duration-[120ms]',
            'group-hover:opacity-100 group-hover:pointer-events-auto',
          )}
        >
          {topRightActions}
        </div>
      )}

      {/* bottom-right hover actions (primary inline action) */}
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
