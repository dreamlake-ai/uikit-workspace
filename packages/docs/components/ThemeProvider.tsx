import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocalStorage } from '../lib/use-local-storage'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
})

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', dark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', t)
  }
}

function isTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'dark' || v === 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // `useLocalStorage` gives us SSR-safe state, cross-tab sync via the
  // native `storage` event, and same-tab broadcast — so flipping the
  // theme in one tab (or in another React subtree consuming the same
  // hook) propagates everywhere without a reload. Key lands at
  // `doc:theme` in localStorage; the FOUC script in +onRenderHtml.tsx
  // reads the same key.
  const [stored, setStored] = useLocalStorage<Theme>('theme', 'system')
  const theme: Theme = isTheme(stored) ? stored : 'system'

  // Apply the data-theme attribute whenever the resolved theme
  // changes. Also subscribe to the OS prefers-color-scheme media
  // query when running in `system` so dark-mode flips track the OS.
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setStored }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
