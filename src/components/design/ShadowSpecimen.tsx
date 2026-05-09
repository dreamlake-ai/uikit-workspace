// Shadow specimen — ported from staging/dreamlake-design-guide.html §04
// (id="sub-shadows"). The three layered tints + the inset variant are
// declared in :root inside src/theme.css (NOT in @theme — they're not
// utility-generating tokens). Reference them directly through the CSS
// custom property in inline style. Dark mode uses pure black at higher
// opacity — see theme.css [data-theme="dark"] override.

type Shadow = {
  name: string
  values: string
  role: string
  shadow: string
}

const shadows: Shadow[] = [
  {
    name: 'tint-1',
    values: '.06 / .45',
    role: 'Panel base shadow.',
    shadow: '0 1px 2px var(--shadow-tint-1)',
  },
  {
    name: 'tint-2',
    values: '.10 / .60',
    role: 'Lifted panel · floating popover.',
    shadow: '0 6px 18px var(--shadow-tint-2)',
  },
  {
    name: 'tint-3',
    values: '.16 / .75',
    role: 'Modal · vim-help overlay.',
    shadow: '0 12px 36px var(--shadow-tint-3)',
  },
  {
    name: 'inset',
    values: '.08 / .50',
    role: 'Pressed states, focused inputs.',
    shadow: 'inset 0 0 0 1px var(--shadow-inset)',
  },
]

const cardCx = 'border border-faint rounded-md bg-panel p-3 flex flex-col gap-2'
const demoCx = 'h-20 flex items-center justify-center'
const tileCx = 'w-3/4 h-12 rounded-md bg-panel'
const headRowCx = 'flex items-baseline'
const nameCx = 'font-mono text-[12px] font-semibold text-ink'
const valuesCx = 'font-mono text-[10.5px] text-muted'
const roleCx = 'font-ui text-[12px] leading-[1.5] text-ink [text-wrap:pretty]'

export const ShadowSpecimen = () => (
  <div className="grid grid-cols-2 gap-2.5 my-6 max-[560px]:grid-cols-1">
    {shadows.map((s) => (
      <div key={s.name} className={cardCx}>
        <div className={demoCx}>
          <div className={tileCx} style={{ boxShadow: s.shadow }} aria-hidden="true" />
        </div>
        <div className={headRowCx}>
          <span className={nameCx}>{s.name}</span>
        </div>
        <div className={valuesCx}>{s.values}</div>
        <div className={roleCx}>{s.role}</div>
      </div>
    ))}
  </div>
)
