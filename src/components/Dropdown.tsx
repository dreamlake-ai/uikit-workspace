// Dropdown — the static-presentation dropdown atom for @dreamlake/uikit.
//
// Ports `.dd` from staging/dreamlake-design-guide.html (`#lab-dropdown`).
// The design-guide treats the dropdown as a visual surface — closed-state
// only, with an optional uppercase mono label rendered above. Real menu
// behaviour (popover, options, keyboard nav) is intentionally out of scope
// for this atom and will land in a follow-up PR.
//
// Source CSS, lifted for reference:
//
//   .ddwrap     inline-flex column · 4px gap · min-w 180
//   .dd-lbl     mono · 9px · 600 · +0.14em tracking · uppercase · muted
//   .dd         inline-flex · justify-between · 6px / 10px padding ·
//               radius 6 · 1px faint border · panel bg · mono 11px · ink
//   .dd .car    muted · margin-left 10px (the trailing ▾)
//   .dd.is-hover  border-color: color-mix(in oklab, var(--ink) 18%, transparent)
//   .dd.is-focus  accent border + 3px accent/18% halo
//   .dd.is-open   accent border (chevron rotated 180°)
//
// The `state` prop is a *visual* override — it forces the hover/focus/open
// paint independently of the underlying interaction state. Useful for the
// states specimen below and for documentation screenshots; not something
// downstream code should reach for in real use.
//
// At rest with no `state` prop, the native HTML `:hover` / `:focus-visible`
// rules paint as expected. Forcing a state stamps the same paint at the
// same specificity via Tailwind's `!important` modifier (`!`).

import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type DropdownState = 'rest' | 'hover' | 'focus' | 'open'

export type DropdownProps = {
  /** Optional uppercase mono label rendered ABOVE the control. */
  label?: string
  /** Current value text rendered inside the closed control. */
  value: ReactNode
  /** Visual state override for showcase / specimen use. Default `'rest'`. */
  state?: DropdownState
} & ButtonHTMLAttributes<HTMLButtonElement>

// Outer wrapper styling for the optional label slot.
const wrapCx = 'inline-flex flex-col'

const labelCx =
  'font-mono text-[9px] uppercase tracking-[0.12em] text-muted opacity-70 mb-1'

// Shared chrome — the closed-state paint. Native `:hover` / `:focus-visible`
// rules live here so the default (no `state` prop) reads correctly.
const baseCx =
  'inline-flex items-center gap-2 px-2.5 py-1 rounded-md ' +
  'border border-faint bg-bg ' +
  'font-mono text-[11.5px] text-ink ' +
  'cursor-pointer transition-[border-color] duration-[120ms] ease-out ' +
  'hover:border-[color-mix(in_oklab,var(--color-ink)_18%,transparent)] ' +
  'focus-visible:outline-2 focus-visible:outline-accent/50 focus-visible:outline-offset-1 ' +
  'focus-visible:border-[color-mix(in_oklab,var(--color-ink)_18%,transparent)]'

// Forced-state overrides. Each restates the same paint as the equivalent
// hover/focus rule, but stamped unconditionally with `!` so the visual
// reads even without real interaction. `open` mirrors the hover border —
// the chevron rotation does the rest of the work.
const stateCx: Record<DropdownState, string> = {
  rest: '',
  hover:
    'border-[color-mix(in_oklab,var(--color-ink)_18%,transparent)]!',
  focus:
    'border-[color-mix(in_oklab,var(--color-ink)_18%,transparent)]! ' +
    'outline-2 outline-accent/50 outline-offset-1',
  open:
    'border-[color-mix(in_oklab,var(--color-ink)_18%,transparent)]!',
}

const chevronCx = 'text-muted ml-auto transition-transform duration-[120ms] ease-out'
const chevronOpenCx = 'rotate-180'

export const Dropdown = ({
  label,
  value,
  state = 'rest',
  className,
  type = 'button',
  ...rest
}: DropdownProps) => {
  const cx = `${baseCx} ${stateCx[state]}${className ? ` ${className}` : ''}`
  const control = (
    <button type={type} className={cx} {...rest}>
      <span>{value}</span>
      <span aria-hidden="true" className={`${chevronCx} ${state === 'open' ? chevronOpenCx : ''}`}>
        ▾
      </span>
    </button>
  )

  if (label == null) return control
  return (
    <div className={wrapCx}>
      <div className={labelCx}>{label}</div>
      {control}
    </div>
  )
}
