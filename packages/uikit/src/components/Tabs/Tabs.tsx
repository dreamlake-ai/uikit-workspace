import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export type TabsVariant = 'underline' | 'segment'
export type TabsSize = 'xs' | 'sm' | 'md' | 'lg'

export interface Tab {
  value: string
  label: ReactNode
  count?: number // underline variant only
  title?: string // segment variant tooltip
}

export interface TabsProps {
  tabs: Tab[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  variant?: TabsVariant
  size?: TabsSize
  /** Override indicator thickness (px). Default: 4. */
  indicatorHeight?: number
  className?: string
}

// ── underline sizes ──────────────────────────────────────────────────────────

const underlineSizeMap: Record<TabsSize, string> = {
  xs: 'text-uikit-11 h-5 pt-px pb-[5px] mr-3',
  sm: 'text-uikit-12 h-[27px] pt-1 pb-2 mr-[18px]',
  md: 'text-[13.5px] h-[22px] pt-px pb-2 mr-[18px]',
  lg: 'text-[15px] h-[34px] pt-1 pb-3 mr-[22px]',
}

// ── segment sizes (exact reference values) ───────────────────────────────────

interface SegmentSizeConfig {
  inset: number
  containerR: number
  pillR: number
  buttonR: number
  padV: number
  padH: number
  iconSize: number
}

const segmentConfig: Record<TabsSize, SegmentSizeConfig> = {
  xs: { inset: 1, containerR: 4, pillR: 3, buttonR: 3, padV: 1, padH: 4, iconSize:  9 },
  sm: { inset: 1, containerR: 5, pillR: 4, buttonR: 4, padV: 2, padH: 5, iconSize: 10 },
  md: { inset: 2, containerR: 6, pillR: 5, buttonR: 5, padV: 4, padH: 7, iconSize: 12 },
  lg: { inset: 2, containerR: 7, pillR: 6, buttonR: 6, padV: 6, padH: 9, iconSize: 14 },
}

// ── underline tab item ───────────────────────────────────────────────────────

function UnderlineTabItem({
  tab,
  active,
  size,
  innerRef,
  onClick,
}: {
  tab: Tab
  active: boolean
  size: TabsSize
  innerRef: (el: HTMLDivElement | null) => void
  onClick: () => void
}) {
  const isSmall = size === 'xs' || size === 'sm'

  return (
    <div
      ref={innerRef}
      role="tab"
      aria-selected={active}
      data-active={active || undefined}
      data-small={isSmall || undefined}
      onClick={onClick}
      className={cn(
        'group/tab relative inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap',
        'font-uikit-ui tracking-uikit-snug',
        'transition-[color,opacity] duration-[120ms]',
        underlineSizeMap[size],
        // Color: muted by default, ink when active.
        'text-uikit-muted data-[active]:text-uikit-ink',
        // Weight (only when !isSmall).
        '[&:not([data-small])]:font-medium',
        '[&:not([data-small])]:data-[active]:font-semibold',
        // Opacity (large variants): rest 0.45, hover 0.7, active 1.
        '[&:not([data-small])]:opacity-45',
        '[&:not([data-small])]:hover:opacity-70',
        '[&:not([data-small])]:data-[active]:opacity-100',
        // Opacity (small variants): rest 0.75, hover/active 1.
        'data-[small]:opacity-75',
        'data-[small]:hover:opacity-100',
        'data-[small]:data-[active]:opacity-100',
      )}
    >
      <span>{tab.label}</span>
      {tab.count != null && (
        <span
          className={cn(
            'font-uikit-mono text-[9.5px] rounded-full px-1.5 py-px tracking-uikit-wide',
            'transition-[background-color,opacity] duration-[120ms]',
            // Weight + opacity track the parent's active/hover state.
            'font-medium opacity-55 group-hover/tab:opacity-90 group-data-[active]/tab:opacity-100',
            'group-data-[active]/tab:font-semibold',
            // Background tracks parent state — uses currentColor for theme inheritance.
            'bg-[color-mix(in_oklab,currentColor_5%,transparent)]',
            'group-data-[active]/tab:bg-[color-mix(in_oklab,currentColor_12%,transparent)]',
          )}
        >
          {tab.count}
        </span>
      )}
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  defaultValue,
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  indicatorHeight,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? tabs[0]?.value ?? '',
  )
  const [bar, setBar] = useState({
    left: 0, width: 0, height: 0, ready: false,
  })
  const tabRefs = useRef<Record<string, HTMLElement | null>>({})

  const activeValue = value !== undefined ? value : internalValue

  const handleTabClick = (newValue: string) => {
    if (value === undefined) setInternalValue(newValue)
    onChange?.(newValue)
  }

  useEffect(() => {
    if (value !== undefined) setInternalValue(value)
  }, [value])

  useEffect(() => {
    const el = tabRefs.current[activeValue]
    if (!el) return
    setBar({
      left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight, ready: true,
    })
  }, [activeValue, tabs.length])

  const segCfg = segmentConfig[size]

  return (
    <div
      role="tablist"
      className={cn(
        'relative font-uikit-ui',
        variant === 'underline' && 'flex items-end',
        variant === 'segment' && 'inline-flex bg-uikit-ink-5',
        className,
      )}
      style={
        variant === 'segment'
          ? {
              padding: segCfg.inset,
              gap: 1,
              borderRadius: segCfg.containerR,
            }
          : undefined
      }
    >
      {/* underline — sliding bottom indicator */}
      {variant === 'underline' && (
        <span
          className="absolute pointer-events-none z-[2] bg-uikit-ink"
          style={{
            left: bar.left,
            width: bar.width,
            height: indicatorHeight ?? 4,
            bottom: -1,
            transition: bar.ready
              ? 'left 280ms cubic-bezier(.4,0,.2,1), width 280ms cubic-bezier(.4,0,.2,1)'
              : 'none',
          }}
        />
      )}

      {/* segment — elevated pill matching the page background */}
      {variant === 'segment' && (
        <div
          aria-hidden
          // Style Guide §Elevation tint-1 — the resting-panel tint.
          // Theme-aware via `--shadow-tint-1` so dark mode darkens.
          className="absolute pointer-events-none bg-uikit-bg shadow-[0_1px_2px_var(--shadow-tint-1)]"
          style={{
            top: segCfg.inset,
            bottom: segCfg.inset,
            left: 0,
            width: bar.width,
            transform: `translateX(${bar.left}px)`,
            borderRadius: segCfg.pillR,
            opacity: bar.ready ? 1 : 0,
            transition: bar.ready
              ? 'transform 220ms cubic-bezier(.32,.72,0,1), width 220ms cubic-bezier(.32,.72,0,1)'
              : 'none',
          }}
        />
      )}

      {/* tab items */}
      {tabs.map((tab) => {
        const active = tab.value === activeValue

        if (variant === 'underline') {
          return (
            <UnderlineTabItem
              key={tab.value}
              tab={tab}
              active={active}
              size={size}
              innerRef={(el) => {
                tabRefs.current[tab.value] = el
              }}
              onClick={() => handleTabClick(tab.value)}
            />
          )
        }

        // segment
        return (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[tab.value] = el
            }}
            type="button"
            title={tab.title}
            aria-pressed={active}
            data-active={active || undefined}
            onClick={() => handleTabClick(tab.value)}
            className={cn(
              'relative z-[1] inline-flex items-center justify-center cursor-pointer',
              'appearance-none border-0 bg-transparent outline-none',
              'text-uikit-muted data-[active]:text-uikit-ink',
              'transition-colors duration-[160ms]',
            )}
            style={{
              padding: `${segCfg.padV}px ${segCfg.padH}px`,
              borderRadius: segCfg.buttonR,
              fontSize: segCfg.iconSize,
              lineHeight: 1,
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
