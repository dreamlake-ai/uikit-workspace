// Static specimen: 6 swatch cards (3 light, 3 dark) showing each
// surface token's literal hex + role. The hex values are spelled out
// inline rather than read from the @theme block — the point of this
// component is to surface the literal contract so the reader can
// grep / verify against staging/tokens.css.

type Token = {
  name: string
  theme: 'light' | 'dark'
  hex: string
  role: string
}

const tokens: Token[] = [
  { name: '--bg', theme: 'light', hex: '#fffefa', role: 'Page / canvas. The pipelines dot grid paints on this.' },
  { name: '--panel-bg', theme: 'light', hex: '#fcfbf7', role: 'Panels, popovers, mid-column lists. Half-step darker than --bg.' },
  { name: '--rail-bg', theme: 'light', hex: '#fcfbf7', role: 'Left navbar. Shares --panel-bg in light.' },
  { name: '--bg', theme: 'dark', hex: '#2e2e35', role: 'Body / canvas. Lifted above the rail.' },
  { name: '--panel-bg', theme: 'dark', hex: '#2e2e35', role: 'Flattens onto --bg. Lift via hairline + shadow.' },
  { name: '--rail-bg', theme: 'dark', hex: '#2b2b31', role: 'A step deeper than --bg. Navbar recedes.' },
]

const cardCx = 'grid grid-cols-[64px_minmax(0,1fr)] gap-3 p-3 border border-uikit-faint rounded-md bg-uikit-panel'
const swatchCx = 'h-[64px] rounded border border-uikit-faint'
const nameCx = 'font-mono text-[12px] font-semibold text-uikit-ink leading-tight'
const tagCx = 'font-mono text-[9px] font-medium tracking-[0.1em] uppercase text-uikit-muted px-1.5 py-px rounded border border-uikit-faint ml-1.5 align-[1px]'
const hexCx = 'font-mono text-[10.5px] text-uikit-muted mt-1'
const roleCx = 'font-ui text-[12px] leading-[1.5] text-uikit-ink mt-1.5 [text-wrap:pretty]'

export const SurfaceTokens = () => (
  <div className="grid grid-cols-2 gap-2.5 my-6 max-[700px]:grid-cols-1">
    {tokens.map((t) => (
      <div key={`${t.name}-${t.theme}`} className={cardCx}>
        <div className={swatchCx} style={{ background: t.hex }} aria-hidden="true" />
        <div className="min-w-0">
          <div>
            <span className={nameCx}>{t.name}</span>
            <span className={tagCx}>{t.theme}</span>
          </div>
          <div className={hexCx}>{t.hex}</div>
          <div className={roleCx}>{t.role}</div>
        </div>
      </div>
    ))}
  </div>
)
