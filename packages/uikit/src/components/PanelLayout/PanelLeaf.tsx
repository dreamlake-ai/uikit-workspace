import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { cn } from '../../lib/utils'
import { tintFor, usePanelConfig } from './config'
import { tabDomId, tabPanelDomId } from './GroupTabBar'
import type { PanelBox } from './panel-box'
import type { LeafNode } from './panel-tree'

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="block w-[14px] h-[14px]"
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
)

function HeaderBtn({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-[6px] border-none cursor-pointer bg-transparent',
        'text-uikit-muted [transition:background_120ms_ease,color_120ms_ease] hover:bg-uikit-chip hover:text-uikit-ink',
        className
      )}
    >
      {children}
    </button>
  )
}

/**
 * PanelLeaf — one panel: a 26px header (drag handle · title/custom header · close)
 * over a body the host fills via `renderBody`.
 */
export function PanelLeaf({
  leaf,
  dragging,
  box,
  inGroup = false,
  tabRole = true,
  onFocus,
  onClose,
  onHandleDown,
}: {
  leaf: LeafNode
  dragging: boolean
  /** This panel's box in viewport coordinates, as CSS math (see panel-box.ts). */
  box: PanelBox
  /** True when this leaf is the visible tab of a group, which already renders a
   *  tab bar above it. */
  inGroup?: boolean
  tabRole?: boolean
  onFocus: () => void
  onClose: () => void
  onHandleDown: (e: ReactPointerEvent) => void
}) {
  const {
    tabbed,
    renderBody,
    renderHeader,
    leafClassName,
    headerClassName,
    headerContentClassName,
    contentColumnHeaderClass,
    closable,
    palette,
  } = usePanelConfig()

  const tint = tintFor(leaf.n, palette)
  // A panel the host will not let go of shows no close button. This is the
  // affordance half only: the refusal itself lives in one place, next to the
  // close handler, so a path that never touches a button (Delete on a tab) is
  // covered by the same rule — see ClosablePredicate.
  const canClose = closable?.(leaf) ?? true
  const customHeader = renderHeader?.(leaf)
  const [headerHovered, setHeaderHovered] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Publish this panel's geometry to CSS. Content that needs to position itself
  // against the VIEWPORT rather than against its panel — a centered column, an
  // eyebrow that must align with the body beneath it — reads `--panel-x` /
  // `--panel-w` instead of measuring. Because the values are one calc() chain
  // bottoming out in whatever the host's panel-area variables reference, they
  // stay correct through an animation without a single JS measurement. A leaf
  // may additionally cap its column via `contentMax`.
  const boxStyle = {
    '--panel-x': `calc(${box.x})`,
    '--panel-w': `calc(${box.w})`,
    ...(leaf.contentMax ? { '--content-max': `${leaf.contentMax}px` } : {}),
  } as CSSProperties

  // Inside a group the tab ALREADY carries this panel's title, its close button,
  // and its drag affordance, so a default header underneath would duplicate all
  // three — two close buttons for one panel. A CUSTOM header still renders: it
  // holds controls the tab cannot (a breadcrumb, a mode switch), which is a
  // deliberate choice by the host rather than redundancy.
  const showHeader = !inGroup || !!customHeader || tabbed

  // Only a leaf that opts in (a custom header AND a `contentMax`) gets the
  // host's centered-gutter header treatment; the rest keep a plain flush-left
  // header. With no `contentColumnHeaderClass` configured, every header is flush.
  const headerOnColumn = !!customHeader && !!leaf.contentMax && !!contentColumnHeaderClass

  // PORTAL SEAM: a host may render part of a panel's content through a REVERSE
  // PORTAL — DOM that lives inside this leaf but whose React fiber hangs
  // somewhere else entirely (a shared editor or composer that must survive being
  // moved between panels). React propagates events along the FIBER tree, so a
  // React `onPointerDown` on this root never sees such a child's events. A NATIVE
  // listener follows DOM bubbling instead, so clicking portaled content still
  // focuses this leaf. The React `onPointerDown` below stays for the ordinary
  // (fiber-descendant) case — `onFocus` is idempotent, so double-firing is fine.
  const onFocusRef = useRef(onFocus)
  onFocusRef.current = onFocus
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const handle = () => onFocusRef.current()
    el.addEventListener('pointerdown', handle)
    return () => el.removeEventListener('pointerdown', handle)
  }, [])

  return (
    <div
      ref={rootRef}
      data-leaf-id={leaf.id}
      // The other half of the tab relationship: a grouped panel IS the tabpanel
      // its tab controls, and takes its accessible name from that tab.
      {...(inGroup
        ? { id: tabPanelDomId(leaf.id), role: tabRole ? 'tabpanel' : 'region', 'aria-labelledby': tabDomId(leaf.id) }
        : {})}
      onPointerDown={onFocus}
      // OCCLUSION HYGIENE: `bg-uikit-bg` makes every panel opaque. On a flat
      // background that is pixel-identical to leaving it transparent, but it is
      // what lets a host stack this layout ON TOP of another surface (a second
      // shell held during a transition, say) without the layer beneath showing
      // through the panel chrome. A host that WANTS a particular panel to stay
      // transparent returns `bg-transparent` from `leafClassName` — tailwind-merge
      // resolves the conflict in the host's favour. Corner notches are accepted
      // residue: this fill is clipped by `rounded-[12px] overflow-hidden`.
      //
      // While this panel is the one being dragged, fade it — the floating
      // surrogate is the thing the eye should follow.
      className={cn(
        'relative flex flex-col w-full h-full min-w-0 min-h-0 rounded-[12px] overflow-hidden',
        'bg-uikit-bg border-none shadow-none [transition:opacity_120ms_ease]',
        dragging ? 'opacity-40' : 'opacity-100',
        leafClassName?.(leaf)
      )}
      style={boxStyle}
    >
      {showHeader && (
        <header
          onMouseEnter={() => setHeaderHovered(true)}
          onMouseLeave={() => setHeaderHovered(false)}
          className={cn(
            'uikit-panel-header relative flex items-center gap-[6px] h-[26px] shrink-0 select-none cursor-default pr-[6px] bg-uikit-bg',
            // When a panel opts into the centered content column, pad the left edge
            // to the SAME gutter the body uses, so header text lines up on the
            // x-axis with the content below even when side panels shift the column
            // off the panel's own center.
            headerOnColumn ? contentColumnHeaderClass : 'pl-[12px]',
            tabbed && inGroup ? 'h-[34px] pt-[8px] pl-[20px] pr-[20px]' : undefined,
            headerClassName?.(leaf)
          )}
        >
          {/* Centered grab handle — drag to dock. `data-dock-handle` gives a host's
            gesture guards a stable selector, so a horizontal DRAG of this handle
            can be told apart from a swipe on the panel body. */}
          {!(tabbed && inGroup) && <span
            onPointerDown={onHandleDown}
            data-dock-handle
            title="Drag to dock this panel beside another"
            className="absolute left-1/2 top-[2px] -translate-x-1/2 inline-flex items-center justify-center w-16 h-[10px] cursor-grab z-[1] touch-none"
          >
            <span
              className={cn(
                'w-7 h-[3px] rounded-full pointer-events-none [transition:opacity_280ms_ease,background_140ms_ease]',
                dragging
                  ? 'bg-uikit-handle-active opacity-100'
                  : cn('bg-uikit-handle', headerHovered ? 'opacity-60' : 'opacity-0')
              )}
            />
          </span>}
          {customHeader ? (
            // A custom header can pack many controls. Keep it in a constrained,
            // clipping flex row so a long header can never push the close button off
            // the right edge — it must always stay visible, exactly like the default
            // header below. `headerContentClassName` REPLACES the overflow policy
            // (rather than adding to it) for a header that must let something
            // escape vertically — a tab strip whose active tab notches the border,
            // for instance.
            <div
              data-panel-toolbar={tabbed && inGroup ? leaf.id : undefined}
              className={cn(
                tabbed && inGroup ? 'flex items-center gap-[6px] shrink-0 ml-auto min-w-0' : 'flex items-center gap-[6px] flex-1 min-w-0',
                headerContentClassName?.(leaf) ?? 'overflow-hidden'
              )}
            >
              {customHeader}
            </div>
          ) : !inGroup ? (
            <>
              {/* Runtime tint color stays inline. */}
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ background: tint }}
              />
              <span className="text-uikit-ink font-uikit-ui text-[12.5px] font-semibold tracking-[-0.005em] truncate flex-1 min-w-0">
                {leaf.title ?? `Panel ${leaf.n}`}
              </span>
            </>
          ) : null}
          {canClose && !inGroup && (
            <HeaderBtn label="Close panel" onClick={onClose} className="uikit-panel-header-close ml-auto shrink-0">
              <CloseIcon />
            </HeaderBtn>
          )}
        </header>
      )}

      {/* Body — the host's content, or a placeholder for an unfilled panel. */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {renderBody ? (
          renderBody(leaf)
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 p-4">
            {/* Runtime tint color stays inline. */}
            <span
              className="font-uikit-mono text-[26px] font-bold tracking-[-0.02em]"
              style={{ color: tint }}
            >
              {leaf.n}
            </span>
            <span className="text-uikit-muted font-uikit-ui text-[12.5px]">Placeholder panel</span>
            <span className="text-uikit-muted font-uikit-mono text-[10px] opacity-70 tracking-[0.02em] text-center">
              ⌘D split → · ⌘⇧D split ↓
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export { CloseIcon }
