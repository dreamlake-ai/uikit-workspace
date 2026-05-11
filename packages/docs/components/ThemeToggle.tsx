import { useTheme, type Theme } from './ThemeProvider'
import { ClientOnly } from './ClientOnly'
import { JSX } from 'react'

const SIZE = 24
const PAD = 2
const SPRING = 'cubic-bezier(0.34, 1.45, 0.55, 1)'

const LightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ width: 13, height: 13 }}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </svg>
)

const SystemIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ width: 13, height: 13 }}
  >
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
)

const DarkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ width: 13, height: 13 }}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

interface Segment {
  value: Theme
  label: string
  Icon: () => JSX.Element
  /** Per-button rotation when inactive — light leans -18°, dark leans +18°. */
  inactiveRotate?: number
}

const SEGMENTS: Segment[] = [
  { value: 'light',  label: 'Light',  Icon: LightIcon,  inactiveRotate: -18 },
  { value: 'system', label: 'System', Icon: SystemIcon },
  { value: 'dark',   label: 'Dark',   Icon: DarkIcon,   inactiveRotate: 18 },
]

function ToggleInner() {
  const { theme, setTheme } = useTheme()
  const idx = Math.max(0, SEGMENTS.findIndex(s => s.value === theme))

  return (
    <div
      role="group"
      aria-label="Theme"
      className="relative inline-flex items-center bg-doc-template-panel"
      style={{ padding: PAD, borderRadius: 999, isolation: 'isolate' }}
    >
      {/* Sliding indicator — was a `::before` pseudo-element in docs.html;
          here it's a real <span> so we can drive its transform with React. */}
      <span
        aria-hidden
        className="bg-doc-template-chip"
        style={{
          position: 'absolute',
          top: PAD,
          left: PAD,
          width: SIZE,
          height: SIZE,
          borderRadius: 999,
          transform: `translateX(${idx * SIZE}px)`,
          transition: `transform 0.42s ${SPRING}`,
          zIndex: 0,
          willChange: 'transform',
        }}
      />
      {SEGMENTS.map(seg => {
        const pressed = seg.value === theme
        return (
          <button
            key={seg.value}
            type="button"
            aria-label={seg.label}
            title={seg.label}
            aria-pressed={pressed}
            onClick={() => setTheme(seg.value)}
            className={
              pressed
                ? 'inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-doc-template-ink'
                : 'inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-doc-template-muted hover:text-doc-template-ink'
            }
            style={{
              position: 'relative',
              zIndex: 1,
              width: SIZE,
              height: SIZE,
              borderRadius: 999,
              padding: 0,
              margin: 0,
              transition: 'color 0.25s ease',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                transform: pressed
                  ? 'scale(1) rotate(0deg)'
                  : `scale(0.85)${seg.inactiveRotate ? ` rotate(${seg.inactiveRotate}deg)` : ''}`,
                opacity: pressed ? 1 : 0.65,
                transition: `transform 0.42s ${SPRING}, opacity 0.25s ease`,
              }}
            >
              <seg.Icon />
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function ThemeToggle() {
  return (
    <ClientOnly>
      <ToggleInner />
    </ClientOnly>
  )
}
