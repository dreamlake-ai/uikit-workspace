/** Own a resize gesture immediately, independently of React's render schedule. */
export function startResizeDrag(
  target: HTMLElement,
  down: Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY'>,
  cursor: 'col-resize' | 'row-resize',
  onMove: (point: { clientX: number; clientY: number }) => void,
  onEnd: () => void,
): () => void {
  const win = target.ownerDocument.defaultView!
  const body = target.ownerDocument.body
  const previousCursor = body.style.cursor
  const previousSelect = body.style.userSelect
  const previousWebkitSelect = body.style.webkitUserSelect
  let pending: { clientX: number; clientY: number } | null = null
  let frame: number | null = null
  let ended = false
  body.style.cursor = cursor
  body.style.userSelect = 'none'
  body.style.webkitUserSelect = 'none'

  const flush = () => {
    if (frame !== null) win.cancelAnimationFrame(frame)
    frame = null
    const point = pending
    pending = null
    if (point) onMove(point)
  }
  const finish = () => {
    if (ended) return
    ended = true
    flush()
    win.removeEventListener('pointermove', move, true)
    win.removeEventListener('pointerup', up, true)
    win.removeEventListener('pointercancel', cancel, true)
    win.removeEventListener('blur', finish)
    target.removeEventListener('lostpointercapture', cancel)
    try {
      if (target.hasPointerCapture(down.pointerId)) target.releasePointerCapture(down.pointerId)
    } catch { /* The pointer may already have been cancelled by the browser. */ }
    body.style.cursor = previousCursor
    body.style.userSelect = previousSelect
    body.style.webkitUserSelect = previousWebkitSelect
    onEnd()
  }
  const move = (event: PointerEvent) => {
    if (event.pointerId !== down.pointerId) return
    // Recover if release happened outside this window and capture was unavailable.
    if (event.buttons === 0) { finish(); return }
    if (event.cancelable) event.preventDefault()
    pending = { clientX: event.clientX, clientY: event.clientY }
    if (frame === null) frame = win.requestAnimationFrame(flush)
  }
  const up = (event: PointerEvent) => {
    if (event.pointerId !== down.pointerId) return
    // Release can arrive before the queued frame. Apply its final coordinate.
    pending = { clientX: event.clientX, clientY: event.clientY }
    finish()
  }
  const cancel = (event: PointerEvent) => {
    if (event.pointerId === down.pointerId) finish()
  }
  win.addEventListener('pointermove', move, { capture: true, passive: false })
  win.addEventListener('pointerup', up, true)
  win.addEventListener('pointercancel', cancel, true)
  win.addEventListener('blur', finish)
  target.addEventListener('lostpointercapture', cancel)
  try { target.setPointerCapture(down.pointerId) } catch {
    // Synthetic events and older browsers can lack capture; window tracking remains.
  }
  return finish
}
