import {
  type AnimationEvent,
  type CSSProperties,
  type Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

/** Animation names that end a modal's exit (see `.uikit-modal-panel` in styles.css). */
const EXIT_ANIMATIONS = new Set(['uikit-modal-out', 'uikit-modal-fade-out'])
/** Unmount even if `animationend` never arrives (no animation support, a
 *  consumer `animation: none`, a hidden ancestor). Longer than either exit. */
export const MODAL_EXIT_FALLBACK_MS = 300

type Pose = CSSProperties & Record<`--${string}`, string>

export interface ModalPresence<T> {
  /** Render the portal. True while open and for the length of the exit. */
  present: boolean
  /** Drives `data-state`. Lags `open` by one layout pass on a switch, so the
   *  outgoing animation's current pose can be read before it is replaced. */
  state: 'open' | 'closed'
  /** The latest content while open; the last open content while closing, so
   *  a caller that clears its data on close doesn't blank the exiting panel. */
  content: T
  panelRef: (el: HTMLElement | null) => void
  backdropRef: (el: HTMLElement | null) => void
  panelStyle: Pose | undefined
  backdropStyle: Pose | undefined
  onPanelAnimationEnd: (e: AnimationEvent<HTMLElement>) => void
}

/** One stable callback ref feeding several refs (the panel's own, a
 *  consumer's, Floating UI's). Stable so callback refs don't detach and
 *  re-attach on every render. Follows React 19's ref contract: a callback
 *  ref's returned cleanup runs on detach in place of calling it with null.
 *  (Floating UI's useMergeRefs does the same, but its types clash with this
 *  package's second @types/react copy.) */
export function useComposedRef<T>(...refs: (Ref<T> | null | undefined)[]) {
  return useCallback((el: T | null) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === 'function') {
        const cleanup = ref(el)
        return typeof cleanup === 'function' ? cleanup : () => void ref(null)
      }
      if (ref) {
        ref.current = el
        return () => {
          ref.current = null
        }
      }
    })
    return () => cleanups.forEach((cleanup) => cleanup?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs)
}

/**
 * Mount/animation state shared by Dialog, ModalContent and AlertDialogContent.
 *
 * Keyboard, scroll-lock and focus handling stay keyed on `open` in each
 * component, so they release the moment closing starts; only the DOM is kept
 * until the exit animation ends. A switch mid-animation (close during the
 * enter, reopen during the exit) starts the next animation from the pose the
 * panel and scrim are actually at, via `--uikit-modal-from-*` variables.
 */
export function useModalPresence<T>(open: boolean, content: T): ModalPresence<T> {
  const [present, setPresent] = useState(open)
  const [state, setState] = useState<'open' | 'closed'>(open ? 'open' : 'closed')
  const [pose, setPose] = useState<{ panel?: Pose; backdrop?: Pose }>({})
  const panel = useRef<HTMLElement | null>(null)
  const backdrop = useRef<HTMLElement | null>(null)
  const retained = useRef(content)

  // Render-phase update (React re-renders before committing). A fresh mount
  // enters from the keyframes' own start: `finish` cleared the last pose.
  if (open && !present) {
    setPresent(true)
    setState('open')
  }

  useLayoutEffect(() => {
    if (open) retained.current = content
  })

  useLayoutEffect(() => {
    const want = open ? 'open' : 'closed'
    if (!present || state === want) return
    // DOM still carries the outgoing animation here; read where it is.
    const next: { panel?: Pose; backdrop?: Pose } = {}
    if (panel.current) {
      const cs = getComputedStyle(panel.current)
      next.panel = {
        '--uikit-modal-from-opacity': cs.opacity,
        '--uikit-modal-from-transform': cs.transform,
      }
    }
    if (backdrop.current) {
      next.backdrop = {
        '--uikit-modal-scrim-from': getComputedStyle(backdrop.current).backgroundColor,
      }
    }
    setPose(next)
    setState(want)
  }, [open, present, state])

  const finish = useCallback(() => {
    setPresent(false)
    setPose({})
  }, [])

  useEffect(() => {
    if (open || !present) return
    const timer = setTimeout(finish, MODAL_EXIT_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [open, present, finish])

  const onPanelAnimationEnd = useCallback(
    (e: AnimationEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget || !EXIT_ANIMATIONS.has(e.animationName)) return
      // The element's current data-state, not this render's: a reopen may have
      // committed between the animation ending and the event being handled.
      if (e.currentTarget.dataset.state === 'closed') finish()
    },
    [finish]
  )

  const panelRef = useCallback((el: HTMLElement | null) => {
    panel.current = el
  }, [])
  const backdropRef = useCallback((el: HTMLElement | null) => {
    backdrop.current = el
  }, [])

  return {
    present,
    state,
    content: open ? content : retained.current,
    panelRef,
    backdropRef,
    panelStyle: pose.panel,
    backdropStyle: pose.backdrop,
    onPanelAnimationEnd,
  }
}
