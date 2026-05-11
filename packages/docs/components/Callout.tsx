import type { ReactNode } from 'react'

interface CalloutProps {
  variant?: 'info' | 'warn'
  /** Optional explicit title above the body. The body's leading
   *  `<strong>` is automatically styled as a title too — for GFM
   *  alerts, just lead with a `**bolded sentence.**` in the body. */
  title?: ReactNode
  children: ReactNode
}

/** Icon palette mirrors the dreamlake design: blue circle-i for info,
 *  orange warning triangle for warn. */
function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ width: 18, height: 18, display: 'block', marginTop: 2 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ width: 18, height: 18, display: 'block', marginTop: 2 }}
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

export function Callout({ variant = 'info', title, children }: CalloutProps) {
  const isWarn = variant === 'warn'
  return (
    <div
      // Tokens match docs.html `.callout` / `.callout.is-warn`:
      // grid 18px+1fr, 12px gap, 12/14 padding, 10px radius, faint border,
      // tinted bg (accent 5% for info, oklch warm 10% for warn).
      className="text-doc-template-ink"
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 1fr',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius-doc-template)',
        border: '1px solid var(--color-doc-template-faint)',
        background: isWarn
          ? 'color-mix(in oklab, oklch(75% .16 80) 10%, var(--color-doc-template-bg))'
          : 'color-mix(in srgb, var(--color-doc-template-accent) 5%, var(--color-doc-template-bg))',
        margin: '18px 0 22px',
      }}
    >
      <span
        style={{
          color: isWarn
            ? 'oklch(58% .16 60)'
            : 'var(--color-doc-template-accent)',
        }}
      >
        {isWarn ? <WarnIcon /> : <InfoIcon />}
      </span>
      <div
        style={{
          fontFamily: 'var(--font-doc-template-ui)',
          fontSize: 13.5,
          lineHeight: 1.55,
          color: 'var(--color-doc-template-ink)',
        }}
      >
        {title && (
          <div
            style={{
              display: 'block',
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: '-0.005em',
              marginBottom: 2,
            }}
          >
            {title}
          </div>
        )}
        {/* Tail = body. A leading `<strong>` is promoted to title styling
            via the descendant rule below so GFM alerts (`> [!NOTE]\n> **Heading.**
            body…`) render with a built-in heading. */}
        <div className="doc-callout-body">{children}</div>
      </div>
    </div>
  )
}
