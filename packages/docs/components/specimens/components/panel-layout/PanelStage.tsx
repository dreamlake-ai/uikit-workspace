import { useEffect, useState, type ReactNode } from 'react'

/**
 * The bounded, client-only box every panel demo on this page sits in.
 *
 * Two things it takes care of:
 *
 *  1. HEIGHT. `PanelLayout` fills its container (`h-full`), so it needs an
 *     ancestor with a real height or it collapses to nothing.
 *
 *  2. CLIENT-ONLY. The layout mints node ids from module-level counters, so a
 *     tree built during prerender and again on the client would not agree.
 *     This site is prerendered, so the demos mount after hydration.
 */
export function PanelStage({ children, height = 420 }: { children: ReactNode; height?: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <div
      className="relative rounded-[var(--radius)] border border-uikit-faint overflow-hidden bg-uikit-bg"
      style={{ height }}
    >
      {mounted ? (
        children
      ) : (
        <div className="h-full flex items-center justify-center font-uikit-mono text-uikit-11 text-uikit-muted">
          loading…
        </div>
      )}
    </div>
  )
}
