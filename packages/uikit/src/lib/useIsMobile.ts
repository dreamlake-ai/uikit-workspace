import { useEffect, useState } from 'react'

/**
 * `true` when the viewport is narrower than `breakpoint` CSS pixels (768 by
 * default). SSR-safe: server and first client render both return `false`.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])

  return isMobile
}
