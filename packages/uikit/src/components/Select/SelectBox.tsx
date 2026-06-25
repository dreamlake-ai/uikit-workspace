import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export interface SelectBoxOption {
  value: string
  /** Content rendered in the dropdown row (and the trigger, unless
   *  `triggerLabel` is set). */
  label: ReactNode
  /** Optional compact content for the collapsed trigger — use when the trigger
   *  should be terser than the dropdown row (e.g. an abbreviation). Falls back
   *  to `label`. */
  triggerLabel?: ReactNode
  /** Optional secondary content shown right-aligned and muted within the
   *  dropdown row — e.g. a short code, shortcut, or count. */
  hint?: ReactNode
}

export interface SelectBoxProps {
  value: string
  onChange: (value: string) => void
  options: SelectBoxOption[]
  icon?: ReactNode
  /** Edge the dropdown panel aligns to, relative to the trigger. Default 'right'. */
  align?: 'left' | 'right'
  /** Vertical side the dropdown panel opens toward. Default 'bottom'. */
  placement?: 'top' | 'bottom'
  className?: string
}

/**
 * Compact `options`-driven select with a mono trigger — the DreamLake kit's
 * original Select, renamed to `SelectBox` so the `Select` name can host the
 * compound (Radix-style) API ported from the legacy `@vuer-ai/vuer-uikit`.
 * Use `SelectBox` for a terse inline picker; use `Select` for the
 * trigger/value/content/item composition.
 */
export function SelectBox({
  value,
  onChange,
  options,
  icon,
  align = 'right',
  placement = 'bottom',
  className,
}: SelectBoxProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  const current = options.find((o) => o.value === value) ?? options[0]

  return (
    <div ref={wrapRef} className={cn('relative inline-block w-fit', className)}>
      <span
        onClick={() => setOpen((o) => !o)}
        data-open={open || undefined}
        className={cn(
          'inline-flex items-center gap-1 cursor-pointer',
          'font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug',
          'text-uikit-ink opacity-85 data-[open]:opacity-100',
        )}
      >
        {icon && <span className="opacity-65">{icon}</span>}
        {current?.triggerLabel ?? current?.label}
        <span className="text-[9px] ml-0.5 opacity-55">▾</span>
      </span>

      {open && (
        <div
          className={cn(
            'absolute z-10',
            placement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
            align === 'left' ? 'left-0' : 'right-0',
            'rounded-lg p-1 min-w-[140px]',
            'bg-uikit-bg border border-uikit-faint shadow-uikit-soft',
          )}
        >
          {options.map((o) => (
            <SelectBoxRow
              key={o.value}
              active={o.value === value}
              hint={o.hint}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </SelectBoxRow>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectBoxRow({
  active,
  hint,
  onClick,
  children,
}: {
  active: boolean
  hint?: ReactNode
  onClick: () => void
  children: ReactNode
}) {
  const hasHint = hint != null
  return (
    <div
      onClick={onClick}
      data-active={active || undefined}
      className={cn(
        'px-3.5 py-[7px] rounded-md cursor-pointer leading-[15px]',
        'font-uikit-mono text-[12.5px] font-medium tracking-uikit-snug',
        'transition-[background-color,color] duration-[120ms]',
        'text-uikit-muted opacity-85 bg-transparent hover:bg-uikit-ink-4',
        'data-[active]:text-uikit-ink data-[active]:opacity-100 data-[active]:bg-uikit-ink-5',
        hasHint && 'flex items-center justify-between gap-3',
      )}
    >
      {hasHint ? (
        <>
          <span>{children}</span>
          <span className="shrink-0 text-[10px] opacity-55">{hint}</span>
        </>
      ) : (
        children
      )}
    </div>
  )
}
