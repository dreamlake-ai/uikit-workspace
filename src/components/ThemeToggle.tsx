import { useTheme, type ThemeMode } from '../hooks/useTheme'
import type { ReactNode } from 'react'

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" /><path d="M17.66 6.34l1.41-1.41" />
  </svg>
)

const SystemIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8" /><path d="M12 17v4" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SEG_SIZE = 24
// Custom spring-ish ease shared by the indicator and the SVG transforms.
const SPRING = 'cubic-bezier(.34,1.45,.55,1)'

const buttonCx =
  'appearance-none relative z-10 w-6 h-6 inline-flex items-center justify-center bg-transparent border-0 rounded-full text-muted cursor-pointer p-0 m-0 transition-colors duration-[250ms] hover:text-ink aria-pressed:text-ink motion-reduce:transition-none'

function Segment({
  id,
  label,
  mode,
  current,
  onClick,
  children,
}: {
  id: ThemeMode
  label: string
  mode: ThemeMode
  current: ThemeMode
  onClick: () => void
  children: ReactNode
}) {
  const pressed = mode === current
  // Inactive icons shrink + tilt: light tilts left, dark tilts right,
  // system just shrinks. Matches the prototype's per-id rotation.
  const tilt = id === 'light' ? -18 : id === 'dark' ? 18 : 0
  const iconStyle = pressed
    ? { transform: 'none', opacity: 1 }
    : { transform: `scale(0.85) rotate(${tilt}deg)`, opacity: 0.65 }

  return (
    <button
      id={`t3-${id}`}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={buttonCx}
      suppressHydrationWarning
    >
      <span
        className="block w-[13px] h-[13px] [&>svg]:w-[13px] [&>svg]:h-[13px] transition-[transform,opacity] duration-[420ms] motion-reduce:transition-none"
        style={{ transitionTimingFunction: SPRING, ...iconStyle }}
      >
        {children}
      </span>
    </button>
  )
}

export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const pos = mode === 'light' ? 0 : mode === 'system' ? 1 : 2

  return (
    // The pill's border is transparent (rather than dropped) so its
    // outer dimensions stay identical and the topnav row doesn't shift.
    <div
      role="group"
      aria-label="Theme"
      className="relative inline-flex items-center bg-panel border border-transparent rounded-full p-0.5 isolate"
    >
      {/* Sliding indicator pill — replaces the CSS ::before so the
          transform stays in JS and the styling stays in Tailwind. */}
      <span
        aria-hidden="true"
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-chip z-0 will-change-transform transition-transform duration-[420ms] motion-reduce:transition-none"
        style={{
          transform: `translateX(${pos * SEG_SIZE}px)`,
          transitionTimingFunction: SPRING,
        }}
      />
      <Segment id="light"  label="Light"  mode="light"  current={mode} onClick={() => setMode('light')}>
        <SunIcon />
      </Segment>
      <Segment id="system" label="System" mode="system" current={mode} onClick={() => setMode('system')}>
        <SystemIcon />
      </Segment>
      <Segment id="dark"   label="Dark"   mode="dark"   current={mode} onClick={() => setMode('dark')}>
        <MoonIcon />
      </Segment>
    </div>
  )
}

