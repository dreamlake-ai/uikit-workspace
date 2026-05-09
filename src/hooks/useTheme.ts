import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'dl-theme'

function readSavedMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {}
  return 'system'
}

function applyMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  const dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export function useTheme() {
  // SSR-safe initial — actual saved mode is loaded on mount to avoid
  // hydration mismatch with the pre-hydration script in +Head.tsx.
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    setMode(readSavedMode())
  }, [])

  useEffect(() => {
    applyMode(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {}
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyMode('system')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [mode])

  return { mode, setMode }
}
