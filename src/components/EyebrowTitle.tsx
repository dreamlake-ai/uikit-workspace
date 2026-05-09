// EyebrowTitle — the page-head & section-head pattern. A short mono
// caps eyebrow stacked above a UI title, with three structural sizes
// that match the §03 Typography source in
// `staging/dreamlake-design-guide.html`:
//
//   level="h1"  Inter Tight 600 · 22 / 27 · -0.012em   — view headers
//   level="h2"  Inter Tight 600 · 16 / 22              — subsection
//   level="h3"  Inter Tight 600 · 13 / 18              — panel inner
//
// The eyebrow is rendered as a `<div>` (NOT a heading): it's a
// small-caps label, not structural — keeping it out of the heading
// outline lets screen readers and the docs site's rehype-slug treat
// the `<h1>` / `<h2>` / `<h3>` underneath as the real anchor.
//
// Eyebrow paint: mono 9.5px / 600 / +0.12em / UPPER / muted /
// opacity 70 / mb 1.5 — lifted from `#lab-eyebrow` in the design
// guide and the shared `.ts-eye` rule.
//
// API (kept minimal so this can graduate to `@dreamlake/uikit` cleanly):
//   <EyebrowTitle eyebrow="Sources · live now" title="Recent runs across this branch" />
//   <EyebrowTitle level="h2" title="Schedule and triggers" />

import type { ReactNode } from 'react'

export type EyebrowTitleLevel = 'h1' | 'h2' | 'h3'

export type EyebrowTitleProps = {
  eyebrow?: string
  title: ReactNode
  /** Heading level for the title — also picks the size token. Defaults to `h2`. */
  level?: EyebrowTitleLevel
  className?: string
}

// Mono 9.5px / 600 / +0.12em / UPPER / muted / opacity 70 / mb 1.5
// — exactly the `.ts-eye` rule from the staging guide, plus the
// inline `margin-bottom:4px` the `#lab-eyebrow` preview adds.
const eyebrowCx =
  'font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase ' +
  'text-muted opacity-70 mb-1.5'

// Title sizes — each one matches the `.ts-h1` / `.ts-h2` / `.ts-h3`
// rule in the design guide §03 source. Margins are zeroed so the
// component sits cleanly inside MDX prose without fighting the
// surrounding heading rhythm.
const titleCxByLevel: Record<EyebrowTitleLevel, string> = {
  h1: 'font-ui font-semibold text-[22px] leading-[27px] tracking-[-0.012em] text-ink m-0',
  h2: 'font-ui font-semibold text-[16px] leading-[22px] text-ink m-0',
  h3: 'font-ui font-semibold text-[13px] leading-[18px] text-ink m-0',
}

export const EyebrowTitle = ({
  eyebrow,
  title,
  level = 'h2',
  className,
}: EyebrowTitleProps) => {
  const Heading = level
  return (
    <div className={className}>
      {eyebrow && <div className={eyebrowCx}>{eyebrow}</div>}
      <Heading className={titleCxByLevel[level]}>{title}</Heading>
    </div>
  )
}
