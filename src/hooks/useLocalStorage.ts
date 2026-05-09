import { useCallback, useEffect, useRef, useState } from 'react'

// All keys this hook writes get prefixed so DreamLake state is easy to
// audit / namespace separately from anything else on the page. Use the
// helper `dlKey` below or pass a fully-qualified `dl:...` key.
export const DL_PREFIX = 'dl:'
export const dlKey = (k: string) => (k.startsWith(DL_PREFIX) ? k : DL_PREFIX + k)

// Custom event used to broadcast updates from one component to all
// other useLocalStorage consumers in the same page. Native `storage`
// events only fire for cross-tab changes; this fills the same-tab gap.
const SAME_TAB_EVENT = 'dl:storage'

/**
 * SSR-safe localStorage-backed state. Returns the in-memory React value
 * and a setter that mirrors the value into localStorage and broadcasts
 * to other consumers in the same tab.
 *
 * - On server render, the initial value is `defaultValue` (no
 *   localStorage access). The hook reconciles on mount.
 * - Cross-tab sync works via the native `storage` event.
 * - Same-tab sync (e.g., toggling a setting on one CodeBlock updates
 *   every other CodeBlock on the page) works via a custom event the
 *   setter dispatches on every write.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const fullKey = dlKey(key)
  const [value, setValue] = useState<T>(defaultValue)

  // The hook expects defaultValue to be stable across renders (the
  // standard useState/useReducer-style contract). We keep a ref so the
  // storage-event listeners can read the latest passed value if it
  // ever does change, without re-running the effect on every render.
  const defaultRef = useRef(defaultValue)
  defaultRef.current = defaultValue

  // Hydrate from storage + listen for changes.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const read = () => {
      try {
        const raw = localStorage.getItem(fullKey)
        if (raw === null) {
          // Another tab cleared the key — fall back to the default.
          setValue(defaultRef.current)
        } else {
          setValue(JSON.parse(raw) as T)
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(`[useLocalStorage] malformed value at "${fullKey}":`, err)
        }
      }
    }
    read()

    const onStorage = (e: StorageEvent) => {
      if (e.key === fullKey) read()
    }
    const onSameTab = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail
      if (detail?.key === fullKey) read()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(SAME_TAB_EVENT, onSameTab)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SAME_TAB_EVENT, onSameTab)
    }
  }, [fullKey])

  const set = useCallback(
    (next: T) => {
      setValue(next)
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem(fullKey, JSON.stringify(next))
      } catch {
        /* quota / privacy mode — fall through */
      }
      window.dispatchEvent(
        new CustomEvent(SAME_TAB_EVENT, { detail: { key: fullKey } }),
      )
    },
    [fullKey],
  )

  return [value, set]
}
