import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { pages } from '../lib/navigation'
import { siteConfig } from '../site.config'
import { useMediaQuery } from '../lib/use-media-query'
import { useHiddenToggle } from '../lib/use-hidden-toggle'
import { ThemeToggle } from './ThemeToggle'
import { VersionBadge } from './VersionBadge'
import { useMerge } from '../renderer/Layout'

/**
 * Tiny chip that shows up only when the hidden-pages reveal toggle
 * (Cmd+Shift+D) is active. Clicking it turns the toggle back off.
 * Stays out of sight when the toggle is off.
 */
function HiddenRevealChip() {
  const [show, setShow] = useHiddenToggle()
  if (!show) return null
  return (
    <button
      type="button"
      onClick={() => setShow(false)}
      aria-label="Dev mode on — hidden pages are visible. Click to hide again."
      title="Dev mode on — hidden pages are visible (Cmd+Shift+D to toggle)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: 'var(--font-doc-template-mono)',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.08em',
        padding: '3px 7px',
        borderRadius: 4,
        color: 'var(--color-doc-template-warn)',
        background: 'var(--color-doc-template-warn-soft)',
        border:
          '1px solid color-mix(in srgb, var(--color-doc-template-warn) 35%, transparent)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Open lock — dev mode has unlocked the hidden pages. */}
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.5-1.2" />
      </svg>
      DEV
    </button>
  )
}

interface TopbarProps {
  searchOpen: boolean
  onOpenSearch: () => void
  onCloseSearch: () => void
  query: string
  setQuery: (q: string) => void
}

const SPRING = 'cubic-bezier(0.4, 0.7, 0.3, 1)'

/** Easing curve for the search-field expand animation. easeOutExpo-ish —
 *  fast launch, very gentle settle. Symmetric ease-in-out felt stiff
 *  against the design's perceived motion. */
const EXPAND_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EXPAND_MS = 320

/** Geometry: the search field is always position:fixed (in both closed and
 *  open states). Closed = anchored at right:240px (the right sidebar
 *  width) with width:320px, so width + right both animate cleanly when
 *  the palette opens. Open = anchored at the content column inset and
 *  spanning the full content column. */
const CLOSED_RIGHT = 240
const CLOSED_WIDTH = 320
const SEARCH_MAX_W = 860
const SEARCH_GUTTER = 24
const SEARCH_INSET = `max(${SEARCH_GUTTER}px, calc((100vw - ${SEARCH_MAX_W}px) / 2))`

export function Topbar({ searchOpen, onOpenSearch, onCloseSearch, query, setQuery }: TopbarProps) {
  const { urlPathname } = usePageContext() as { urlPathname: string }
  const current = pages.find(p => p.path === urlPathname)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const focusTimerRef = useRef<number | null>(null)
  const [isMac, setIsMac] = useState(false)
  const merged = useMerge()
  // <768px: sidebar gone, topbar collapses to auto/1fr/auto, search becomes
  // in-grid rather than position:fixed (fixed-right:240 would land off-screen).
  const isMobile = useMediaQuery('(max-width: 767px)')
  const hasRightTOC = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        onOpenSearch()
      } else if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        inputRef.current?.focus()
        onOpenSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMac, onOpenSearch])

  function clearFocusTimer() {
    if (focusTimerRef.current !== null) {
      window.clearTimeout(focusTimerRef.current)
      focusTimerRef.current = null
    }
  }

  function onInputFocus() {
    if (searchOpen) return
    clearFocusTimer()
    // Pure focus opens the palette only after a 1 s hold — matches
    // docs.html lines 1895–1922. A keystroke before that triggers
    // open immediately (see onInputChange).
    focusTimerRef.current = window.setTimeout(() => {
      if (document.activeElement === inputRef.current) onOpenSearch()
      focusTimerRef.current = null
    }, 1000)
  }

  function onInputBlur() {
    clearFocusTimer()
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    if (!searchOpen) {
      clearFocusTimer()
      onOpenSearch()
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && searchOpen) {
      e.preventDefault()
      onCloseSearch()
      inputRef.current?.blur()
    }
  }

  // Brand-cluster pieces (`/`, `docs`, ver chip) collapse to width 0 when
  // merged — same effect as the docs.html `body.is-merged .doc-brand .ver`
  // rule, just expressed as an inline style we toggle on the merge state.
  const collapsedStyle = (collapsed: boolean): CSSProperties => ({
    transition: `opacity 0.25s ease, transform 0.25s ${SPRING}, width 0.25s ${SPRING}, margin 0.25s ${SPRING}, padding 0.25s ${SPRING}`,
    ...(collapsed
      ? {
          opacity: 0,
          transform: 'translateX(-4px)',
          pointerEvents: 'none',
          width: 0,
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        }
      : {}),
  })

  // Brand / topcrumbs / topnav-actions all fade out while the palette is
  // open (docs.html lines 858–863). Override the merge-driven crumb visibility
  // when the palette is open — the crumb layer should hide along with the rest.
  const palFade = (hidden: boolean): CSSProperties => ({
    opacity: hidden ? 0 : 1,
    pointerEvents: hidden ? 'none' : 'auto',
    transition: 'opacity 0.25s ease',
  })

  // Search field positioning differs between desktop and mobile.
  //
  // Desktop (≥md): position:fixed in *both* states. Closed: right:240 /
  // width:320 (matches the topbar grid's column-2 right edge). Open:
  // right:EXPANDED_RIGHT / width:EXPANDED_WIDTH. Width AND right are
  // animated together — smooth even on >1320px viewports.
  //
  // Mobile (<md): closed = in-flow inside grid col 2 (justifySelf:stretch,
  // width:100%, max:220px). Open = position:fixed across the viewport
  // minus a 12px gutter per side. Switching out of fixed snaps; that's
  // the same trade-off the desktop path already accepts.
  const searchStyle: CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 6,
        left: searchOpen ? 12 : 96,
        right: searchOpen ? 12 : 128,
        height: 28,
        padding: '6px 10px',
        borderRadius: 12,
        zIndex: 71,
        boxShadow: searchOpen ? '0 4px 14px rgb(0 0 0 / 0.06)' : 'none',
        transition: `left ${EXPAND_MS}ms ${EXPAND_EASE}, right ${EXPAND_MS}ms ${EXPAND_EASE}, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease`,
      }
    : searchOpen
      ? {
          position: 'fixed',
          top: 6,
          left: SEARCH_INSET,
          right: SEARCH_INSET,
          height: 28,
          padding: '6px 10px',
          borderRadius: 12,
          zIndex: 71,
          boxShadow: '0 4px 14px rgb(0 0 0 / 0.06)',
          transition: `left ${EXPAND_MS}ms ${EXPAND_EASE}, right ${EXPAND_MS}ms ${EXPAND_EASE}, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease`,
        }
      : {
          gridColumn: 2,
          gridRow: 1,
          justifySelf: 'end',
          width: '100%',
          maxWidth: CLOSED_WIDTH,
          height: 28,
          padding: '6px 10px',
          borderRadius: 12,
          marginRight: 8,
          transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        }

  return (
    <header
      // The bottom divider is a box-shadow rather than `border-b` so it
      // sits *outside* the 40px box. With border-box sizing, a `border-b`
      // eats 1px from the inside (visible area becomes 39, throws off
      // vertical centering of the fixed-position search field by 0.5px).
      // Box-shadow draws the line at y=40 → y=41 — outside the height
      // budget; the sidebar's `top: 40` still sits flush against it.
      className="sticky top-0 z-50 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center w-full m-0 py-1"
      style={{
        height: 40,
        // Backdrop blur creates a stacking context; we keep it ON when
        // closed (frosted topbar look) and turn it OFF while the palette
        // is open so the now-transparent topbar doesn't blur the
        // dropdown sitting just below it.
        backdropFilter: searchOpen ? 'none' : 'saturate(140%) blur(8px)',
        WebkitBackdropFilter: searchOpen ? 'none' : 'saturate(140%) blur(8px)',
        background: searchOpen ? 'transparent' : 'var(--color-doc-template-bg)',
        boxShadow: searchOpen ? 'none' : '0 1px 0 var(--color-doc-template-faint)',
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <a
        href="/"
        className="flex items-center gap-2.5 pl-[14px] md:pl-[18px] no-underline text-doc-template-ink hover:opacity-80 min-w-[72px] shrink-0"
        style={{
          fontFamily: 'var(--font-doc-template-ui)',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          transition: 'opacity 0.15s ease, color 0.25s ease',
          ...palFade(searchOpen),
        }}
      >
        <span>
          {siteConfig.brand}
          <span
            aria-hidden
            className="text-doc-template-accent"
            style={{ fontWeight: 700, fontSize: '1.4em', lineHeight: 0, marginLeft: 1, verticalAlign: 'baseline' }}
          >
            .
          </span>
        </span>
        <span
          className="hidden md:inline text-doc-template-muted"
          style={{ fontWeight: 400, opacity: 0.55, marginLeft: -4, marginRight: -4, ...collapsedStyle(merged) }}
        >
          /
        </span>
        <span
          className="hidden md:inline text-doc-template-muted"
          style={{ fontWeight: 500, letterSpacing: '-0.01em', ...collapsedStyle(merged) }}
        >
          {siteConfig.subtitle}
        </span>
        <VersionBadge repoUrl={siteConfig.repoUrl} />
      </a>

      {/* Topbar breadcrumb — fades in when scrolled past <h1>; fades out
          again while the search palette is open (matches docs.html).
          Hidden below md: its `left: calc(...)` formula falls off-screen
          on narrow viewports, and the page-top breadcrumb above <h1> is
          still visible on mobile. */}
      {current && (
        <nav
          aria-label="Breadcrumb"
          className="hidden md:flex items-center gap-1.5 text-doc-template-muted uppercase pointer-events-none overflow-hidden"
          style={{
            gridColumn: 2,
            gridRow: 1,
            justifySelf: 'start',
            marginLeft: 8,
            fontFamily: 'var(--font-doc-template-mono)',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            opacity: searchOpen ? 0 : merged ? 1 : 0,
            transform: merged && !searchOpen ? 'translateY(0)' : 'translateY(6px)',
            transition: `opacity 0.25s ease, transform 0.25s ${SPRING}`,
          }}
        >
          {siteConfig.breadcrumbRoot && (
            <>
              <span>{siteConfig.breadcrumbRoot}</span>
              <span style={{ opacity: 0.5 }}>/</span>
            </>
          )}
          {current.section && (
            <>
              <span>{current.section}</span>
              <span style={{ opacity: 0.5 }}>/</span>
            </>
          )}
          <span className="text-doc-template-ink">{current.title}</span>
        </nav>
      )}

      <label
        htmlFor="doc-search-input"
        // While the palette is open, drop the focus-within accent border —
        // the dropdown is the visual cue, an outline on the input itself
        // is redundant and noisy.
        className={
          searchOpen
            ? 'flex items-center gap-2 max-w-full bg-doc-template-search border border-doc-template-faint cursor-text'
            : 'flex items-center gap-2 max-w-full bg-doc-template-search border border-transparent focus-within:border-doc-template-accent/50 cursor-text'
        }
        style={searchStyle}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="text-doc-template-muted shrink-0"
          style={{ width: 14, height: 14 }}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          id="doc-search-input"
          type="text"
          placeholder="Search docs…"
          autoComplete="off"
          value={query}
          onChange={onInputChange}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          onKeyDown={onInputKeyDown}
          className="flex-1 appearance-none border-0 outline-0 bg-transparent text-doc-template-ink min-w-0 placeholder:text-doc-template-muted placeholder:opacity-70"
          style={{
            fontFamily: 'var(--font-doc-template-ui)',
            fontSize: 13,
            letterSpacing: '-0.005em',
          }}
        />
        <span
          className="font-medium text-doc-template-muted border border-doc-template-faint bg-doc-template-bg"
          style={{
            fontFamily: 'var(--font-doc-template-mono)',
            fontSize: 10,
            opacity: 0.8,
            padding: '1px 5px',
            borderRadius: 4,
          }}
        >
          {isMac ? '⌘K' : 'Ctrl K'}
        </span>
      </label>

      <div
        className="flex items-center gap-3.5 pr-[14px] md:pr-[22px]"
        // gridColumn:3 is explicit because the search label is now always
        // position:fixed (on desktop) and so doesn't occupy a grid cell —
        // without this, the right cluster auto-places into column 2 and
        // gets covered by the fixed search input.
        style={{ gridColumn: 3, gridRow: 1, justifySelf: 'end', ...palFade(searchOpen) }}
      >
        {siteConfig.repoUrl && (
          <a
            href={siteConfig.repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="font-medium text-doc-template-muted no-underline inline-flex items-center justify-center hover:text-doc-template-ink"
            style={{
              fontFamily: 'var(--font-doc-template-ui)',
              fontSize: 12.5,
              lineHeight: 1,
              letterSpacing: '-0.005em',
              transition: 'color 0.15s ease',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
              style={{ display: 'block' }}
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 015.78 0c2.2-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
            </svg>
          </a>
        )}
        <HiddenRevealChip />
        <ThemeToggle />
      </div>
    </header>
  )
}
