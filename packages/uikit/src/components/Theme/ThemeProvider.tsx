import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type BaseTheme = 'dark' | 'light' | 'system'
export type ComputedTheme = 'light' | 'dark' | 'liquid-light' | 'liquid-dark'

export interface UseThemeProps {
  baseTheme: BaseTheme
  setBaseTheme: (theme: BaseTheme) => void
  isLiquid: boolean
  toggleLiquid: () => void
  computedTheme: ComputedTheme
  resolvedTheme: ComputedTheme
  systemTheme?: 'dark' | 'light'
  storageKey: string
}

export interface ThemeProviderProps {
  defaultBaseTheme?: BaseTheme
  defaultIsLiquid?: boolean
  enableSystem?: boolean
  storageKey?: string
}

const MEDIA = '(prefers-color-scheme: dark)'
const isServer = typeof window === 'undefined'

export const defaultThemes = ['light', 'dark', 'liquid-light', 'liquid-dark']

const ThemeContext = createContext<UseThemeProps | undefined>(undefined)

export function useTheme(): UseThemeProps {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

/** Resolve (baseTheme, isLiquid, systemIsDark) → the concrete theme name. */
export function computeTheme(baseTheme: BaseTheme, isLiquid: boolean, systemIsDark: boolean): ComputedTheme {
  const resolvedBase = baseTheme === 'system' ? (systemIsDark ? 'dark' : 'light') : baseTheme
  if (isLiquid) return resolvedBase === 'dark' ? 'liquid-dark' : 'liquid-light'
  return resolvedBase
}

function read(key: string, fallback: string) {
  if (isServer) return fallback
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: string) {
  if (isServer) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

/**
 * Theme provider. Persists the base theme (light/dark/system) and an optional
 * "liquid" flag, resolves the active theme, and reflects it on
 * `html[data-theme]` (light/dark) — the attribute the kit's tokens key off.
 *
 * Drop-in for the legacy `@vuer-ai/vuer-uikit` ThemeProvider; the liquid state is
 * preserved through the API (the kit's tokens currently render light/dark).
 */
export function ThemeProvider({
  defaultBaseTheme,
  defaultIsLiquid = false,
  enableSystem = true,
  storageKey = 'dl-theme',
  children,
}: PropsWithChildren<ThemeProviderProps>) {
  const fallbackBase: BaseTheme = defaultBaseTheme ?? (enableSystem ? 'system' : 'light')

  const [baseTheme, setBaseThemeState] = useState<BaseTheme>(() => {
    const stored = read(`${storageKey}-base`, fallbackBase)
    return (['light', 'dark', 'system'].includes(stored) ? stored : fallbackBase) as BaseTheme
  })
  const [isLiquid, setIsLiquid] = useState<boolean>(() => read(`${storageKey}-liquid`, String(defaultIsLiquid)) === 'true')
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() =>
    isServer ? false : window.matchMedia(MEDIA).matches,
  )

  useEffect(() => {
    if (isServer || !enableSystem) return
    const mql = window.matchMedia(MEDIA)
    const onChange = () => setSystemIsDark(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [enableSystem])

  const computedTheme = useMemo(
    () => computeTheme(baseTheme, isLiquid, systemIsDark),
    [baseTheme, isLiquid, systemIsDark],
  )

  // Reflect onto html[data-theme]; the kit's CSS keys off light/dark.
  useEffect(() => {
    if (isServer) return
    const resolvedBase = computedTheme.includes('dark') ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', resolvedBase)
    document.documentElement.toggleAttribute('data-liquid', isLiquid)
  }, [computedTheme, isLiquid])

  const setBaseTheme = useCallback(
    (next: BaseTheme) => {
      setBaseThemeState(next)
      write(`${storageKey}-base`, next)
    },
    [storageKey],
  )
  const toggleLiquid = useCallback(() => {
    setIsLiquid((prev) => {
      const next = !prev
      write(`${storageKey}-liquid`, String(next))
      return next
    })
  }, [storageKey])

  const value = useMemo<UseThemeProps>(
    () => ({
      baseTheme,
      setBaseTheme,
      isLiquid,
      toggleLiquid,
      computedTheme,
      resolvedTheme: computedTheme,
      systemTheme: enableSystem ? (systemIsDark ? 'dark' : 'light') : undefined,
      storageKey,
    }),
    [baseTheme, setBaseTheme, isLiquid, toggleLiquid, computedTheme, enableSystem, systemIsDark, storageKey],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
