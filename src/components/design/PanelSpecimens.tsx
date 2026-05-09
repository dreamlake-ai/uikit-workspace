// Live specimens for `<Panel />` — two galleries that mirror the
// knobs from staging/dreamlake-design-guide.html `#lab-panel`:
//
//   1. Anatomy       — eyebrow + title + body breakdown of a single
//                      resting panel, with a name-column callout for
//                      each part.
//   2. Shadow tiers  — three panels side-by-side, one per shadow tier
//                      (resting / lifted / hairline) so the tier
//                      delta reads at a glance.
//
// Layout chrome mirrors the chip / status / avatar specimens — same
// rounded panel surface, same eyebrow + sub label typographic stack.

import { Panel, type PanelShadow } from '../Panel'

// Shared row layout for the anatomy specimen — `name | demo | role`
// columns collapsing under 880px to a stacked layout, matching the
// other component specimens in this folder.
const rowCx =
  'grid grid-cols-[160px_minmax(0,1fr)_220px] gap-4 items-start py-4 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-2 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'
const roleCx =
  'font-ui text-[12px] leading-[1.5] text-muted [text-wrap:pretty]'

// ── Anatomy ───────────────────────────────────────────────────────
//
// One panel rendered fully composed plus a row-level annotation of
// each chrome part — eyebrow, title, body, and the bare shell that
// wraps them.

type AnatomyRow = {
  part: string
  spec: string
  role: string
}

const anatomyRows: AnatomyRow[] = [
  {
    part: 'shell',
    spec: 'panel-bg · 1px faint · radius 10',
    role: 'The panel chassis. Same surface every panel in the guide pours into — rail-demo, lab, type-tbl, scale-tbl all share it.',
  },
  {
    part: 'eyebrow',
    spec: 'mono 9.5 · 600 · +0.12em · UPPER',
    role: 'Optional. A single muted line above the title — a domain or pipeline tag, never a sentence.',
  },
  {
    part: 'title',
    spec: 'ui 16 · 600 · -0.005em · ink',
    role: 'Optional. The panel’s name in plain UI text. ReactNode so consumers can drop a status dot or chip alongside it.',
  },
  {
    part: 'body',
    spec: 'ui 13 · 400 · 1.55 · muted',
    role: 'The children slot. A short clause for inspectors; arbitrary content (lists, sub-panels, controls) for surface-shell uses.',
  },
]

export const PanelAnatomySpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {/* Top row: a fully-composed panel as a live exemplar. */}
    <div className={rowCx}>
      <div>
        <span className={nameCx}>composed</span>
        <span className={subCx}>resting · 1+8+16</span>
      </div>
      <div className="min-w-0">
        <Panel eyebrow="inspector · pipeline" title="classify-prod">
          3 inputs · 1 output · last run 4m ago
        </Panel>
      </div>
      <div className={roleCx}>
        The canonical inspector panel. Eyebrow + title + a one-clause body
        on the resting shadow tier.
      </div>
    </div>
    {/* Per-part annotations. */}
    {anatomyRows.map((r) => (
      <div key={r.part} className={rowCx}>
        <div>
          <span className={nameCx}>part · {r.part}</span>
          <span className={subCx}>{r.spec}</span>
        </div>
        <div className="min-w-0">
          {r.part === 'shell' && (
            <Panel>
              <span className="font-mono text-[10.5px] text-muted">
                {'<Panel>{children}</Panel>'}
              </span>
            </Panel>
          )}
          {r.part === 'eyebrow' && <Panel eyebrow="inspector · pipeline" />}
          {r.part === 'title' && <Panel title="classify-prod" />}
          {r.part === 'body' && (
            <Panel>3 inputs · 1 output · last run 4m ago</Panel>
          )}
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)

// ── Shadow tiers ──────────────────────────────────────────────────
//
// One row per shadow tier with the same eyebrow/title/body content,
// so the eye reads the *shadow* axis cleanly across the three.

type ShadowRow = {
  shadow: PanelShadow
  spec: string
  role: string
}

const shadowRows: ShadowRow[] = [
  {
    shadow: 'resting',
    spec: '1px tint-1 · 8px tint-3 · 16px tint-2',
    role: 'Default. Resting cards — inspector panels, dashboard tiles, lab surfaces. The 1+8+16 stack reads as flat-but-grounded.',
  },
  {
    shadow: 'lifted',
    spec: '2px tint-2 · 24px -16px tint-3',
    role: 'Popovers, menus, modals — anything floating on top of the page. Deeper, longer-throw shadow that sells the lift.',
  },
  {
    shadow: 'hairline',
    spec: 'none · border only',
    role: 'Nested panels inside another panel. Drop the shadow so the inner surface doesn’t double-shadow against the parent.',
  },
]

const shadowRowCx =
  'grid grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start py-4 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-2 max-[880px]:py-3'

export const PanelShadowSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {shadowRows.map((r) => (
      <div key={r.shadow} className={shadowRowCx}>
        <div>
          <span className={nameCx}>shadow · {r.shadow}</span>
          <span className={subCx}>{r.spec}</span>
        </div>
        <div className="min-w-0">
          <Panel
            shadow={r.shadow}
            eyebrow="inspector · pipeline"
            title="classify-prod"
          >
            3 inputs · 1 output · last run 4m ago
          </Panel>
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)
