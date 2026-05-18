import { useEffect } from 'react'
import { useLocalStorage } from './use-local-storage'

/**
 * Global "show hidden pages" toggle.
 *
 * Pages with `hidden: true` in frontmatter are filtered out of the
 * sidebar by default. Press the chord below to reveal them; press
 * again to hide. State is persisted to localStorage as `doc:show-hidden`
 * so it survives reloads.
 *
 * Keybinding: **Cmd+Shift+D** (macOS) / **Ctrl+Shift+D** (Linux/Win).
 * `Cmd+D` alone is browser bookmark — adding Shift dodges that.
 *
 * The hook also exposes the setter so a UI control (e.g. a topbar
 * indicator) can toggle the state from a click as well.
 */
export function useHiddenToggle(): [boolean, (next: boolean) => void] {
  const [show, setShow] = useLocalStorage<boolean>('show-hidden', false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing into a text field.
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return
      }
      const isToggle =
        (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')
      if (!isToggle) return
      e.preventDefault()
      setShow(!show)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [show, setShow])

  return [show, setShow]
}
