import {
  Fragment,
  ReactNode,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/utils'
import { Tabs } from '../Tabs/Tabs'
import { Avatar } from '../Avatar/Avatar'

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_W = 1100
const RAIL_W = 248
const RAIL_GAP = 48
const SCROLL_THRESHOLD = 80
const TOPBAR_H_LARGE = 56
export const TOPBAR_H_SMALL = 34

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProfileLayoutFact {
  label: string
  value: string
}

export interface ProfileLayoutMember {
  id: string
  name: string
}

export interface ProfileLayoutProfile {
  name: string
  handle: string
  kind: 'user' | 'org'
  /** Avatar image URL. When provided, renders the image (1:1, object-cover);
   *  when omitted, falls back to a monogram derived from `name`. */
  image?: string
  bio?: string
  facts?: ProfileLayoutFact[]
  members?: ProfileLayoutMember[]
}

export interface ProfileLayoutTab {
  value: string
  label: string
  count?: number | null
  showColsToggle?: boolean
  /** Receives current column count and whether the page has scrolled past the
   *  sticky threshold. Use `scrolled` + the exported `TOPBAR_H_SMALL` constant
   *  to compute the correct `top` offset for any sticky elements inside the tab. */
  render: (cols: 1 | 2, scrolled: boolean) => ReactNode
}

export interface ProfileLayoutProps {
  profile: ProfileLayoutProfile
  tabs: ProfileLayoutTab[]
  /** Initial tab in uncontrolled mode. Ignored when `tab` is provided. */
  defaultTab?: string
  /** Controlled active tab. Pass alongside `onTabChange` to control externally
   *  (e.g. so an in-page link can switch tabs). When omitted, the layout
   *  manages its own state via `defaultTab`. */
  tab?: string
  /** Fires when the user (or an internal control) requests a tab change.
   *  Required when using `tab` for controlled mode. */
  onTabChange?: (tab: string) => void
  logo?: ReactNode
  actions?: ReactNode
  /** Override scroll container. Defaults to window. Pass a ref to the
   *  wrapping element when embedding inside a bounded scrollable div. */
  scrollContainerRef?: RefObject<HTMLElement>
  className?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ── Hooks ──────────────────────────────────────────────────────────────────

function useScrolled(
  threshold = SCROLL_THRESHOLD,
  containerRef?: RefObject<HTMLElement>,
) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const el = containerRef?.current ?? window
    const getTop = () =>
      containerRef?.current ? containerRef.current.scrollTop : window.scrollY
    const hysteresis = TOPBAR_H_LARGE - TOPBAR_H_SMALL
    const handler = () => {
      const top = getTop()
      setScrolled((prev) =>
        prev ? top > threshold - hysteresis : top > threshold,
      )
    }
    handler()
    el.addEventListener('scroll', handler, {
      passive: true,
    } as AddEventListenerOptions)
    return () => el.removeEventListener('scroll', handler)
  }, [threshold, containerRef])
  return scrolled
}

// ── GridColsToggle ─────────────────────────────────────────────────────────

function GridColsToggle({
  value,
  onChange,
}: {
  value: 1 | 2
  onChange: (v: 1 | 2) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const [bar, setBar] = useState({
    left: 0, top: 0, width: 0, height: 0, ready: false,
  })

  useLayoutEffect(() => {
    const el = itemRefs.current[value]
    const c = containerRef.current
    if (!el || !c) return
    const eR = el.getBoundingClientRect()
    const cR = c.getBoundingClientRect()
    setBar({
      left: eR.left - cR.left, top: eR.top - cR.top,
      width: eR.width, height: eR.height,
      ready: true,
    })
  }, [value])

  return (
    <div ref={containerRef} className="flex items-center gap-0.5 relative">
      <span
        aria-hidden
        className="absolute pointer-events-none z-0 rounded bg-uikit-ink-8"
        style={{
          left: bar.left + 3,
          top: bar.top + 3,
          width: Math.max(0, bar.width - 6),
          height: Math.max(0, bar.height - 6),
          opacity: bar.ready ? 1 : 0,
          transition: bar.ready
            ? 'left 220ms cubic-bezier(.2,.7,.2,1), width 220ms cubic-bezier(.2,.7,.2,1)'
            : 'none',
        }}
      />
      {([1, 2] as const).map((cols) => {
        const active = value === cols
        return (
          <button
            key={cols}
            ref={(el) => {
              itemRefs.current[cols] = el
            }}
            type="button"
            onClick={() => onChange(cols)}
            title={cols === 1 ? 'List' : 'Grid'}
            data-active={active || undefined}
            className={cn(
              'appearance-none bg-transparent border-0 p-0 cursor-pointer',
              'flex items-center justify-center relative z-[1]',
              'w-[22px] h-[22px]',
              'text-uikit-muted opacity-55 data-[active]:text-uikit-ink data-[active]:opacity-100',
              'transition-[opacity,color] duration-[120ms]',
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            >
              {cols === 1 ? (
                <>
                  <line x1="2.5" y1="4" x2="11.5" y2="4" />
                  <line x1="2.5" y1="7" x2="11.5" y2="7" />
                  <line x1="2.5" y1="10" x2="11.5" y2="10" />
                </>
              ) : (
                <>
                  <rect x="2.5" y="2.5" width="3.5" height="3.5" rx=".5" />
                  <rect x="8" y="2.5" width="3.5" height="3.5" rx=".5" />
                  <rect x="2.5" y="8" width="3.5" height="3.5" rx=".5" />
                  <rect x="8" y="8" width="3.5" height="3.5" rx=".5" />
                </>
              )}
            </svg>
          </button>
        )
      })}
    </div>
  )
}

// ── TabStrip ───────────────────────────────────────────────────────────────

function TabStrip({
  tabs,
  value,
  onChange,
  cols,
  onColsChange,
  embedded = false,
  scrolled = false,
}: {
  tabs: ProfileLayoutTab[]
  value: string
  onChange: (v: string) => void
  cols: 1 | 2
  onColsChange: (v: 1 | 2) => void
  embedded?: boolean
  scrolled?: boolean
}) {
  const hidden = !embedded && scrolled
  const activeTab = tabs.find((t) => t.value === value)
  const tabItems = tabs.map((t) => ({
    value: t.value,
    label: t.label,
    count: t.count ?? undefined,
  }))

  return (
    <div
      data-hidden={hidden || undefined}
      className={cn(
        'flex items-end overflow-x-auto vdu-no-scrollbar',
        'data-[hidden]:invisible data-[hidden]:pointer-events-none',
        !embedded && 'sticky z-20 mt-2.5 bg-inherit border-b border-uikit-faint',
      )}
      style={{
        top: embedded ? undefined : TOPBAR_H_SMALL,
        height: embedded ? TOPBAR_H_SMALL : undefined,
      }}
    >
      <Tabs
        tabs={tabItems}
        value={value}
        onChange={onChange}
        variant="underline"
        size="md"
        indicatorHeight={4}
        className="border-b-0"
      />
      {!embedded && activeTab?.showColsToggle && (
        <div className="ml-auto self-center shrink-0">
          <GridColsToggle value={cols} onChange={onColsChange} />
        </div>
      )}
    </div>
  )
}

// ── HeroRail ───────────────────────────────────────────────────────────────

function HeroRail({ profile }: { profile: ProfileLayoutProfile }) {
  const { name, handle, image, bio, facts = [], members = [], kind } = profile

  return (
    <aside
      className={cn(
        'vdu-no-scrollbar shrink-0 flex flex-col gap-[18px] self-start',
        'sticky pt-7 overflow-y-auto',
      )}
      style={{
        width: RAIL_W,
        top: TOPBAR_H_SMALL,
        maxHeight: `calc(100vh - ${TOPBAR_H_SMALL + 4}px)`,
      }}
    >
      {/* Avatar banner — image when provided, monogram fallback otherwise */}
      {image ? (
        <img
          src={image}
          alt={name}
          className="block w-full aspect-square select-none rounded-xl object-cover"
        />
      ) : (
        <div
          className={cn(
            'w-full aspect-square flex items-center justify-center',
            'font-uikit-ui font-semibold select-none rounded-xl',
            'text-uikit-ink opacity-90',
            'bg-[color-mix(in_oklab,var(--ink)_8%,var(--bg))]',
            'tracking-[-.04em] text-[88px]',
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Name + handle */}
      <div className="flex flex-col gap-1">
        <h1 className="m-0 font-uikit-ui text-uikit-22 font-semibold text-uikit-ink tracking-uikit-tighter leading-[1.15]">
          {name}
        </h1>
        <span className="font-uikit-mono text-[12.5px] font-medium text-uikit-muted opacity-85 tracking-uikit-snug">
          @{handle}
        </span>
      </div>

      {bio && (
        <p className="m-0 font-uikit-ui text-[13.5px] font-normal text-uikit-ink opacity-85 leading-normal tracking-uikit-snug">
          {bio}
        </p>
      )}

      {facts.length > 0 && (
        <div
          className="pt-3.5 border-t border-uikit-faint grid"
          style={{ gridTemplateColumns: '60px 1fr', rowGap: 6, columnGap: 12 }}
        >
          {facts.map(({ label, value }) => (
            <Fragment key={label}>
              <span className="pt-px font-uikit-mono text-[10.5px] font-medium uppercase text-uikit-muted opacity-65 tracking-uikit-wide">
                {label}
              </span>
              <span className="font-uikit-mono text-[11.5px] text-uikit-ink opacity-85 tracking-uikit-snug break-words">
                {value}
              </span>
            </Fragment>
          ))}
        </div>
      )}

      {kind === 'org' && members.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-3.5 border-t border-uikit-faint">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-uikit-mono text-[10.5px] font-medium uppercase text-uikit-muted opacity-65 tracking-uikit-wide">
              members
            </span>
            <span className="font-uikit-mono text-[10.5px] text-uikit-muted opacity-55 tracking-uikit-snug">
              {members.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {members.slice(0, 12).map((m) => (
              <Avatar key={m.id} name={m.name} size={30} />
            ))}
            {members.length > 12 && (
              <div
                className={cn(
                  'flex items-center justify-center rounded w-[30px] h-[30px]',
                  'font-uikit-mono text-uikit-10 font-medium text-uikit-muted opacity-80 tracking-uikit-snug',
                  'bg-[color-mix(in_oklab,var(--ink)_5%,var(--bg))]',
                )}
              >
                +{members.length - 12}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

// ── TopBar ─────────────────────────────────────────────────────────────────

function TopBar({
  logo,
  actions,
  tabs,
  tabValue,
  onTabChange,
  cols,
  onColsChange,
  scrolled,
}: {
  logo?: ReactNode
  actions?: ReactNode
  tabs: ProfileLayoutTab[]
  tabValue: string
  onTabChange: (v: string) => void
  cols: 1 | 2
  onColsChange: (v: 1 | 2) => void
  scrolled: boolean
}) {
  return (
    <div
      data-scrolled={scrolled || undefined}
      className={cn(
        'sticky top-0 z-30 border-b transition-[background,border-color,backdrop-filter] duration-200 ease-out',
        // Default (not scrolled).
        'bg-uikit-bg border-transparent',
        // Scrolled: frosted glass + faint border + bg fade.
        'data-[scrolled]:bg-[color-mix(in_oklab,var(--bg)_86%,transparent)]',
        'data-[scrolled]:border-uikit-faint',
        'data-[scrolled]:backdrop-blur-md data-[scrolled]:backdrop-saturate-150',
      )}
    >
      {/* Logo — absolute left, animates vertical position on scroll */}
      {logo && (
        <span
          className="absolute z-[2] left-5 transition-[bottom] duration-[260ms] ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ bottom: scrolled ? 8 : 14 }}
        >
          {logo}
        </span>
      )}

      <div
        className="mx-auto relative flex items-end overflow-hidden gap-4 px-8"
        style={{
          maxWidth: MAX_W,
          height: scrolled ? TOPBAR_H_SMALL : TOPBAR_H_LARGE,
          transition: 'height 260ms cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Embedded tab strip — slides in from bottom on scroll */}
        <div
          data-scrolled={scrolled || undefined}
          className={cn(
            'absolute top-0 flex items-center',
            // Animate opacity + translateY based on scrolled state.
            'opacity-0 translate-y-9 pointer-events-none',
            'data-[scrolled]:opacity-100 data-[scrolled]:translate-y-0 data-[scrolled]:pointer-events-auto',
            'transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(.4,0,.2,1)]',
          )}
          style={{
            left: 32 + RAIL_W + RAIL_GAP,
            height: TOPBAR_H_SMALL,
          }}
        >
          <TabStrip
            tabs={tabs}
            value={tabValue}
            onChange={onTabChange}
            cols={cols}
            onColsChange={onColsChange}
            embedded
            scrolled={scrolled}
          />
        </div>

        {/* Actions slot — pinned to right */}
        {actions && (
          <div className="ml-auto shrink-0 self-center">{actions}</div>
        )}
      </div>
    </div>
  )
}

// ── ProfileLayout ──────────────────────────────────────────────────────────

export function ProfileLayout({
  profile,
  tabs,
  defaultTab,
  tab,
  onTabChange,
  logo,
  actions,
  scrollContainerRef,
  className,
}: ProfileLayoutProps) {
  const [internalTab, setInternalTab] = useState(
    defaultTab ?? tabs[0]?.value ?? '',
  )
  const isControlled = tab !== undefined
  const activeTab = isControlled ? tab : internalTab
  const setActiveTab = (next: string) => {
    if (!isControlled) setInternalTab(next)
    onTabChange?.(next)
  }
  const [cols, setCols] = useState<1 | 2>(1)
  const scrolled = useScrolled(SCROLL_THRESHOLD, scrollContainerRef)

  const currentTab = tabs.find((t) => t.value === activeTab)

  return (
    <div
      className={cn(
        'min-h-full bg-uikit-bg text-uikit-ink font-uikit-ui',
        className,
      )}
    >
      <TopBar
        logo={logo}
        actions={actions}
        tabs={tabs}
        tabValue={activeTab}
        onTabChange={setActiveTab}
        cols={cols}
        onColsChange={setCols}
        scrolled={scrolled}
      />

      <div className="mx-auto px-8" style={{ maxWidth: MAX_W }}>
        <div className="flex items-start" style={{ gap: RAIL_GAP }}>
          <HeroRail profile={profile} />

          <main className="flex-1 min-w-0 pt-4">
            <TabStrip
              tabs={tabs}
              value={activeTab}
              onChange={setActiveTab}
              cols={cols}
              onColsChange={setCols}
              scrolled={scrolled}
            />

            <div className="pb-24">{currentTab?.render(cols, scrolled)}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
