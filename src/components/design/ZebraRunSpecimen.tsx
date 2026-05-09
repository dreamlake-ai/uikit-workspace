// Multi-row run specimen. Six rows; rows 2–4 are selected and
// consecutive, so they merge into one rounded "tile" — the
// SelectionRunBox pattern from staging/zebra-list-style-guide.md §7.
//
// Implementation: a single flex column with gap:2px (matching the
// outer list gap — §2). Border-radius collapses on adjoining edges
// so the run reads as one continuous selection: the first selected
// row keeps top-left/top-right rounded, the last keeps bottom-left/
// bottom-right rounded, and rows in the middle of the run are flat
// on every corner. Computed from `selected` parity in JS rather than
// :nth-of-type / adjacent-sibling selectors so any reorder /
// virtualisation keeps the same shape.

type Row = {
  id: string
  label: string
  meta: string
  selected?: boolean
}

const rows: Row[] = [
  { id: 'e_4422', label: 'column.add · price_usd',     meta: '14:01' },
  { id: 'e_4421', label: 'column.modify · region',     meta: '13:58', selected: true },
  { id: 'e_4420', label: 'column.remove · legacy_id',  meta: '13:58', selected: true },
  { id: 'e_4419', label: 'column.add · region_norm',   meta: '13:57', selected: true },
  { id: 'e_4418', label: 'column.tag · pii',           meta: '13:50' },
  { id: 'e_4417', label: 'column.add · session_id',    meta: '13:42' },
]

// Per-row corner-radius rule:
//   non-selected         → 7px on every corner (resting radius)
//   selected, isolated   → 10px on every corner (single-row tile, §4)
//   selected, run-start  → 10px top corners, 0 bottom corners
//   selected, run-end    → 0 top corners, 10px bottom corners
//   selected, run-middle → 0 on every corner (flush with neighbours)
//
// Adjoining selected edges go to 0 so the 2px gap between them
// closes visually into one tile. The non-adjoining edges keep 10px
// so the whole run reads as one rounded shape.
function radiusFor(rows: Row[], i: number): string {
  const r = rows[i]
  if (!r.selected) return 'rounded-[7px]'
  const prevSel = rows[i - 1]?.selected
  const nextSel = rows[i + 1]?.selected
  if (!prevSel && !nextSel) return 'rounded-[10px]'
  if (!prevSel && nextSel)  return 'rounded-t-[10px] rounded-b-none'
  if (prevSel && !nextSel)  return 'rounded-b-[10px] rounded-t-none'
  return 'rounded-none'
}

const baseRowCx =
  'grid grid-cols-[80px_minmax(0,1fr)_72px] items-center gap-3 ' +
  'px-3 h-7 font-mono text-[12px] leading-none'

export const ZebraRunSpecimen = () => (
  <div
    className="flex flex-col gap-[2px] p-3 my-6 border border-faint rounded-md bg-panel"
    role="img"
    aria-label="Six-row list with rows 2 to 4 selected as a contiguous run"
  >
    {rows.map((r, i) => {
      const fillCx = r.selected
        ? 'bg-row-selected text-row-selected-fg'
        : 'bg-row-base text-ink'
      return (
        <div
          key={r.id}
          aria-selected={r.selected ? true : undefined}
          data-run-pos={
            r.selected
              ? rows[i - 1]?.selected
                ? rows[i + 1]?.selected
                  ? 'middle'
                  : 'end'
                : rows[i + 1]?.selected
                ? 'start'
                : 'single'
              : undefined
          }
          className={`${baseRowCx} ${fillCx} ${radiusFor(rows, i)}`}
        >
          <span className={r.selected ? '' : 'text-muted'}>{r.id}</span>
          <span className="truncate">{r.label}</span>
          <span
            className={`text-[11px] tracking-[0.04em] text-right ${
              r.selected ? '' : 'text-muted'
            }`}
          >
            {r.meta}
          </span>
        </div>
      )
    })}
  </div>
)
