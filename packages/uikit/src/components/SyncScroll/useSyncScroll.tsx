import React, {
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react'

type ScrollRole = 'master' | 'slave' | 'drag'

interface ScrollableElement {
  ref: RefObject<HTMLElement>
  role: ScrollRole
}

interface SyncScrollContextValue {
  registerScrollable: (id: string, ref: RefObject<HTMLElement>, role: ScrollRole) => void
  unregisterScrollable: (id: string) => void
  syncScroll: (sourceId: string, scrollTop: number, scrollLeft: number) => void
}

const SyncScrollContext = createContext<SyncScrollContextValue | null>(null)

interface SyncScrollProviderProps {
  children: React.ReactNode
}

/**
 * Provides synchronized scrolling between registered elements (master controls
 * slaves). Ported verbatim from the legacy `@vuer-ai/vuer-uikit`.
 */
export function SyncScrollProvider({ children }: SyncScrollProviderProps) {
  const scrollablesRef = useRef<Map<string, ScrollableElement>>(new Map())
  const syncingRef = useRef<Set<string>>(new Set())

  const registerScrollable = useCallback(
    (id: string, ref: RefObject<HTMLElement>, role: ScrollRole) => {
      scrollablesRef.current.set(id, { ref, role })
    },
    [],
  )

  const unregisterScrollable = useCallback((id: string) => {
    scrollablesRef.current.delete(id)
    syncingRef.current.delete(id)
  }, [])

  const syncScroll = useCallback((sourceId: string, scrollTop: number, scrollLeft: number) => {
    if (syncingRef.current.has(sourceId)) return
    const sourceElement = scrollablesRef.current.get(sourceId)
    if (!sourceElement) return
    scrollablesRef.current.forEach((element, id) => {
      if (id === sourceId) return
      if (sourceElement.role === 'master' || sourceElement.role === 'drag') {
        syncingRef.current.add(id)
        if (element.ref.current) {
          element.ref.current.scrollTop = scrollTop
          element.ref.current.scrollLeft = scrollLeft
        }
      }
    })
    requestAnimationFrame(() => {
      syncingRef.current.clear()
    })
  }, [])

  return (
    <SyncScrollContext.Provider value={{ registerScrollable, unregisterScrollable, syncScroll }}>
      {children}
    </SyncScrollContext.Provider>
  )
}

interface BaseScrollOptions {
  enabled?: boolean
  axis?: 'vertical' | 'horizontal' | 'both'
  ref?: RefObject<HTMLDivElement>
}

interface UseSyncScrollOptions extends BaseScrollOptions {
  id?: string
  role?: ScrollRole
}

function useSyncScrollBase({
  id: providedId,
  role,
  enabled = true,
  axis = 'vertical',
  ref: providedRef,
}: UseSyncScrollOptions & { role: ScrollRole }) {
  const context = useContext(SyncScrollContext)
  const autoId = useId()
  const id = providedId || autoId
  const internalRef = useRef<HTMLDivElement>(null)
  const elementRef = providedRef || internalRef
  const lastScrollTop = useRef(0)
  const lastScrollLeft = useRef(0)

  if (!context) throw new Error('Sync scroll hooks must be used within a SyncScrollProvider')

  const { registerScrollable, unregisterScrollable, syncScroll } = context

  useEffect(() => {
    if (!enabled || !elementRef.current) return
    const element = elementRef.current
    registerScrollable(id, elementRef as RefObject<HTMLElement>, role)

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      let hasChanged = false
      if (axis === 'vertical' || axis === 'both') {
        if (target.scrollTop !== lastScrollTop.current) {
          lastScrollTop.current = target.scrollTop
          hasChanged = true
        }
      }
      if (axis === 'horizontal' || axis === 'both') {
        if (target.scrollLeft !== lastScrollLeft.current) {
          lastScrollLeft.current = target.scrollLeft
          hasChanged = true
        }
      }
      if (hasChanged) syncScroll(id, lastScrollTop.current, lastScrollLeft.current)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      element.removeEventListener('scroll', handleScroll)
      unregisterScrollable(id)
    }
  }, [id, role, enabled, axis, registerScrollable, unregisterScrollable, syncScroll, elementRef])

  return elementRef
}

/** Master scroll element that drives slaves. */
export function useSyncScroll(options: BaseScrollOptions = {}) {
  return useSyncScrollBase({ ...options, role: 'master' })
}
/** Slave scroll element controlled by a master. */
export function useScrollSlave(options: BaseScrollOptions = {}) {
  return useSyncScrollBase({ ...options, role: 'slave' })
}
/** Drag-controlled scroll element (acts like a master). */
export function useSyncDrag(options: BaseScrollOptions = {}) {
  return useSyncScrollBase({ ...options, role: 'drag' })
}

export type { ScrollRole, UseSyncScrollOptions, BaseScrollOptions }
