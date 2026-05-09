// TabStrip — mono small-caps tabs with a 2px ink underline.
//
// Ports `.tabs` from staging/dreamlake-design-guide.html (`#lab-tabs`).
// Source CSS:
//
//   .tabs           inline-flex · gap 18px · border-bottom 1px faint · padding 0 4px
//   .tabs .tab      mono 10.5px · 600 · tracking .12em · UPPERCASE · text-muted
//                   padding 10px 0 · position: relative
//   .tabs .tab.on   color: var(--ink)
//   .tabs .tab.on::after  2px tall · bottom: -1px · background: var(--ink)
//   .tabs .tab .ct  ml 6px · opacity .55 · weight 500 (optional trailing count)
//
// The active underline lives inside the active button (not as a sibling
// rail) — same approach as the source's `::after`. That keeps the
// component layout-trivial: no measure-then-position pass needed.
//
// TODO(flip-animation): for the animated FLIP-style transition between
// active tabs, the production version measures the previous and next
// active button rects on click, then animates a single shared underline
// rail. Left as a follow-up; the static underline below is faithful to
// the rest state of the source component.

import type { ReactNode } from 'react'

export type TabStripItem = {
  label: ReactNode
  /** Optional trailing count rendered in the `.ct` slot — e.g. `12`, `210`, or `'·'`. */
  count?: string | number
}

export type TabStripProps = {
  tabs: TabStripItem[]
  activeIndex: number
  onChange?: (index: number) => void
  className?: string
}

// Container. `inline-flex` so the strip width tracks its tabs (matches
// the source's bottom-border-only-where-the-tabs-are behaviour).
const listCx =
  'inline-flex items-center gap-[18px] border-b border-faint px-1'

// Tab button. `relative` so the underline can absolute-position at
// `bottom: -1px`, riding the container's bottom border. Cursor + select
// rules mirror the source.
const tabBaseCx =
  'relative bg-transparent border-0 cursor-pointer select-none ' +
  'py-2.5 px-0 ' +
  'font-mono text-[10.5px] font-semibold tracking-[0.12em] uppercase ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:text-ink'

const tabRestCx = 'text-muted hover:text-ink'
const tabActiveCx = 'text-ink'

// Trailing count — `.ct` in the source. ml 6px · opacity .55 · 500.
// Keeps the count visually subordinate to the label.
const countCx = 'ml-1.5 opacity-55 font-medium'

// Active underline — absolute, 2px, bottom: -1px so it sits exactly on
// top of the container's 1px bottom-border (overpainting it in ink).
// Border-radius 1 matches the source's 1px round.
const underlineCx =
  'absolute left-0 right-0 -bottom-px h-0.5 rounded-[1px] bg-ink'

const renderCount = (count: TabStripItem['count']) => {
  if (count == null) return null
  const s = String(count)
  // The source treats `·` and the empty string as "no count" sentinels —
  // they're knob placeholders, not real values. Same here.
  if (s === '' || s === '·') return null
  return <span className={countCx}>{s}</span>
}

export const TabStrip = ({
  tabs,
  activeIndex,
  onChange,
  className,
}: TabStripProps) => {
  const cx = `${listCx}${className ? ` ${className}` : ''}`
  return (
    <div role="tablist" className={cx}>
      {tabs.map((t, i) => {
        const active = i === activeIndex
        const tabCx = `${tabBaseCx} ${active ? tabActiveCx : tabRestCx}`
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={tabCx}
            onClick={onChange ? () => onChange(i) : undefined}
          >
            {t.label}
            {renderCount(t.count)}
            {active && <span aria-hidden="true" className={underlineCx} />}
          </button>
        )
      })}
    </div>
  )
}
