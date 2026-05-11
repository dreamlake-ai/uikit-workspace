import { useRef, useState, type ReactNode } from 'react'
import { useLineNumbers } from '../lib/use-line-numbers'

interface CodeBlockProps {
  children: ReactNode
  filename?: string
  lang?: string
}

const headerBtnStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-doc-template-mono)',
  fontSize: 10,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: active ? 'var(--color-doc-template-accent)' : 'var(--color-doc-template-muted)',
  background: 'transparent',
  border: `1px solid ${active ? 'var(--color-doc-template-accent)' : 'var(--color-doc-template-faint)'}`,
  borderRadius: 4,
  padding: '2px 8px',
  height: 22,
  cursor: 'pointer',
  transition: 'color 0.12s ease, border-color 0.12s ease',
})

/**
 * Wraps a Shiki-rendered <pre><code> with the dreamlake header bar
 * (lang label + filename + line-number toggle + Copy). Children come
 * straight from MDX.
 */
export function CodeBlock({ children, filename, lang }: CodeBlockProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState(false)
  // Site-wide toggle — flipping line numbers in one block flips them all.
  const [showLines, setShowLines] = useLineNumbers()

  function copy() {
    const el = wrapRef.current?.querySelector<HTMLElement>('pre code')
    if (!el) return
    navigator.clipboard.writeText(el.innerText).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      },
      () => {},
    )
  }

  return (
    <div
      ref={wrapRef}
      data-line-numbers={showLines ? 'on' : 'off'}
      className="group border border-doc-template-faint bg-doc-template-code"
      style={{
        margin: '18px 0 22px',
        borderRadius: 'var(--radius-doc-template)',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center border-b border-doc-template-faint text-doc-template-muted uppercase"
        style={{
          gap: 12,
          padding: '6px 10px 6px 14px',
          fontFamily: 'var(--font-doc-template-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          background: 'color-mix(in srgb, var(--color-doc-template-ink) 3%, transparent)',
        }}
      >
        {lang && <span style={{ fontWeight: 600 }}>{lang}</span>}
        {filename && (
          <span className="text-doc-template-muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
            {filename}
          </span>
        )}
        <span style={{ flex: 1 }} />
        {/* Buttons stay hidden until the user hovers the codeblock (or
            tabs into them) — reduces visual noise in long pages while
            keeping the controls discoverable on intent. */}
        <span
          className="inline-flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
          style={{ gap: 12 }}
        >
          <button
            type="button"
            aria-pressed={showLines}
            aria-label={showLines ? 'Hide line numbers' : 'Show line numbers'}
            title={showLines ? ':set nonu' : ':set nu'}
            onClick={() => setShowLines(!showLines)}
            style={headerBtnStyle(showLines)}
          >
            <HashIcon />
            <span>{showLines ? ':set nonu' : ':set nu'}</span>
          </button>
          <button type="button" onClick={copy} style={headerBtnStyle(copied)}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-doc-template-mono)',
          fontSize: 12.5,
          lineHeight: 1.62,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function HashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ width: 10, height: 10, display: 'block' }}
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}
