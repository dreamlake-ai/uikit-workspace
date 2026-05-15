import {
  forwardRef,
  RefObject,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { cn } from '../../lib/utils'
import { Select } from '../Select/Select'

// ── Types ──────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string
  label: string
  count?: number
  /** Optional tint color applied when count > 0. Prefer palette tones
   *  (`'#1f8f4a'` / `var(--tone-green)` for running, `'#c8513b'` /
   *  `var(--tone-red)` for failed). Style Guide §Color §"Never invent
   *  a near-miss hex." */
  accent?: string
}

export interface FilterBarProps {
  /** Filter chips rendered on the left. First option is treated as "all". Omit to hide chips. */
  filters?: FilterOption[]
  filterValue?: string
  onFilterChange?: (value: string) => void

  query: string
  onQueryChange: (q: string) => void
  placeholder?: string
  searchRef?: RefObject<HTMLInputElement>

  /** Sort dropdown rendered on the right. Omit to hide. */
  sortValue?: string
  onSortChange?: (value: string) => void
  sortOptions?: { value: string; label: string }[]

  className?: string
}

// ── FilterChip ─────────────────────────────────────────────────────────────

const FilterChip = forwardRef<
  HTMLSpanElement,
  { option: FilterOption; active: boolean; onClick: () => void }
>(function FilterChip({ option, active, onClick }, ref) {
  const { label, count, accent } = option
  const isHot = !!accent && (count ?? 0) > 0
  const showCount = count !== undefined && count !== 0

  // Hot chips force their accent color (status palette); inject it as a CSS var
  // so the Tailwind `text-[color:var(--chip-accent)]` arbitrary can pick it up.
  const cssVars: CSSProperties | undefined = isHot
    ? ({ '--chip-accent': accent } as CSSProperties)
    : undefined

  return (
    <span
      ref={ref}
      onClick={onClick}
      data-active={active || undefined}
      data-hot={isHot || undefined}
      style={cssVars}
      className={cn(
        'group/chip inline-flex items-start gap-px cursor-pointer pb-[3px] font-uikit-mono tracking-uikit-snug',
        'transition-[color,opacity] duration-[160ms]',
        // Color: hot chips use injected --chip-accent; otherwise muted/ink by active.
        'text-uikit-muted data-[active]:text-uikit-ink',
        'data-[hot]:!text-[color:var(--chip-accent)]',
        // Weight: hot=600, normal=500.
        'font-medium data-[hot]:font-semibold',
        // Opacity: rest 0.7 (hot 0.95) → hover 0.9 → active 1.
        'opacity-70 hover:opacity-90 data-[active]:opacity-100',
        'data-[hot]:opacity-95',
      )}
    >
      <span className="text-uikit-11">{label}</span>
      {showCount && (
        <sup
          className={cn(
            'text-[8px] font-medium leading-none align-top mt-1 tracking-uikit-snug',
            'text-current opacity-100', // inherits color/opacity from parent chip
          )}
        >
          {count}
        </sup>
      )}
    </span>
  )
})

// ── FilterChipRow ──────────────────────────────────────────────────────────

function FilterChipRow({
  options,
  value,
  onChange,
}: {
  options: FilterOption[]
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const [bar, setBar] = useState({ left: 0, width: 0, ready: false })

  useLayoutEffect(() => {
    const el = itemRefs.current[value]
    const container = containerRef.current
    if (!el || !container) return
    const elRect = el.getBoundingClientRect()
    const cRect = container.getBoundingClientRect()
    setBar({
      left: elRect.left - cRect.left,
      width: elRect.width,
      ready: true,
    })
  }, [value, options.length])

  return (
    <div ref={containerRef} className="flex items-center gap-2 pr-2 relative">
      {options.map((opt) => (
        <FilterChip
          key={opt.value}
          ref={(el) => {
            itemRefs.current[opt.value] = el
          }}
          option={opt}
          active={opt.value === value}
          onClick={() => onChange(opt.value)}
        />
      ))}
      {/* Sliding underline — travels between chips */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 pointer-events-none h-px bg-uikit-ink"
        style={{
          width: bar.width,
          transform: `translateX(${bar.left}px)`,
          opacity: bar.ready ? 1 : 0,
          transition: bar.ready
            ? 'transform 260ms cubic-bezier(.2,.7,.2,1), width 260ms cubic-bezier(.2,.7,.2,1)'
            : 'none',
        }}
      />
    </div>
  )
}

// ── FilterSearchLine ───────────────────────────────────────────────────────

function FilterSearchLine({
  query,
  onQueryChange,
  searchRef,
  token,
  onClearToken,
  placeholder = 'search',
}: {
  query: string
  onQueryChange: (q: string) => void
  searchRef?: RefObject<HTMLInputElement>
  token: string | null
  onClearToken: () => void
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  const active = focused || query.length > 0

  return (
    <label
      data-active={active || undefined}
      className={cn(
        'inline-flex items-center gap-2 border-b pb-1 transition-[border-color] duration-[160ms]',
        'border-uikit-faint data-[active]:border-uikit-ink',
        'flex-1 min-w-[200px] basis-[320px]',
      )}
    >
      {/* "/" glyph */}
      <span className="shrink-0 font-uikit-mono text-uikit-11 text-uikit-muted opacity-55 tracking-uikit-snug">
        /
      </span>

      {/* Active filter token — click or Backspace to remove */}
      {token && (
        <span
          onClick={onClearToken}
          title="backspace to remove"
          className={cn(
            'inline-flex items-center gap-1 shrink-0 cursor-pointer rounded',
            'font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug',
            'text-uikit-ink bg-uikit-ink-8 px-1.5 py-0.5',
          )}
        >
          {token}
          <span className="opacity-55 text-uikit-10">×</span>
        </span>
      )}

      {/* Input */}
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && query === '' && token) {
            e.preventDefault()
            onClearToken()
          }
        }}
        placeholder={token ? 'filter…' : placeholder}
        className={cn(
          'bg-transparent border-0 outline-none p-0 min-w-0 flex-1',
          'font-uikit-mono text-uikit-12 text-uikit-ink tracking-uikit-snug',
        )}
      />

      {/* Clear */}
      {query && (
        <span
          onClick={() => onQueryChange('')}
          className={cn(
            'cursor-pointer shrink-0 font-uikit-mono text-uikit-10 tracking-uikit-snug',
            'text-uikit-muted opacity-65',
          )}
        >
          clear
        </span>
      )}
    </label>
  )
}

// ── FilterBar ──────────────────────────────────────────────────────────────

export function FilterBar({
  filters,
  filterValue,
  onFilterChange,
  query,
  onQueryChange,
  placeholder = 'search',
  searchRef,
  sortValue,
  onSortChange,
  sortOptions,
  className,
}: FilterBarProps) {
  const allValue = filters?.[0]?.value
  const searching = query.length > 0
  const showToken =
    !!filters && searching && !!filterValue && filterValue !== allValue
  const activeFilter = filters?.find((f) => f.value === filterValue)
  const tokenLabel = showToken
    ? (activeFilter?.label ?? filterValue ?? null)
    : null

  return (
    <div className={cn('flex flex-col gap-3 pb-3.5 mb-1.5', className)}>
      <div className="flex items-center gap-4">
        {/* Left: chips (resting state) + search line */}
        <div className="flex items-center flex-1 min-w-0 relative">
          {filters && !searching && (
            <FilterChipRow
              options={filters}
              value={filterValue ?? allValue ?? ''}
              onChange={(v) => onFilterChange?.(v)}
            />
          )}
          <FilterSearchLine
            query={query}
            onQueryChange={onQueryChange}
            searchRef={searchRef}
            token={tokenLabel}
            onClearToken={() => onFilterChange?.(allValue ?? '')}
            placeholder={placeholder}
          />
        </div>

        {/* Right: sort */}
        {sortOptions && sortOptions.length > 0 && (
          <Select
            icon="↕"
            value={sortValue ?? sortOptions[0].value}
            onChange={(v) => onSortChange?.(v)}
            options={sortOptions}
          />
        )}
      </div>
    </div>
  )
}
