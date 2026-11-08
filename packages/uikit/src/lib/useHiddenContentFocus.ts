import { useLayoutEffect, useState, type RefObject } from 'react'

/** Hide retained content only after focus has left it. A render-time
 * aria-hidden/inert update precedes effects and can strand the active element
 * inside an inaccessible subtree, even if an effect restores focus later.
 * Outside clicks keep their chosen focus; keyboard closes return to the
 * supplied trigger. Without a trigger, blur lets overlay focus managers
 * perform their normal restoration. */
export function useHiddenContentFocus(
  hidden: boolean,
  container: RefObject<HTMLElement | null>,
  returnFocus?: () => HTMLElement | null | undefined
): { inert?: true; 'aria-hidden'?: true } {
  const [ready, setReady] = useState(hidden)
  // Reveal immediately, including a reopen during an exit animation.
  if (!hidden && ready) setReady(false)

  useLayoutEffect(() => {
    if (!hidden || ready) return
    const element = container.current
    const active = element?.ownerDocument.activeElement
    if (element && active instanceof HTMLElement && element.contains(active)) {
      const target = returnFocus?.()
      if (
        target?.isConnected &&
        !element.contains(target) &&
        !target.closest('[inert], [aria-hidden="true"]')
      )
        target.focus({ preventScroll: true })
      // A removed/disabled trigger cannot receive focus. Never hide a focused
      // descendant in that case, and never blur focus already moved outside.
      if (element.contains(element.ownerDocument.activeElement)) active.blur()
    }
    setReady(true)
  }, [hidden, ready, container, returnFocus])

  return hidden && ready ? { inert: true, 'aria-hidden': true } : {}
}
