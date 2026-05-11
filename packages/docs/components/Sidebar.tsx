import { usePageContext } from 'vike-react/usePageContext'
import { groupedPages } from '../lib/navigation'

/**
 * Left sidebar — auto-discovered nav grouped by `section` frontmatter.
 * All styling is utility-class + inline; no global CSS dependency.
 */
export function Sidebar() {
  const { urlPathname } = usePageContext() as { urlPathname: string }
  return (
    <aside
      aria-label="Sections"
      className="hidden md:flex sticky overflow-y-auto flex-col"
      style={{
        top: 40,
        height: 'calc(100vh - 40px)',
        padding: '22px 12px 32px 18px',
        gap: 2,
      }}
    >
      {groupedPages.map(group => (
        <div key={group.label || '_'} className="flex flex-col" style={{ gap: 1, marginBottom: 14 }}>
          {group.label && (
            <div
              className="flex items-center gap-1.5 uppercase text-doc-template-muted"
              style={{
                padding: '6px 10px 4px',
                fontFamily: 'var(--font-doc-template-mono)',
                fontSize: 9,
                fontWeight: 600,
                opacity: 0.7,
                letterSpacing: '0.14em',
              }}
            >
              <span>{group.label}</span>
              <span style={{ marginLeft: 'auto', opacity: 0.85 }}>
                {String(group.items.length).padStart(2, '0')}
              </span>
            </div>
          )}
          {group.items.map(item => {
            const active = item.path === urlPathname
            return (
              <a
                key={item.path}
                href={item.path}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'flex items-center gap-2 no-underline text-doc-template-ink bg-doc-template-selected rounded-doc-template'
                    : 'flex items-center gap-2 no-underline text-doc-template-ink rounded-doc-template hover:bg-[color-mix(in_srgb,var(--color-doc-template-ink)_5%,transparent)]'
                }
                style={{
                  padding: '5px 10px',
                  fontFamily: 'var(--font-doc-template-ui)',
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.005em',
                  lineHeight: 1.25,
                  transition: 'background 0.12s ease, color 0.12s ease',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>{item.title}</span>
                {item.draft && (
                  <span
                    aria-label="Draft — awaiting review"
                    title="Draft — awaiting review"
                    style={{
                      fontFamily: 'var(--font-doc-template-mono)',
                      fontSize: 8.5,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      padding: '1px 5px',
                      borderRadius: 3,
                      color: 'var(--color-doc-template-warn)',
                      background: 'var(--color-doc-template-warn-soft)',
                      border: '1px solid color-mix(in srgb, var(--color-doc-template-warn) 30%, transparent)',
                      flexShrink: 0,
                    }}
                  >
                    DRAFT
                  </span>
                )}
              </a>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
