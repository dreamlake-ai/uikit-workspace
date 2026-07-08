import { useLayoutEffect, useRef, useState } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { TABS, tabForUrl } from '../lib/tabs'

const SPRING = 'cubic-bezier(0.4, 0.7, 0.3, 1)'

/**
 * Compact tab cluster for the topbar. Tracked-uppercase mono labels with a
 * moving ink-coloured underbar that slides between the active (or hovered)
 * tab. Renders inline within the topbar — the topbar wrapper supplies the
 * sticky / blur / background.
 */
export function TabStrip() {
  const { urlPathname } = usePageContext() as { urlPathname: string }
  const activeTab = tabForUrl(urlPathname)

  const containerRef = useRef<HTMLOListElement | null>(null)
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const [hovered, setHovered] = useState<string | null>(null)
  const [bar, setBar] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  })

  const targetTab = hovered ?? activeTab

  useLayoutEffect(() => {
    const container = containerRef.current
    const target = linkRefs.current[targetTab]
    if (!container || !target) return
    const cR = container.getBoundingClientRect()
    const tR = target.getBoundingClientRect()
    setBar({ left: tR.left - cR.left, width: tR.width, ready: true })
  }, [targetTab, urlPathname])

  useLayoutEffect(() => {
    function onResize() {
      const container = containerRef.current
      const target = linkRefs.current[targetTab]
      if (!container || !target) return
      const cR = container.getBoundingClientRect()
      const tR = target.getBoundingClientRect()
      setBar(b => ({ ...b, left: tR.left - cR.left, width: tR.width }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [targetTab])

  return (
    <ol
      ref={containerRef}
      aria-label="Documentation sections"
      className="flex items-stretch relative m-0 p-0 list-none"
      style={{ height: '100%' }}
      onMouseLeave={() => setHovered(null)}
    >
      {TABS.map(tab => {
        const isActive = tab.id === activeTab
        return (
          <li
            key={tab.id}
            className="flex items-stretch"
            onMouseEnter={() => setHovered(tab.id)}
          >
            <a
              ref={(el) => { linkRefs.current[tab.id] = el }}
              href={tab.landing}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center no-underline px-1.5 md:px-2.5"
              style={{
                fontFamily: 'var(--font-doc-template-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isActive || hovered === tab.id
                  ? 'var(--color-doc-template-ink)'
                  : 'var(--color-doc-template-muted)',
                cursor: 'pointer',
                transition: 'color 0.18s ease',
              }}
            >
              {tab.label}
            </a>
          </li>
        )
      })}

      {/* Moving underbar — 90% of the tab's width, centered under it, sitting
          flush against the topbar's bottom hairline. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -13,
          left: 0,
          height: 3,
          background: 'var(--color-doc-template-ink)',
          transform: `translateX(${bar.left + bar.width * 0.05}px)`,
          width: bar.width * 0.9,
          transition: bar.ready
            ? `transform 0.32s ${SPRING}, width 0.32s ${SPRING}`
            : 'none',
          willChange: 'transform, width',
          pointerEvents: 'none',
        }}
      />
    </ol>
  )
}
