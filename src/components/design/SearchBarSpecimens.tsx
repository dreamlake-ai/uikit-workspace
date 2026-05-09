// Live specimens for `<SearchBar />` — three galleries that mirror the
// knobs from staging/dreamlake-design-guide.html (`#lab-search`):
//
//   1. Anatomy   — labeled parts (leading icon · input · trailing hint)
//   2. States    — rest, focus, with-query side-by-side
//   3. With hint — composing the trailing slot with `<Kbd>⌘ K</Kbd>`
//
// Layout chrome mirrors ChipSpecimen / DropdownSpecimens — same row
// grid, same eyebrow + sub label typographic stack, same panel surface.

import { SearchBar, type SearchBarState } from '../SearchBar'
import { Kbd } from '../Kbd'

// ── Shared chrome ────────────────────────────────────────────────

const rowCx =
  'grid grid-cols-[160px_minmax(0,1fr)_220px] gap-4 items-center py-3.5 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-2 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'
const subCx =
  'block font-ui text-[11px] font-normal text-muted tracking-[-0.005em] mt-0.5 normal-case opacity-80'
const roleCx =
  'font-ui text-[12px] leading-[1.5] text-muted [text-wrap:pretty]'

// ── Anatomy ──────────────────────────────────────────────────────
//
// One reference instance with each part annotated below it. The bar
// itself is in its rest state with a hint chip so all three slots are
// visible at once.

const partGridCx =
  'grid grid-cols-3 gap-3 mt-3 max-[880px]:grid-cols-1 max-[880px]:gap-1.5'
const partLabelCx =
  'font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-muted opacity-85'
const partRoleCx = 'font-ui text-[11.5px] leading-[1.5] text-muted [text-wrap:pretty]'

export const SearchBarAnatomySpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-4">
    <div className="max-w-[420px]">
      <SearchBar placeholder="filter runs…" hint={<Kbd>⌘ K</Kbd>} />
    </div>
    <div className={partGridCx}>
      <div>
        <div className={partLabelCx}>leading icon</div>
        <div className={partRoleCx}>
          13×13 magnifier · stroke <code>--color-muted</code>. Pass a custom
          node via <code>leadingIcon</code>, or <code>null</code> to omit.
        </div>
      </div>
      <div>
        <div className={partLabelCx}>input</div>
        <div className={partRoleCx}>
          Mono 11.5px ink · transparent · placeholder muted at 65% opacity ·
          no border / outline (the wrapper paints the focus ring).
        </div>
      </div>
      <div>
        <div className={partLabelCx}>trailing hint</div>
        <div className={partRoleCx}>
          Optional <code>hint</code> slot — typically a{' '}
          <code>{'<Kbd>⌘ K</Kbd>'}</code>. Pushes to the far right.
        </div>
      </div>
    </div>
  </div>
)

// ── States ───────────────────────────────────────────────────────
//
// Three rows: rest (empty placeholder), focus (forced ring + a typed
// query so the caret would normally blink), and "with-query" (rest
// state, populated value — the consumer-typed-and-tabbed-away look).

type StateRow = {
  key: string
  label: string
  bucket: string
  state?: SearchBarState
  value?: string
  placeholder: string
  role: string
}

const stateRows: StateRow[] = [
  {
    key: 'rest',
    label: 'rest',
    bucket: 'empty · no focus · ⌘K hint visible',
    placeholder: 'filter runs…',
    role: '`--search-bg` fill, transparent border, muted 13×13 magnifier, mono placeholder at 65%.',
  },
  {
    key: 'focus',
    label: 'focus',
    bucket: 'accent ring · 2px outline · 50% alpha',
    state: 'focus',
    value: 'classify',
    placeholder: 'filter runs…',
    role: 'Accent outline at `color-mix(in srgb, var(--color-accent) 50%, transparent)`, offset 0 — stamped via `state="focus"` for the specimen; native `:focus-within` paints it in real use.',
  },
  {
    key: 'with-query',
    label: 'with query',
    bucket: 'populated · no focus · hint hidden',
    value: 'pipeline:classify',
    placeholder: 'filter runs…',
    role: 'When a value is present we omit the trailing hint chip — the user has already engaged the bar; the affordance has done its job.',
  },
]

export const SearchBarStatesSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {stateRows.map((r) => (
      <div key={r.key} className={rowCx}>
        <div>
          <span className={nameCx}>state · {r.label}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex items-center">
          <div className="w-full max-w-[320px]">
            <SearchBar
              state={r.state}
              defaultValue={r.value}
              placeholder={r.placeholder}
              hint={r.value ? undefined : <Kbd>⌘ K</Kbd>}
              readOnly
            />
          </div>
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)

// ── With a hint chip ─────────────────────────────────────────────
//
// The trailing `hint` slot accepts any node — we showcase three useful
// shapes: the canonical `<Kbd>⌘ K</Kbd>`, the slash-key alternative,
// and a free-form mono badge.

type HintRow = {
  key: string
  bucket: string
  hint: React.ReactNode
  placeholder: string
  role: string
}

const hintRows: HintRow[] = [
  {
    key: 'cmd-k',
    bucket: 'canonical · ⌘ K',
    hint: <Kbd>⌘ K</Kbd>,
    placeholder: 'search docs…',
    role: 'The default for cross-app search bars. Pairs with a global ⌘K listener that focuses the input.',
  },
  {
    key: 'slash',
    bucket: 'list-scoped · /',
    hint: <Kbd>/</Kbd>,
    placeholder: 'filter rows…',
    role: 'Single-key shortcut for inline list filters. Used when the bar lives inside a panel rather than the top chrome.',
  },
  {
    key: 'esc',
    bucket: 'modal · esc to clear',
    hint: <Kbd>esc</Kbd>,
    placeholder: 'filter runs…',
    role: 'Reads as a dismissal hint when the bar is part of a transient surface (palette, command pop, sheet).',
  },
]

export const SearchBarHintSpecimen = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {hintRows.map((r) => (
      <div key={r.key} className={rowCx}>
        <div>
          <span className={nameCx}>hint · {r.key}</span>
          <span className={subCx}>{r.bucket}</span>
        </div>
        <div className="min-w-0 flex items-center">
          <div className="w-full max-w-[320px]">
            <SearchBar placeholder={r.placeholder} hint={r.hint} readOnly />
          </div>
        </div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)
