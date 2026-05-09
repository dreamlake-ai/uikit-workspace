// Panel — the universal panel shell. The standard `--panel-bg` surface
// + 1px `--faint` hairline + 10px radius (`--radius-md`) chassis used
// everywhere in the design guide. An optional eyebrow + title chrome
// sits above the body slot; consumers that just want the shell pass
// children only.
//
// Ports `#lab-panel` (.insp-panel) from staging/dreamlake-design-guide.html.
// The same panel surface is what `.rail-demo`, `.lab`, `.type-tbl`,
// `.scale-tbl`, etc. all share — see the CSS around lines 700-760 of
// the source HTML.
//
// API (kept minimal so this can graduate to `@dreamlake/uikit` cleanly):
//   <Panel>only-children body</Panel>
//   <Panel eyebrow="inspector · pipeline" title="classify-prod">
//     3 inputs · 1 output · last run 4m ago
//   </Panel>
//   <Panel shadow="lifted">popover content…</Panel>
//   <Panel shadow="hairline">nested panel content…</Panel>
//
// Shadow tiers map to the source CSS (`.shadow-resting` /
// `.shadow-lifted` / `.shadow-hairline`):
//
//   resting   — default · 1+8+16 layered shadow stack · resting cards
//   lifted    — deeper shadow · popovers, menus, modals at the top of the z-order
//   hairline  — no shadow at all · nested panels inside another panel
//
// Per the foundations rule, the three shadow stacks compose
// `--shadow-tint-{1,2,3}` only — no other shadow tokens exist; dark
// theme overrides those three vars to crank the alpha up.

import type { ReactNode } from 'react'

export type PanelShadow = 'resting' | 'lifted' | 'hairline'

export type PanelProps = {
  /** Mono caps eyebrow rendered above the title. Optional. */
  eyebrow?: string
  /** UI-font title rendered above the body. Optional. */
  title?: ReactNode
  /** Body slot. The eyebrow/title chrome is skipped if both are absent. */
  children?: ReactNode
  /** Shadow tier — see notes above. Defaults to `resting`. */
  shadow?: PanelShadow
  /** Extra classes appended to the outer panel. */
  className?: string
}

// Shared panel chassis: panel-bg surface, 1px faint border, 10px
// radius. Padding mirrors the source `.insp-panel` (14px / 16px); the
// minor `min-w-[260px]` cap from the source is dropped so consumers
// can pour the panel into a flex/grid cell of any width.
const baseCx =
  'bg-panel border border-faint rounded-md px-4 py-3.5'

// Three shadow tiers. Lifted matches the spec's deeper popover stack
// (`0 2px 6px tint-2, 0 24px 60px -16px tint-3`); hairline is pure
// border-only (no shadow). Resting is the canonical 1+8+16 stack used
// by every resting-card surface elsewhere in the guide.
const shadowCx: Record<PanelShadow, string> = {
  resting:
    'shadow-[0_1px_2px_var(--shadow-tint-1),0_8px_24px_-10px_var(--shadow-tint-3),0_16px_40px_-16px_var(--shadow-tint-2)]',
  lifted:
    'shadow-[0_2px_6px_var(--shadow-tint-2),0_24px_60px_-16px_var(--shadow-tint-3)]',
  hairline: 'shadow-none',
}

// Eyebrow: mono 9.5px / 600 / +0.12em tracking / uppercase / muted at
// 70% opacity. `mb-1` (4px) gap to the title.
const eyebrowCx =
  'font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase text-muted opacity-70 mb-1'

// Title: UI 16px / 600 / -0.005em tracking / ink. `mb-1.5` (6px) gap
// to the body. The source ships 13px here; the spec calls for 16px to
// give the panel a clearer head when used as a surface chassis.
const titleCx =
  'font-ui text-[16px] font-semibold tracking-[-0.005em] text-ink mb-1.5'

// Body: UI 13px / 400 / 1.55 leading / muted. Wrapping div keeps the
// body block-level so children (paragraphs, lists, sub-panels) flow
// naturally without inheriting the title's bottom margin.
const bodyCx = 'font-ui text-[13px] font-normal leading-[1.55] text-muted'

export const Panel = ({
  eyebrow,
  title,
  children,
  shadow = 'resting',
  className,
}: PanelProps) => {
  const hasHead = eyebrow != null || title != null
  const cx = `${baseCx} ${shadowCx[shadow]}${className ? ` ${className}` : ''}`

  return (
    <div className={cx}>
      {hasHead && (
        <>
          {eyebrow != null && <div className={eyebrowCx}>{eyebrow}</div>}
          {title != null && <div className={titleCx}>{title}</div>}
        </>
      )}
      {children != null && <div className={bodyCx}>{children}</div>}
    </div>
  )
}
