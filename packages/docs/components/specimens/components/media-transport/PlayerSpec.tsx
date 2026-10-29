import { useEffect, useRef, useState } from 'react'
import { MediaTransport, Slider, useMediaKeys } from '@dreamlake/uikit'

const LENGTH = 10

/** A fake 10 s clip: the transport, the kit Slider as the scrubber, and the
 *  keyboard shortcuts scoped to this box (click it, then Space / ← → / Home End). */
export const PlayerSpec = () => {
  const [t, setT] = useState(2.5)
  const [playing, setPlaying] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(
      () =>
        setT((v) => {
          if (v >= LENGTH) {
            setPlaying(false)
            return LENGTH
          }
          return Math.min(LENGTH, v + 0.1)
        }),
      100
    )
    return () => clearInterval(id)
  }, [playing])
  const toggle = () => setPlaying((p) => !p)
  const step = (d: -1 | 1) => setT((v) => Math.max(0, Math.min(LENGTH, v + d)))
  const skip = (to: 'start' | 'end') => setT(to === 'start' ? 0 : LENGTH)
  useMediaKeys(box, { onTogglePlay: toggle, onStep: step, onSkip: skip })
  return (
    <div
      ref={box}
      tabIndex={0}
      className="flex w-full flex-col gap-3 rounded-lg p-3 outline-none focus-visible:ring-2 focus-visible:ring-uikit-accent"
    >
      <div className="grid h-32 place-items-center rounded-md bg-uikit-ink-5 font-uikit-mono text-uikit-muted">
        {t.toFixed(1)} s
      </div>
      <Slider
        aria-label="Seek"
        value={[t]}
        min={0}
        max={LENGTH}
        step={0.1}
        onValueChange={([v]) => setT(v)}
      />
      <div className="flex justify-center">
        <MediaTransport
          playing={playing}
          onTogglePlay={toggle}
          onStep={step}
          onSkip={skip}
          stepLabel="second"
        />
      </div>
    </div>
  )
}
