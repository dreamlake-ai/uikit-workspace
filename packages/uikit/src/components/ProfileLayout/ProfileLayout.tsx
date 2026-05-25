import {
  Fragment,
  ReactNode,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Tabs } from '../Tabs/Tabs'
import { Avatar } from '../Avatar/Avatar'
import { Dialog } from '../Dialog/Dialog'

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
  /** When provided, the rail avatar becomes interactive: hover shows a
   *  "change avatar" overlay and clicking opens a built-in upload sheet
   *  (drag-drop, file picker, live preview, optional remove). The callback
   *  fires with the chosen File on save, or `null` when the caller-rendered
   *  "remove" affordance is clicked. May return a Promise; the sheet shows
   *  a spinner while it resolves and surfaces an error if it rejects. */
  onAvatarChange?: (file: File | null) => Promise<void> | void
  /** When provided, the rail name row gains a small pencil button that
   *  invokes this callback (typically to open a profile-edit dialog the
   *  caller owns — keeping that flow's app-specific validation outside
   *  the design system). The pencil only materialises on group-hover of
   *  the name row. */
  onEditClick?: () => void
  /** Slot rendered flush-right on the name row, after the optional pencil
   *  button. Stays visible regardless of hover. Typical use is a theme-toggle
   *  pill, but anything works — settings shortcut, status badge, etc. */
  nameAccessory?: ReactNode
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
        'flex items-end overflow-x-auto uikit-no-scrollbar',
        'data-[hidden]:invisible data-[hidden]:pointer-events-none',
        !embedded && 'sticky z-20 mt-2.5 bg-inherit',
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
      />
      {!embedded && activeTab?.showColsToggle && (
        <div className="ml-auto self-center shrink-0">
          <GridColsToggle value={cols} onChange={onColsChange} />
        </div>
      )}
    </div>
  )
}

// ── RailAvatar ─────────────────────────────────────────────────────────────
// Reads-only avatar (image or monogram) when no `onAvatarChange` is wired.
// Otherwise, clicking opens an upload sheet and the avatar gains a dim
// hover scrim with a "change avatar" label.

function RailAvatar({
  name,
  image,
  onAvatarChange,
}: {
  name: string
  image?: string
  onAvatarChange?: (file: File | null) => Promise<void> | void
}) {
  const [editing, setEditing] = useState(false)
  const editable = !!onAvatarChange
  const initials = getInitials(name)

  return (
    <>
      <div
        onClick={editable ? () => setEditing(true) : undefined}
        className={cn(
          'group relative w-full aspect-square overflow-hidden rounded-xl select-none',
          editable && 'cursor-pointer',
        )}
        title={editable ? 'change avatar' : undefined}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="block w-full h-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              'font-uikit-ui font-semibold text-uikit-ink opacity-90',
              'bg-[color-mix(in_oklab,var(--ink)_8%,var(--bg))]',
              'tracking-[-.04em] text-[88px]',
            )}
          >
            {initials}
          </div>
        )}
        {editable && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-2',
              'bg-[color-mix(in_srgb,black_38%,transparent)]',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
              'text-white font-uikit-mono text-uikit-12 tracking-uikit-snug',
            )}
          >
            <Pencil size={16} />
            <span>change avatar</span>
          </div>
        )}
      </div>

      {editing && onAvatarChange && (
        <AvatarEditSheet
          name={name}
          currentImage={image}
          onChange={onAvatarChange}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}

// ── AvatarEditSheet ────────────────────────────────────────────────────────
// Dialog-based avatar picker: drag-drop + click-to-browse, live preview,
// "remove avatar" affordance when a current image exists. Async-aware:
// `onChange` may return a Promise and the sheet keeps itself open with a
// generic error message if it rejects.

function AvatarEditSheet({
  name,
  currentImage,
  onChange,
  onClose,
}: {
  name: string
  currentImage?: string
  onChange: (file: File | null) => Promise<void> | void
  onClose: () => void
}) {
  const initials = getInitials(name) || '?'
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  // `cleared` records that the user clicked "remove avatar" — we treat that
  // as a pending intent (commit on save) so the dialog stays open and the
  // preview reflects the change immediately.
  const [cleared, setCleared] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage ?? null)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const dirty = pendingFile !== null || cleared

  const readFile = (f: File | null | undefined) => {
    if (!f || !/^image\//.test(f.type)) return
    const r = new FileReader()
    r.onload = () => setPreviewUrl(String(r.result))
    r.readAsDataURL(f)
    setPendingFile(f)
    setCleared(false)
    setError(null)
  }

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (saving) return
    setPendingFile(null)
    setPreviewUrl(null)
    setCleared(true)
    setError(null)
  }

  const handleSave = async () => {
    if (saving) return
    if (!dirty) {
      onClose()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onChange(pendingFile)
      onClose()
    } catch {
      setError(
        pendingFile
          ? 'Upload failed. Please try again.'
          : 'Failed to remove avatar. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={() => { if (!saving) onClose() }}
      title="change avatar"
      eyebrow="upload an image · png, jpg, webp"
      width={480}
      footer={
        <>
          <span
            role="button"
            onClick={() => { if (!saving) onClose() }}
            data-disabled={saving || undefined}
            className={cn(
              'font-uikit-mono text-[11.5px] tracking-uikit-snug',
              'text-uikit-muted opacity-80 cursor-pointer select-none',
              'hover:text-uikit-ink',
              'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
            )}
          >
            cancel
          </span>
          <span
            role="button"
            onClick={handleSave}
            data-disabled={saving || undefined}
            className={cn(
              'font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug',
              'inline-block text-uikit-bg bg-uikit-ink rounded-md px-2.5 py-[5px] cursor-pointer select-none',
              'transition-[background] duration-120',
              'hover:bg-[color-mix(in_oklab,var(--ink)_88%,var(--accent))]',
              'data-[disabled]:opacity-60 data-[disabled]:pointer-events-none',
            )}
          >
            {saving ? 'saving…' : 'save avatar'}
          </span>
        </>
      }
    >
      {/* Avatar preview + drop zone on one row; "remove avatar" sits in its
          own row below, left-aligned (matches the design's ProfAvatarSheet
          layout in dreamlake v4/profile-view.jsx). */}
      <div className="flex items-stretch gap-3">
        <div
          className={cn(
            'w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden',
            'flex items-center justify-center',
            'bg-[color-mix(in_oklab,var(--ink)_8%,var(--bg))]',
            'font-uikit-ui font-semibold text-uikit-ink opacity-90',
            'text-[26px] tracking-uikit-tighter',
          )}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            readFile(e.dataTransfer.files?.[0])
          }}
          className={cn(
            'flex-1 self-stretch flex flex-col items-center justify-center text-center',
            'cursor-pointer rounded-lg border border-dashed px-3',
            'font-uikit-mono text-[11.5px] text-uikit-muted leading-normal tracking-uikit-snug',
            dragOver
              ? 'border-uikit-accent bg-uikit-accent-soft'
              : 'border-uikit-faint-dashed bg-[color-mix(in_srgb,var(--ink)_2%,transparent)]',
          )}
        >
          <span>
            drop an image here, or{' '}
            <span className="text-uikit-ink">browse</span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => readFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {(currentImage || pendingFile) && !cleared && (
        <div className="flex justify-start">
          <span
            role="button"
            onClick={handleRemove}
            className={cn(
              'font-uikit-mono text-[11.5px] tracking-uikit-snug',
              'text-uikit-tone-red cursor-pointer select-none',
            )}
          >
            remove avatar
          </span>
        </div>
      )}

      {error && (
        <div className="font-uikit-mono text-uikit-11 text-uikit-tone-red">
          {error}
        </div>
      )}
    </Dialog>
  )
}

// ── HeroRail ───────────────────────────────────────────────────────────────

function HeroRail({ profile }: { profile: ProfileLayoutProfile }) {
  const {
    name,
    handle,
    image,
    bio,
    facts = [],
    members = [],
    kind,
    onAvatarChange,
    onEditClick,
    nameAccessory,
  } = profile

  return (
    <aside
      className={cn(
        'uikit-no-scrollbar shrink-0 flex flex-col gap-[18px] self-start',
        'sticky pt-7 overflow-y-auto',
      )}
      style={{
        width: RAIL_W,
        top: TOPBAR_H_SMALL,
        maxHeight: `calc(100vh - ${TOPBAR_H_SMALL + 4}px)`,
      }}
    >
      <RailAvatar name={name} image={image} onAvatarChange={onAvatarChange} />

      {/* Name + handle. Pencil only materialises on group-hover of the row;
          nameAccessory slot stays visible regardless. */}
      <div className="group flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <h1 className="m-0 font-uikit-ui text-uikit-22 font-semibold text-uikit-ink tracking-uikit-tighter leading-[1.15] flex-1 min-w-0 break-words">
            {name}
          </h1>
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              aria-label="Edit profile"
              title="edit profile"
              className={cn(
                'flex-shrink-0 inline-flex items-center justify-center p-1 mt-0.5',
                'appearance-none bg-transparent border-0 cursor-pointer',
                'text-uikit-muted opacity-0 hover:text-uikit-ink',
                'group-hover:opacity-90 transition-[opacity,color] duration-120',
              )}
            >
              <Pencil size={14} />
            </button>
          )}
          {nameAccessory && (
            <div className="flex-shrink-0 mt-px inline-flex items-center">
              {nameAccessory}
            </div>
          )}
        </div>
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
