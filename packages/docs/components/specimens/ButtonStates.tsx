// States gallery — for each variant (ghost, primary), shows the four
// canonical states side-by-side: rest, hover, focus, disabled.
//
// Hover and focus are *forced* via Tailwind state-modifier shorthands
// applied as utilities so the specimen doesn't depend on the reader
// mousing over to see the difference. Disabled uses the native
// attribute (which the Button component already styles via
// `disabled:opacity-40` etc).
//
// Forced-hover replicates the `.is-hover` source CSS by re-stating the
// hover paint at the same specificity. Cleaner than wrapping each
// instance in a state-faking parent.

import { Button } from '@dreamlake/uikit'

type Variant = 'ghost' | 'primary'
type State = 'rest' | 'hover' | 'focus' | 'disabled'

// Forced state styling — matches the hover/focus utilities the Button
// component sets, applied unconditionally. We keep these inline (vs.
// reading hover-state from Button itself) so the specimen advertises
// "this is what hover looks like" without DOM trickery.
const forcedHoverCx: Record<Variant, string> = {
  ghost:
    'text-ink! ' +
    'border-[color-mix(in_oklab,var(--color-ink)_18%,transparent)]! ' +
    'bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]!',
  primary:
    'bg-[color-mix(in_srgb,var(--color-accent)_88%,var(--color-ink))]!',
}

const forcedFocusCx =
  'outline-none ring-2 ring-accent/50'

const matrix: { variant: Variant; states: State[] }[] = [
  { variant: 'ghost', states: ['rest', 'hover', 'focus', 'disabled'] },
  { variant: 'primary', states: ['rest', 'hover', 'focus', 'disabled'] },
]

const renderButton = (variant: Variant, state: State) => {
  const label = state === 'rest' ? 'send to chat' : state
  if (state === 'disabled') {
    return (
      <Button variant={variant} icon="⌥⌘K" disabled>
        {label}
      </Button>
    )
  }
  if (state === 'hover') {
    return (
      <Button variant={variant} icon="⌥⌘K" className={forcedHoverCx[variant]}>
        {label}
      </Button>
    )
  }
  if (state === 'focus') {
    return (
      <Button variant={variant} icon="⌥⌘K" className={forcedFocusCx}>
        {label}
      </Button>
    )
  }
  return (
    <Button variant={variant} icon="⌥⌘K">
      {label}
    </Button>
  )
}

const headerCx =
  'font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase text-muted opacity-85 pb-2 border-b border-faint'

const rowLabelCx =
  'font-mono text-[10px] font-semibold tracking-[0.12em] uppercase text-muted opacity-85 self-center'

const cellCx =
  'flex items-center justify-start py-3'

const states: State[] = ['rest', 'hover', 'focus', 'disabled']

export const ButtonStates = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-4">
    <div className="grid grid-cols-[110px_repeat(4,minmax(0,1fr))] gap-4 max-[880px]:grid-cols-[90px_repeat(2,minmax(0,1fr))]">
      {/* Header row */}
      <div />
      {states.map((s) => (
        <div key={`h-${s}`} className={`${headerCx} max-[880px]:hidden`}>{s}</div>
      ))}

      {/* Variant rows */}
      {matrix.map(({ variant }) => (
        <div key={variant} className="contents">
          <div className={rowLabelCx}>{variant}</div>
          {states.map((s) => (
            <div key={`${variant}-${s}`} className={cellCx}>
              <div className="flex flex-col items-start gap-1">
                <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted opacity-70 hidden max-[880px]:inline">
                  {s}
                </span>
                {renderButton(variant, s)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
)
