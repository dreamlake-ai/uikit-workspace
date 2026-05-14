import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export interface SelectOption {
  value: string
  label: ReactNode
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  icon?: ReactNode
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  icon,
  className,
}: SelectProps) {
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
    <div ref={wrapRef} className={cn('relative inline-block', className)}>
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
        {current?.label}
        <span className="text-[9px] ml-0.5 opacity-55">▾</span>
      </span>

      {open && (
        <div
          className={cn(
            'absolute top-[calc(100%+8px)] right-0 z-10',
            'rounded-lg p-1 min-w-[140px]',
            'bg-uikit-bg border border-uikit-faint',
            'shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.08)]',
          )}
        >
          {options.map((o) => (
            <SelectItem
              key={o.value}
              active={o.value === value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </SelectItem>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectItem({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <div
      onClick={onClick}
      data-active={active || undefined}
      className={cn(
        'px-3.5 py-[7px] rounded-md cursor-pointer leading-[15px]',
        'font-uikit-mono text-[12.5px] font-medium tracking-uikit-snug',
        'transition-[background-color,color] duration-[120ms]',
        // Inactive defaults
        'text-uikit-muted opacity-85 bg-transparent',
        'hover:bg-uikit-ink-4',
        // Active overrides
        'data-[active]:text-uikit-ink data-[active]:opacity-100 data-[active]:bg-uikit-ink-5',
      )}
    >
      {children}
    </div>
  )
}
