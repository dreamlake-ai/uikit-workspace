import { usePageContext } from 'vike-react/usePageContext'
import { getAdjacentPages } from '../lib/navigation'

const LINK: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '12px 14px',
  border: '1px solid var(--color-doc-template-faint)',
  borderRadius: 'var(--radius-doc-template)',
  textDecoration: 'none',
  background: 'var(--color-doc-template-panel)',
  transition: 'border-color 0.15s ease',
}

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-doc-template-mono)',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-doc-template-muted)',
}

export function DocFooter() {
  const { urlPathname } = usePageContext() as { urlPathname: string }
  const { prev, next } = getAdjacentPages(urlPathname)
  if (!prev && !next) return null
  return (
    <nav
      aria-label="Page navigation"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginTop: 64,
        paddingTop: 24,
        borderTop: '1px solid var(--color-doc-template-faint)',
      }}
    >
      {prev ? (
        <a href={prev.path} style={LINK} className="hover:[border-color:var(--color-doc-template-accent)]">
          <span style={LABEL}>← Prev</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{prev.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a
          href={next.path}
          style={{ ...LINK, textAlign: 'right' }}
          className="hover:[border-color:var(--color-doc-template-accent)]"
        >
          <span style={LABEL}>Next →</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{next.title}</span>
        </a>
      ) : (
        <span />
      )}
    </nav>
  )
}
