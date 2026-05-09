// Do · don't reference cards. Two cards, one red ("don't") and one
// green ("do"). Headers tint with the canonical semantic-palette
// hexes (#c8513b error, #1f8f4a ok) — premixed against --bg via
// color-mix and shipped inline. We do NOT introduce --error / --ok
// tokens; that's literally one of the don'ts on this page.

import type { ReactNode } from 'react'

type Item = ReactNode

const donts: Item[] = [
  <>Add a 7th hue to the semantic palette.</>,
  <>Promote semantic colors (<code>--ok</code>, <code>--error</code>) into <code>tokens.css</code>.</>,
  <>Use <code>:nth-child(odd)</code> for zebra parity in selectable lists.</>,
  <>Add an inset border on hover.</>,
  <>Lift the panel above <code>--bg</code> in dark mode.</>,
  <>Use a third font family or introduce a serif.</>,
  <>Animate <code>box-shadow</code> on row hover.</>,
  <>Use <code>rgba()</code> for state backgrounds.</>,
]

const dos: Item[] = [
  <>Map new domain concepts to existing buckets by <em>function</em>.</>,
  <>Distinguish two same-bucket concepts with glyph + label.</>,
  <>Premix state backgrounds against <code>--bg</code> and ship the resulting hex.</>,
  <>Step row radius from 7px → 10px when selected.</>,
  <>Match the row gap (2px) on selection-run wrappers.</>,
  <>Layer multi-row ring as <code>::after</code>, not inset shadow.</>,
  <>Force <code>#fff</code> on every span inside bright-blue selected rows.</>,
  <>Read <code>--rail-bg</code>; never inline-override per page.</>,
]

const cardCx = 'bg-panel border border-faint rounded-md overflow-hidden flex flex-col'

const headBaseCx =
  'font-mono uppercase tracking-[0.12em] text-[10px] font-semibold py-2 px-3'

const listCx = 'm-0 px-3.5 py-3 flex flex-col gap-1.5 list-none'

const itemCx =
  'grid grid-cols-[14px_1fr] items-baseline gap-2 font-ui text-[13.5px] leading-[1.55] text-ink [&_code]:font-mono [&_code]:text-[12px] [&_code]:bg-chip [&_code]:px-1 [&_code]:py-px [&_code]:rounded-[3px] [&_em]:italic [&_em]:text-ink/90'

const glyphCx = 'font-mono text-[11px] font-semibold tabular-nums leading-none'

export const DoDontCards = () => (
  <div className="grid grid-cols-2 gap-2.5 my-6 max-[700px]:grid-cols-1">
    <div className={cardCx}>
      <div
        className={headBaseCx}
        style={{
          background: 'color-mix(in srgb, #c8513b 8%, var(--color-bg))',
          color: '#c8513b',
        }}
      >
        don't
      </div>
      <ul className={listCx}>
        {donts.map((item, i) => (
          <li key={i} className={itemCx}>
            <span className={glyphCx} style={{ color: '#c8513b' }} aria-hidden="true">
              ✕
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className={cardCx}>
      <div
        className={headBaseCx}
        style={{
          background: 'color-mix(in srgb, #1f8f4a 8%, var(--color-bg))',
          color: '#1f8f4a',
        }}
      >
        do
      </div>
      <ul className={listCx}>
        {dos.map((item, i) => (
          <li key={i} className={itemCx}>
            <span className={glyphCx} style={{ color: '#1f8f4a' }} aria-hidden="true">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
)
