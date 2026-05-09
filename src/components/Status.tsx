// Status — atomic status indicator. A bucket-coloured dot or bar
// followed by a mono label and an optional secondary clause.
//
// Ports `#lab-status` from staging/dreamlake-design-guide.html. The
// six buckets map onto the cross-page semantic palette in
// staging/design.md; the hexes stay inline (per the "tokens.css is for
// surface chrome only" rule — there is no `--ok` / `--error` token).
//
// API (kept minimal so this can graduate to `@dreamlake/uikit` cleanly):
//   <Status bucket="ok" label="ingest" />
//   <Status bucket="active" label="running" secondary="12s" style="dot-pulse" />
//   <Status bucket="error" label="error" secondary="exit 137" style="bar" />
//
// Style variants:
//   dot       — 8px circle in bucket hue (default)
//   dot-pulse — 8px circle in bucket hue + soft pulse halo
//   bar       — 12×3 rounded rectangle in bucket hue

export type StatusBucket = 'active' | 'ok' | 'model' | 'stale' | 'error' | 'idle'
export type StatusStyle = 'dot' | 'dot-pulse' | 'bar'

export type StatusProps = {
  bucket: StatusBucket
  label: string
  secondary?: string
  style?: StatusStyle
}

// Cross-page semantic palette — see staging/design.md §"Semantic
// palette". These six hexes never become CSS variables; they live
// inline at every use site so `grep '#23aaff'` etc. tells the truth
// about which buckets a page touches.
const BUCKET_HEX: Record<StatusBucket, string> = {
  active: '#23aaff',
  ok: '#1f8f4a',
  model: '#7c5bd9',
  stale: '#c0922e',
  error: '#c8513b',
  idle: '#9c907a',
}

// `.status-line` from the source: mono 11px / `--ink`, 7px gap.
const lineCx =
  'inline-flex items-center gap-[7px] font-mono text-[11px] leading-none text-ink align-middle'

// `.status-dot` (8 × 8 circle).
const dotCx = 'inline-block w-2 h-2 rounded-full'

// `.status-dot.pulse` — soft halo. The source CSS keyframe pulses
// `box-shadow` from a 60%-alpha currentColor ring out to fully
// transparent at 8px. We replicate the keyframe inline (Tailwind's
// `animate-pulse` is the wrong shape — it pulses opacity).
const dotPulseCx = `${dotCx} dl-status-pulse`

// `.status-bar` — task spec: 12×3, 1.5px radius. (The source HTML
// shipped 22×4/2px; the spec for the docs atom calls for the smaller
// 12×3 size, which reads better inline at mono-11.)
const barCx = 'inline-block w-3 h-[3px] rounded-[1.5px]'

// Secondary clause renders muted, with a `·` separator. Mono 9.5px
// per the task spec.
const secondaryCx = 'font-mono text-[9.5px] text-muted'

// Inject the keyframes once. Done as a side-effect-free inline
// <style> so the component is self-contained — no theme.css dep.
// The keyframe matches the source's `dl-pulse`: a 1.6s ease-out halo
// that fades from 60%-alpha currentColor at 0px out to transparent at 8px.
const PulseKeyframes = () => (
  <style>{`
    @keyframes dl-status-pulse {
      0%   { box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 60%, transparent); }
      70%  { box-shadow: 0 0 0 8px color-mix(in srgb, currentColor 0%, transparent); }
      100% { box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 0%, transparent); }
    }
    .dl-status-pulse { animation: dl-status-pulse 1.6s ease-out infinite; }
  `}</style>
)

export const Status = ({ bucket, label, secondary, style = 'dot' }: StatusProps) => {
  const hue = BUCKET_HEX[bucket]
  const glyph =
    style === 'bar' ? (
      <span aria-hidden="true" className={barCx} style={{ background: hue }} />
    ) : (
      <span
        aria-hidden="true"
        className={style === 'dot-pulse' ? dotPulseCx : dotCx}
        // `color` carries currentColor for the pulse halo's color-mix;
        // `background` paints the dot itself.
        style={{ background: hue, color: hue }}
      />
    )

  return (
    <span className={lineCx}>
      {style === 'dot-pulse' && <PulseKeyframes />}
      {glyph}
      <span>{label}</span>
      {secondary && (
        <span className={secondaryCx}>
          <span aria-hidden="true">· </span>
          {secondary}
        </span>
      )}
    </span>
  )
}
