import { useEffect } from 'react'

// Toggles body.is-merged once the H1 scrolls past the topbar. CSS keys off
// this class to fade the topbar's brand wordmark out and the breadcrumb in.
export function useMergedHeader() {
  useEffect(() => {
    const h1 = document.querySelector('.doc-content h1')
    if (!h1) return
    const TOPBAR_H = 40
    let raf = false
    const check = () => {
      raf = false
      const bottom = h1.getBoundingClientRect().bottom
      const merged = bottom < TOPBAR_H + 8
      document.body.classList.toggle('is-merged', merged)
    }
    const onScroll = () => {
      if (raf) return
      raf = true
      requestAnimationFrame(check)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    check()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.body.classList.remove('is-merged')
    }
  }, [])
}
