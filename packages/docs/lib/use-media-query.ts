import { useEffect, useState } from 'react'

/**
 * SSR-safe matchMedia hook. Starts `false` on the server so the initial
 * HTML matches the mobile-first CSS layer, then re-evaluates on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}
