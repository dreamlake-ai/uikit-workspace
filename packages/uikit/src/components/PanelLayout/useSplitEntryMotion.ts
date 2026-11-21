import { useLayoutEffect, useRef, useState } from 'react'
import type { PanelNode } from './panel-tree'

export const SPLIT_ENTRY_MS = 220

/** Animate only a new horizontal split wrapping the previous whole panel.
 * The model stays final: persistence, focus, and commands never see tween sizes.
 * Both the slot geometry and connected view surfaces use this visual tree.
 */
export function useSplitEntryMotion(root: PanelNode, enabled: boolean) {
  const previous = useRef(root)
  const frame = useRef(0)
  const running = useRef('')
  const [motion, setMotion] = useState<{ key: string; sizes: number[] } | null>(null)
  const key =
    root.kind === 'split'
      ? `${root.id}:${root.children.map((n) => n.id).join(',')}:${root.sizes.join(',')}`
      : root.id

  useLayoutEffect(() => {
    const before = previous.current
    previous.current = root
    if (running.current === key && enabled) return
    cancelAnimationFrame(frame.current)
    running.current = ''
    setMotion(null)
    if (
      !enabled ||
      before.id === root.id ||
      root.kind !== 'split' ||
      root.dir !== 'row' ||
      root.children.length !== 2 ||
      root.children[0].id !== before.id ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return

    const total = root.sizes[0] + root.sizes[1]
    running.current = key
    setMotion({ key, sizes: [total, 0] })
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / SPLIT_ENTRY_MS)
      if (progress === 1) {
        running.current = ''
        setMotion(null)
        return
      }
      const eased = 1 - Math.pow(1 - progress, 3)
      const second = root.sizes[1] * eased
      setMotion({ key, sizes: [total - second, second] })
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [root, key, enabled])
  useLayoutEffect(() => () => cancelAnimationFrame(frame.current), [])

  return root.kind === 'split' && motion?.key === key && enabled
    ? { ...root, sizes: motion.sizes }
    : root
}
