import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * `true` when the viewport is narrower than 768px. SSR-safe (returns `false`
 * until mounted). Ported verbatim from the legacy `@vuer-ai/vuer-uikit`.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
