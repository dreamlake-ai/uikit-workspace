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
 * tokens (accent name chip + neutral version chip) and pointed at the
 * DreamLake npm/GitHub. Fully prop-driven.
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
      className={cn('inline-flex items-center font-uikit-mono text-uikit-10 leading-none', className)}
      style={linkable ? { cursor: 'pointer' } : undefined}
    >
      {(packageName || versionText) && (
        <span className="inline-flex items-center overflow-hidden rounded-[4px]">
          {packageName && (
            <span className="px-1.5 py-0.5 bg-uikit-accent text-white">{packageName}</span>
          )}
          {versionText && (
            <a
              href={linkable ? npmUrl : undefined}
              onClick={blockLink}
              className={cn(
                'px-1.5 py-0.5 bg-uikit-chip text-uikit-ink no-underline',
                linkable && 'hover:text-uikit-accent',
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
