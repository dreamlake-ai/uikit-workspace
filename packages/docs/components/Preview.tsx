import { useEffect, useState, type ReactNode } from 'react'
import { useLineNumbers } from '../lib/use-line-numbers'

export interface PreviewProps {
  /** Live-rendered example. Pass a component or JSX. */
  children: ReactNode
  /** Source code for the example (use `import src from './x.tsx?raw'`). */
  source: string
  /** Optional matching dataIO source — surfaces a `Data` tab. */
  dataSource?: string
  /** Filename shown in the tab header. */
  filename?: string
  /** Default tab. */
  defaultTab?: 'preview' | 'source' | 'data'
  /** Force a height for the preview pane. */
  height?: number | string
}

type Tab = 'preview' | 'source' | 'data'

/** Map a filename extension to a Shiki language id. Anything we don't
 *  recognize falls back to `tsx` (the common case for this template). */
function langFromFilename(name?: string): string {
  if (!name) return 'tsx'
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'json':
    case 'css':
    case 'html':
    case 'md':
    case 'mdx':
    case 'bash':
    case 'sh':
      return ext
    default:
      return 'tsx'
  }
}

/** Lazy-loaded Shiki block. Pulls `shiki` in via dynamic import so the
 *  Source/Data tab — and only that tab — drags the highlighter bundle.
 *  Falls back to plain `<pre>` until the highlighter resolves. */
function HighlightedSource({ code, filename }: { code: string; filename?: string }) {
  const [html, setHtml] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    setHtml(null)
    ;(async () => {
      try {
        const { codeToHtml } = await import('shiki')
        const out = await codeToHtml(code, {
          lang: langFromFilename(filename),
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        })
        if (alive) setHtml(out)
      } catch {
        if (alive) setHtml(null)
      }
    })()
    return () => {
      alive = false
    }
  }, [code, filename])

  if (html) return <div dangerouslySetInnerHTML={{ __html: html }} />
  return (
    <pre
      style={{
        margin: 0,
        padding: '14px 16px',
        fontFamily: 'var(--font-doc-template-mono)',
        fontSize: 12.5,
        lineHeight: 1.62,
        overflowX: 'auto',
        background: 'transparent',
      }}
    >
      <code>{code}</code>
    </pre>
  )
}

const TAB: React.CSSProperties = {
  fontFamily: 'var(--font-doc-template-mono)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: '1px solid transparent',
  borderRadius: 4,
  padding: '3px 8px',
  height: 22,
  background: 'transparent',
  cursor: 'pointer',
  transition: 'color 0.12s ease, background 0.12s ease, border-color 0.12s ease',
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

export function Preview({
  children,
  source,
  dataSource,
  filename,
  defaultTab = 'preview',
  height,
}: PreviewProps) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [copied, setCopied] = useState(false)
  // Site-wide toggle — flipping here flips line numbers everywhere.
  const [showLines, setShowLines] = useLineNumbers()
  const visibleSource = tab === 'data' ? (dataSource ?? '') : source

  function copy() {
    navigator.clipboard.writeText(visibleSource).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      },
      () => {},
    )
  }

  return (
    <div
      data-line-numbers={showLines ? 'on' : 'off'}
      className="border border-doc-template-faint bg-doc-template-panel"
      style={{ margin: '18px 0 22px', borderRadius: 'var(--radius-doc-template)', overflow: 'hidden' }}
    >
      <div
        className="flex items-center border-b border-doc-template-faint"
        style={{
          gap: 10,
          padding: '6px 10px 6px 6px',
          background: 'color-mix(in srgb, var(--color-doc-template-ink) 3%, transparent)',
        }}
      >
        <div style={{ display: 'inline-flex', gap: 2 }} role="tablist">
          {(['preview', 'source', ...(dataSource ? (['data'] as const) : [])] as Tab[]).map(t => {
            const active = t === tab
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                style={{
                  ...TAB,
                  color: active ? 'var(--color-doc-template-ink)' : 'var(--color-doc-template-muted)',
                  background: active ? 'var(--color-doc-template-bg)' : 'transparent',
                  borderColor: active ? 'var(--color-doc-template-faint)' : 'transparent',
                }}
              >
                {t === 'preview' ? 'Preview' : t === 'source' ? 'Source' : 'Data'}
              </button>
            )
          })}
        </div>
        {filename && tab !== 'preview' && (
          <span
            className="text-doc-template-muted"
            style={{ fontFamily: 'var(--font-doc-template-mono)', fontSize: 10, marginLeft: 4 }}
          >
            {filename}
          </span>
        )}
        {tab !== 'preview' && (
          <>
            <span style={{ marginLeft: 'auto' }} />
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
            <button
              type="button"
              onClick={copy}
              aria-label="Copy source"
              style={headerBtnStyle(copied)}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </>
        )}
      </div>
      {tab === 'preview' ? (
        <div style={{ padding: 24, minHeight: 80, ...(height ? { height } : null) }}>{children}</div>
      ) : (
        <div style={{ background: 'var(--color-doc-template-code)' }}>
          <HighlightedSource code={visibleSource} filename={filename} />
        </div>
      )}
    </div>
  )
}
