import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip'
import { PauseSharp, PlaySharp, SkipBackSharp, SkipForwardSharp } from '../VideoAnnotator/icons'

export { PauseSharp, PlaySharp, SkipBackSharp, SkipForwardSharp }

/**
 * One transport button, styled like the VideoAnnotator's control bar: a quiet
 * 30px square (36px for the main play/pause), 6px radius, resting at 75% ink
 * that turns full ink over a 5% ink wash on hover. The label is the tooltip
 * (kit Tooltip, wedge on) and the accessible name, so name the shortcut in it:
 * "Play (Space)".
 */
export interface TransportButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> {
  label: string
  /** The larger centre button (play / pause). */
  primary?: boolean
  /** Toggle state: accent when on. */
  active?: boolean
  children: ReactNode
}

export const TransportButton = forwardRef<HTMLButtonElement, TransportButtonProps>(
  function TransportButton(
    { label, primary, active, className, children, type = 'button', ...props },
    ref
  ) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type={type}
            aria-label={label}
            data-transport-button=""
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-0 bg-transparent p-0 outline-none',
              'text-uikit-ink opacity-75 transition-[opacity,background-color,color] duration-[120ms] ease-out',
              'hover:bg-uikit-ink-5 hover:opacity-100',
              'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-uikit-accent focus-visible:-outline-offset-2 focus-visible:opacity-100',
              'disabled:pointer-events-none disabled:opacity-35',
              '[&_svg]:shrink-0 [&_svg]:[stroke-linejoin:miter] [&_svg]:[stroke-linecap:square]',
              primary ? 'h-9 w-9' : 'h-[30px] w-[30px]',
              active && 'text-uikit-accent opacity-100',
              className
            )}
            {...props}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    )
  }
)

export interface MediaTransportProps {
  playing: boolean
  onTogglePlay: () => void
  /** Step back / forward (a frame, a second, a version…). Omit to hide. */
  onStep?: (direction: -1 | 1) => void
  /** Jump to the start / end. Omit to hide. */
  onSkip?: (to: 'start' | 'end') => void
  /** Words for the step buttons' tooltips, e.g. "frame" or "5 s". */
  stepLabel?: string
  /** Name for play/pause, e.g. "Play reading". Defaults to Play / Pause. */
  playLabel?: string
  pauseLabel?: string
  disabled?: boolean
  /** Smaller play button, for compact bars. */
  compact?: boolean
  className?: string
}

/**
 * The shared playback cluster: ⏮ ‹ ▶ › ⏭, the same sharp glyphs and quiet
 * buttons as the VideoAnnotator's control bar, so every player in the app
 * looks and behaves alike. Pair with `useMediaKeys` for Space / ← → / Home End.
 */
export function MediaTransport({
  playing,
  onTogglePlay,
  onStep,
  onSkip,
  stepLabel = 'frame',
  playLabel = 'Play',
  pauseLabel = 'Pause',
  disabled,
  compact,
  className,
}: MediaTransportProps) {
  return (
    <div
      role="group"
      aria-label="Playback"
      className={cn('inline-flex items-center gap-1', className)}
      data-media-transport=""
    >
      {onSkip && (
        <TransportButton
          label="Go to start (Home)"
          onClick={() => onSkip('start')}
          disabled={disabled}
        >
          <SkipBackSharp size={15} />
        </TransportButton>
      )}
      {onStep && (
        <TransportButton
          label={`Back one ${stepLabel} (←)`}
          onClick={() => onStep(-1)}
          disabled={disabled}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </TransportButton>
      )}
      <TransportButton
        primary={!compact}
        label={`${playing ? pauseLabel : playLabel} (Space)`}
        aria-pressed={playing}
        onClick={onTogglePlay}
        disabled={disabled}
      >
        {playing ? <PauseSharp size={compact ? 14 : 16} /> : <PlaySharp size={compact ? 14 : 16} />}
      </TransportButton>
      {onStep && (
        <TransportButton
          label={`Forward one ${stepLabel} (→)`}
          onClick={() => onStep(1)}
          disabled={disabled}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </TransportButton>
      )}
      {onSkip && (
        <TransportButton label="Go to end (End)" onClick={() => onSkip('end')} disabled={disabled}>
          <SkipForwardSharp size={15} />
        </TransportButton>
      )}
    </div>
  )
}

export interface MediaKeyHandlers {
  onTogglePlay?: () => void
  onStep?: (direction: -1 | 1) => void
  onSkip?: (to: 'start' | 'end') => void
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable ||
    el.getAttribute?.('role') === 'slider'
  )
}

/**
 * Space / ← → / Home End for one player, only while focus is inside `ref`'s
 * element (so two players on a page never both react, and typing elsewhere is
 * never hijacked). Buttons inside keep their own Space; sliders keep arrows.
 */
export function useMediaKeys(
  ref: RefObject<HTMLElement | null>,
  { onTogglePlay, onStep, onSkip }: MediaKeyHandlers
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e.target)) return
      const onButton = (e.target as HTMLElement | null)?.closest?.('button')
      if (e.key === ' ' && onTogglePlay && !onButton) {
        e.preventDefault()
        onTogglePlay()
      } else if (e.key === 'ArrowLeft' && onStep) {
        e.preventDefault()
        onStep(-1)
      } else if (e.key === 'ArrowRight' && onStep) {
        e.preventDefault()
        onStep(1)
      } else if (e.key === 'Home' && onSkip) {
        e.preventDefault()
        onSkip('start')
      } else if (e.key === 'End' && onSkip) {
        e.preventDefault()
        onSkip('end')
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [ref, onTogglePlay, onStep, onSkip])
}
