import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { siteConfig } from '../site.config'

/**
 * Two-chip version badge with a version-switcher dropdown:
 *
 *   ┌───────────┬─────────────┐
 *   │ v0.1.3 ▾  │ ⎇ a1b2c3    │
 *   └───────────┴─────────────┘
 *     ↑ opens      ↑ commit
 *     popover
 *
 * The left chip is a button that opens a popover listing every
 * versioned docs deployment, sourced from a `versions.json` manifest
 * (schema: `{ current, aliases, versions: [{version, url, date}] }`,
 * maintained by `scripts/set-version.mjs`). The manifest is fetched
 * from the production origin first so the dropdown on old, immutable
 * `v/*` deploys still lists versions released after they were built;
 * the same-origin copy is the fallback for local dev.
 *
 * The displayed version is the build-time `__APP_VERSION__` (from
 * `packages/uikit/package.json` via Vite `define`) — each `v/*`
 * branch commits its own version, so every deploy bakes the right
 * number and no hostname sniffing is needed.
 *
 * The right chip links to the build-time HEAD commit
 * (`${repoUrl}/commit/${__GIT_HASH__}`); the GitHub link for the
 * `v/<version>` snapshot branch lives at the bottom of the popover.
 *
 * Layout concerns (responsive show/hide, margin from neighbors,
 * collapse animation when the topbar merges) are the parent's
 * responsibility. NOTE: the badge contains a <button>, so it must be
 * rendered as a *sibling* of the brand's `<a href="/">`, never inside
 * it — nesting is invalid HTML and makes chip clicks navigate home.
 */
interface VersionBadgeProps {
  /** GitHub repo URL (e.g. `https://github.com/dreamlake-ai/uikit-workspace`).
   *  Used for the commit link on the hash chip and the snapshot-branch
   *  link in the popover. Empty/undefined → hash chip degrades to a
   *  plain `<span>` and the popover omits the GitHub entry. */
  repoUrl?: string
}

interface VersionEntry {
  version: string
  url: string
  date?: string
}
interface VersionManifest {
  current?: string
  aliases?: Record<string, string>
  versions?: VersionEntry[]
}

const versionChipClass =
  'inline-flex items-center text-doc-template-ink hover:bg-doc-template-search'
const versionChipStyle: CSSProperties = {
  padding: '2px 6px',
  background: 'color-mix(in srgb, var(--color-doc-template-ink) 5%, var(--color-doc-template-bg))',
  fontWeight: 600,
  borderTopLeftRadius: 3,
  borderBottomLeftRadius: 3,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  border: 0,
  position: 'relative',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  letterSpacing: 'inherit',
  cursor: 'pointer',
}

const hashChipClass =
  'inline-flex items-center text-doc-template-muted border-l border-doc-template-faint no-underline'
const hashChipStyle: CSSProperties = {
  gap: 5,
  padding: '2px 7px',
  borderTopRightRadius: 3,
  borderBottomRightRadius: 3,
}

function GitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ width: 9, height: 9, opacity: 0.8, flexShrink: 0 }}
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 9v6" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  )
}

export function VersionBadge({ repoUrl }: VersionBadgeProps) {
  const [open, setOpen] = useState(false)
  const [manifest, setManifest] = useState<VersionManifest | null>(null)
  const wrapperRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    let cancelled = false
    // Production origin first (keeps old deploys' lists fresh — needs
    // the CORS header in netlify.toml), same-origin as fallback.
    fetch(`${siteConfig.url}/versions.json`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .catch(() => fetch('/versions.json').then(r => (r.ok ? r.json() : null)))
      .then(m => { if (!cancelled && m) setManifest(m) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const commitUrl = repoUrl ? `${repoUrl}/commit/${__GIT_HASH__}` : null
  const branchUrl = repoUrl ? `${repoUrl}/tree/v/${__APP_VERSION__}` : null
  const hashTitle = `Commit ${__GIT_HASH__}`

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex items-stretch border border-doc-template-faint"
      style={{
        fontFamily: 'var(--font-doc-template-mono)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.02em',
        borderRadius: 4,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          // Self-contained toggle. The badge sits OUTSIDE the brand
          // <a href="/"> (see the brand cluster in Topbar), so a click
          // no longer navigates home; stopPropagation is
          // belt-and-suspenders.
          e.preventDefault()
          e.stopPropagation()
          setOpen(o => !o)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Switch docs version (current v${__APP_VERSION__})`}
        className={versionChipClass}
        style={versionChipStyle}
      >
        v{__APP_VERSION__}
        <svg
          width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          style={{
            opacity: 0.65,
            transform: open ? 'scaleY(-1)' : 'none',
            transition: 'transform 0.25s ease',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        {/* Wedge — anchored to the *button* so it stays under the
            chevron; the popover left-aligns to the whole badge and is
            wider. Painted above the popover (z 81 > 80) so it masks
            the panel's top border in the arrow's column. */}
        {open && manifest && (
          <svg
            width="14"
            height="11"
            viewBox="0 0 14 11"
            aria-hidden
            style={{
              position: 'absolute',
              top: 'calc(100% + 5.5px)',
              right: 4,
              zIndex: 81,
              display: 'block',
              pointerEvents: 'none',
              animation: 'popover-wedge-in 0.24s ease both',
            }}
          >
            <path d="M0 11 L7 1 L14 11" stroke="var(--color-doc-template-faint)" strokeWidth="1" fill="none" />
            <path d="M1 11 L7 2 L13 11 Z" fill="var(--color-doc-template-bg)" />
          </svg>
        )}
      </button>
      {commitUrl ? (
        <a
          href={commitUrl}
          target="_blank"
          rel="noreferrer"
          title={hashTitle}
          className={hashChipClass}
          style={hashChipStyle}
        >
          <GitIcon />
          {__GIT_HASH__}
        </a>
      ) : (
        <span className={hashChipClass} style={hashChipStyle} title={hashTitle}>
          <GitIcon />
          {__GIT_HASH__}
        </span>
      )}

      {open && manifest && (() => {
        const aliasEntries = manifest.aliases ? Object.entries(manifest.aliases) : []
        const versionEntries = manifest.versions ?? []
        // Stagger schedule: wedge first, then the popover, then each
        // entry. Step per entry is small enough to feel like a quick
        // cascade rather than a list of independent fades.
        const ENTRY_STEP = 0.03
        const ENTRY_BASE = 0.13
        let idx = 0
        return (
          <div
            role="listbox"
            aria-label="Docs versions"
            className="absolute border border-doc-template-faint bg-doc-template-bg"
            style={{
              top: 'calc(100% + 14px)',
              left: 0,
              minWidth: 220,
              maxHeight: 'min(360px, 60vh)',
              overflowY: 'auto',
              borderRadius: 12,
              boxShadow: '0 6px 24px rgb(0 0 0 / 0.10)',
              padding: 4,
              zIndex: 80,
              fontFamily: 'var(--font-doc-template-mono)',
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: 'normal',
              animation: 'popover-in 0.28s ease both',
              animationDelay: '0.04s',
              transformOrigin: 'top left',
            }}
          >
            {aliasEntries.length > 0 && (
              <div
                style={{
                  padding: '4px 6px 2px', opacity: 0.55, fontSize: 9,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  animation: 'popover-entry-in 0.28s ease both',
                  animationDelay: `${ENTRY_BASE + idx++ * ENTRY_STEP}s`,
                }}
              >
                Aliases
              </div>
            )}
            {aliasEntries.map(([name, url]) => (
              <a
                key={`alias-${name}`}
                href={url}
                className="block text-doc-template-ink no-underline hover:bg-doc-template-search"
                style={{
                  padding: '5px 8px', borderRadius: 8,
                  animation: 'popover-entry-in 0.28s ease both',
                  animationDelay: `${ENTRY_BASE + idx++ * ENTRY_STEP}s`,
                }}
              >
                {name}
                {name === 'latest' && manifest.current && (
                  <span style={{ opacity: 0.5, marginLeft: 6 }}>v{manifest.current}</span>
                )}
              </a>
            ))}
            {versionEntries.length > 0 && (
              <div
                style={{
                  padding: '6px 6px 2px', opacity: 0.55, fontSize: 9,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  animation: 'popover-entry-in 0.28s ease both',
                  animationDelay: `${ENTRY_BASE + idx++ * ENTRY_STEP}s`,
                }}
              >
                Versions
              </div>
            )}
            {versionEntries.map(v => {
              const isCurrent = v.version === __APP_VERSION__
              return (
                <a
                  key={v.version}
                  href={v.url}
                  className="text-doc-template-ink no-underline hover:bg-doc-template-search flex items-baseline justify-between gap-3"
                  style={{
                    padding: '5px 8px',
                    borderRadius: 8,
                    fontWeight: isCurrent ? 700 : 400,
                    background: isCurrent
                      ? 'color-mix(in srgb, var(--color-doc-template-accent) 12%, transparent)'
                      : undefined,
                    animation: 'popover-entry-in 0.28s ease both',
                    animationDelay: `${ENTRY_BASE + idx++ * ENTRY_STEP}s`,
                  }}
                >
                  <span>
                    v{v.version}
                    {isCurrent && <span style={{ opacity: 0.55, marginLeft: 6 }}>current</span>}
                  </span>
                  {v.date && (
                    <span style={{ opacity: 0.5, fontVariantNumeric: 'tabular-nums', fontSize: 10 }}>
                      {v.date}
                    </span>
                  )}
                </a>
              )
            })}
            {branchUrl && (
              <a
                href={branchUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-doc-template-muted no-underline hover:bg-doc-template-search border-t border-doc-template-faint"
                style={{
                  padding: '5px 8px', borderRadius: 8, marginTop: 4,
                  borderTopLeftRadius: 0, borderTopRightRadius: 0,
                  animation: 'popover-entry-in 0.28s ease both',
                  animationDelay: `${ENTRY_BASE + idx++ * ENTRY_STEP}s`,
                }}
              >
                Branch v/{__APP_VERSION__} on GitHub ↗
              </a>
            )}
          </div>
        )
      })()}
    </span>
  )
}
