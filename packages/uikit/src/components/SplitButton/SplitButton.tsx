import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button, type ButtonProps } from '../Button'
import { Menu, type MenuProps } from '../Menu'

export interface SplitButtonProps extends Omit<ButtonProps, 'href' | 'asChild' | 'children'> {
  /** Primary action label or icon. Icon-only actions need an aria-label. */
  children: ReactNode
  /** Alternatives, composed from MenuItem / MenuSection / MenuDivider. */
  menu: ReactNode
  menuLabel?: string
  menuWidth?: number
  align?: MenuProps['align']
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** One action with alternatives. Both halves use the same Button variant,
 * size and 6px outer corners; only their shared inner corners are squared. */
export function SplitButton({
  children,
  menu,
  menuLabel = 'More options',
  menuWidth = 200,
  align = 'right',
  open: controlledOpen,
  onOpenChange,
  variant = 'secondary',
  size = 'sm',
  disabled = false,
  loading = false,
  tone,
  value,
  hoverBg,
  style,
  ...primaryProps
}: SplitButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const unavailable = disabled || loading
  const requestedOpen = controlledOpen ?? internalOpen
  const open = requestedOpen && !unavailable
  const trigger = useRef<HTMLButtonElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const setOpen = (next: boolean) => {
    const allowed = next && !unavailable
    if (controlledOpen === undefined) setInternalOpen(allowed)
    onOpenChange?.(allowed)
    if (!allowed && content.current?.contains(document.activeElement)) trigger.current?.focus()
  }
  const items = () =>
    Array.from(
      content.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])'
      ) ?? []
    )
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      for (const item of items()) item.tabIndex = -1
      items()[0]?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])
  useEffect(() => {
    if (unavailable && requestedOpen) setOpen(false)
  }, [unavailable, requestedOpen])

  return (
    <span
      data-split-button=""
      className="inline-flex shrink-0 items-stretch rounded-[6px] [&>span]:inline-flex [&>span]:items-stretch"
    >
      <Button
        {...primaryProps}
        variant={variant}
        size={size}
        tone={tone}
        value={value}
        hoverBg={hoverBg}
        disabled={disabled}
        loading={loading}
        style={{ ...style, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        {children}
      </Button>
      <Menu
        open={open}
        onOpenChange={setOpen}
        align={align}
        width={menuWidth}
        trigger={(expanded) => (
          <Button
            ref={trigger}
            variant={variant}
            size={size}
            tone={tone}
            value={value}
            hoverBg={hoverBg}
            disabled={unavailable}
            icon
            aria-label={menuLabel}
            aria-haspopup="menu"
            aria-expanded={expanded}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              ...(variant === 'secondary' ? { borderLeftWidth: 0 } : {}),
              boxShadow:
                variant === 'primary' || variant === 'danger' || variant === 'destructive'
                  ? 'inset 1px 0 0 rgb(255 255 255 / 20%)'
                  : undefined,
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                setOpen(true)
              }
            }}
          >
            <ChevronDown
              data-menu-arrow
              size={12}
              aria-hidden="true"
              style={{
                transform: expanded ? 'rotate(180deg)' : undefined,
                transition: 'transform 150ms ease',
              }}
            />
          </Button>
        )}
      >
        <div
          ref={content}
          onClick={(event) => {
            const item = (event.target as Element).closest('[role="menuitem"]')
            if (item && item.getAttribute('aria-disabled') !== 'true') setOpen(false)
          }}
          onKeyDown={(event) => {
            const options = items()
            const current = options.indexOf(document.activeElement as HTMLElement)
            let next: number | undefined
            if (event.key === 'ArrowDown') next = (current + 1) % options.length
            if (event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length
            if (event.key === 'Home') next = 0
            if (event.key === 'End') next = options.length - 1
            if (next !== undefined) {
              event.preventDefault()
              options[next]?.focus()
            }
            if (event.key === 'Enter' || event.key === ' ') {
              if (current >= 0) {
                event.preventDefault()
                options[current].click()
              }
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
            }
            if (event.key === 'Tab') setOpen(false)
          }}
        >
          {menu}
        </div>
      </Menu>
    </span>
  )
}
