import type { CSSProperties } from 'react'

/**
 * Two-chip version badge:
 *
 *   ┌───────────┬─────────────┐
 *   │ v0.1.3    │ ⎇ a1b2c3    │
 *   └───────────┴─────────────┘
 *     ↑ v/<v>      ↑ commit
 *     branch
 *
 * Pure presentational component. Version and git hash come from Vite
 * `define` (see `vite.config.ts`); both chips link into the same
 * GitHub repo:
 * - left chip → `${repoUrl}/tree/v/${__APP_VERSION__}` (the snapshot
 *   branch `pnpm run deploy` force-pushes on each release)
 * - right chip → `${repoUrl}/commit/${__GIT_HASH__}` (the build-time
 *   HEAD)
 *
 * Layout concerns (responsive show/hide, margin from neighbors,
 * collapse animation when the topbar merges) are the parent's
 * responsibility — the badge intentionally knows nothing about its
 * surroundings. When `repoUrl` is empty/undefined the chips degrade to
 * plain `<span>`s with identical styling.
 */
interface VersionBadgeProps {
  /** GitHub repo URL (e.g. `https://github.com/dreamlake-ai/uikit-workspace`).
   *  Both chips link into this repo (`tree/v/<version>` and
   *  `commit/<hash>`). Empty/undefined → plain text on both chips. */
  repoUrl?: string
}

const versionChipClass = 'inline-flex items-center text-doc-template-ink no-underline'
const versionChipStyle: CSSProperties = {
  padding: '2px 6px',
  background: 'color-mix(in srgb, var(--color-doc-template-ink) 5%, var(--color-doc-template-bg))',
  fontWeight: 600,
  borderTopLeftRadius: 3,
  borderBottomLeftRadius: 3,
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
  const versionUrl = repoUrl ? `${repoUrl}/tree/v/${__APP_VERSION__}` : null
  const commitUrl = repoUrl ? `${repoUrl}/commit/${__GIT_HASH__}` : null
  const versionTitle = `Release branch v/${__APP_VERSION__}`
  const hashTitle = `Commit ${__GIT_HASH__}`

  return (
    <span
      className="inline-flex items-stretch border border-doc-template-faint"
      style={{
        fontFamily: 'var(--font-doc-template-mono)',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.02em',
        borderRadius: 4,
      }}
    >
      {versionUrl ? (
        <a
          href={versionUrl}
          target="_blank"
          rel="noreferrer"
          title={versionTitle}
          className={versionChipClass}
          style={versionChipStyle}
        >
          v{__APP_VERSION__}
        </a>
      ) : (
        <span className={versionChipClass} style={versionChipStyle} title={versionTitle}>
          v{__APP_VERSION__}
        </span>
      )}
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
    </span>
  )
}
