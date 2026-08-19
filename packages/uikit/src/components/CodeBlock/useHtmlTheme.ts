import { useEffect, useState } from 'react'

export type ResolvedTheme = 'light' | 'dark'

/** Read the current theme off `<html>`, falling back to the OS preference. */
function readTheme(): ResolvedTheme {
  if (typeof document === 'undefined') return 'light'
  const attr = document.documentElement.getAttribute('data-theme')
  // `liquid-dark` / `liquid-light` are ThemeProvider's glass variants — the
  // only bit CodeMirror cares about is which end of the palette we're on.
  if (attr) return attr.includes('dark') ? 'dark' : 'light'
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Resolve light/dark by watching `<html data-theme>` rather than uikit's
 * ThemeProvider.
 *
 * `useTheme()` throws when there's no provider above it, and CodeBlock has to
 * work in apps that never mounted one — so we read the same attribute the
 * token cascade in styles.css keys off, and mirror its `prefers-color-scheme`
 * fallback for consumers who haven't pinned a theme at all.
 *
 * The first render always reports `light` so server and client markup agree;
 * the effect corrects it before paint.
 */
export function useHtmlTheme(override?: ResolvedTheme): ResolvedTheme {
  const [theme, setTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    if (override) return
    setTheme(readTheme())

    const observer = new MutationObserver(() => setTheme(readTheme()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onMediaChange = () => setTheme(readTheme())
    media?.addEventListener('change', onMediaChange)

    return () => {
      observer.disconnect()
      media?.removeEventListener('change', onMediaChange)
    }
  }, [override])

  return override ?? theme
}
