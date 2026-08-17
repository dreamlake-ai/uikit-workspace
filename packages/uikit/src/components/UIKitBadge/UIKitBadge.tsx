import { type MouseEvent } from 'react'
import { cn } from '../../lib/utils'

// Injected by tsup `define` in the published bundle; undefined when the kit is
// consumed from source (workspace/dev), where we fall back gracefully.
declare const __UIKIT_NAME__: string
declare const __UIKIT_VERSION__: string

export const PACKAGE_NAME = typeof __UIKIT_NAME__ !== 'undefined' ? __UIKIT_NAME__ : '@dreamlake/uikit'
export const PACKAGE_VERSION = typeof __UIKIT_VERSION__ !== 'undefined' ? __UIKIT_VERSION__ : 'dev'
/** No build-time git hash is injected; kept for drop-in parity. */
export const GIT_HASH = 'unknown'

const GITHUB_REPO = 'https://github.com/dreamlake-ai/uikit-workspace'

export interface PackageBadgeProps {
  className?: string
  /** Short package label shown in the accent chip (e.g. "uikit"). */
  packageName?: string
  /** Full npm name, used to build the version link (e.g. "@dreamlake/uikit"). */
  packageFullName?: string
  /** Version string (e.g. "v0.1.6" or "0.1.6"). */
  versionText?: string
  /** Whether the chips link out to npm/GitHub. */
  linkable?: boolean
  /** Git hash chip. Hidden when absent or "unknown". */
  gitHash?: string
}

/**
 * Low-level package chip: `[ name | version ] ⎇ hash`.
 *
 * Ported from the legacy `@vuer-ai/vuer-uikit` badge, restyled to DreamLake
 * tokens — a hairline-outlined shell with a muted name segment and a faintly
 * tinted version segment, matching the docs topbar version chip. Neutral by
 * design: no accent fill, so the badge stays quiet next to real status colour.
 * Pointed at the DreamLake npm/GitHub. Fully prop-driven.
 */
export function PackageBadge({
  className,
  packageName,
  packageFullName,
  versionText,
  linkable = true,
  gitHash,
}: PackageBadgeProps) {
  const npmUrl =
    packageFullName && versionText
      ? `https://www.npmjs.com/package/${packageFullName}/v/${versionText.replace('v', '')}`
      : undefined
  const blockLink = (e: MouseEvent) => {
    if (!linkable) e.preventDefault()
  }

  return (
    <span
      className={cn(
        // 15px leading (not `leading-none`) is what gives the chip its vertical
        // breathing room — the 2px block padding alone reads cramped.
        'inline-flex items-center font-uikit-mono text-uikit-10 leading-[15px] font-medium tracking-[0.02em]',
        className,
      )}
      style={linkable ? { cursor: 'pointer' } : undefined}
    >
      {(packageName || versionText) && (
        // Outlined shell: one hairline frame holds both segments, so colour is
        // never load-bearing. Inner radii are 3px against the 4px outer radius —
        // the border's 1px of inset, which `overflow-hidden` cannot express once
        // the frame is drawn on this element.
        <span className="inline-flex items-stretch rounded-[4px] border border-uikit-faint">
          {packageName && (
            <span className="px-1.5 py-0.5 rounded-l-[3px] font-semibold text-uikit-muted">
              {packageName}
            </span>
          )}
          {versionText && (
            <a
              href={linkable ? npmUrl : undefined}
              onClick={blockLink}
              className={cn(
                'px-1.5 py-0.5 rounded-r-[3px] font-semibold bg-uikit-ink-5-solid text-uikit-ink no-underline',
                // A hairline, not a colour change, splits the segments — and only
                // when there is a name segment to split from.
                packageName && 'border-l border-uikit-faint',
                linkable && 'hover:bg-uikit-search',
              )}
            >
              {versionText}
            </a>
          )}
        </span>
      )}
      {gitHash && gitHash !== 'unknown' && (
        <a
          href={linkable ? `${GITHUB_REPO}/commit/${gitHash}` : undefined}
          onClick={blockLink}
          className="ml-1 px-1 py-0.5 text-uikit-muted no-underline hover:text-uikit-ink"
        >
          ⎇ {gitHash}
        </a>
      )}
    </span>
  )
}

export interface UIKitBadgeProps {
  className?: string
  /** Show the short package name chip. */
  package?: boolean
  /** Prefix the version with "v". */
  prefix?: boolean
  /** Make the chips link out to npm/GitHub. */
  linkable?: boolean
  /** Show the version chip. */
  version?: boolean
  /** Show the git-hash chip. */
  hash?: boolean
}

/**
 * High-level version badge for `@dreamlake/uikit`. Reads the package
 * name/version injected at build time. Drop-in for the legacy `UIKitBadge`.
 */
export function UIKitBadge({
  className,
  package: showPackage = false,
  prefix = false,
  linkable = false,
  version = false,
  hash = false,
}: UIKitBadgeProps) {
  const shortName = PACKAGE_NAME.split('/').pop() || PACKAGE_NAME
  const versionText = version ? (prefix ? `v${PACKAGE_VERSION}` : PACKAGE_VERSION) : undefined

  return (
    <PackageBadge
      className={className}
      packageName={showPackage ? shortName : undefined}
      packageFullName={PACKAGE_NAME}
      versionText={versionText}
      linkable={linkable}
      gitHash={hash ? GIT_HASH : undefined}
    />
  )
}
