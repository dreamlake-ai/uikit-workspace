import {
  type ComponentProps,
  type ReactNode,
  createContext,
  useContext,
  useState,
} from 'react'
import { cn } from '../../lib/utils'

export interface AvatarProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** Display name. Initials are derived automatically (first letter of the
   *  first two whitespace-separated words). Used by the simple `name`/`image`
   *  form; optional when composing with `<AvatarImage>` / `<AvatarFallback>`. */
  name?: string
  /** Avatar image URL. Falls back to initials when absent or it fails to load. */
  image?: string
  /** Avatar size in px. Default 32 for the simple form, 24 for the composed form. */
  size?: number
  /** Border radius in px. Default 3 (rounded-square) for the simple form; the
   *  composed form is a circle unless you pass a value. */
  radius?: number
  /** Composed form: `<AvatarImage>` + `<AvatarFallback>` children (drop-in with
   *  the legacy Radix-based Avatar). When omitted, the simple `name`/`image`
   *  form renders instead. */
  children?: ReactNode
  className?: string
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type ImageStatus = 'idle' | 'loaded' | 'error'
const AvatarContext = createContext<{
  status: ImageStatus
  setStatus: (s: ImageStatus) => void
} | null>(null)

/**
 * User avatar.
 *
 * Two interchangeable forms:
 * - **Simple** — `<Avatar name="Ada Lovelace" image="…" />`. Derives initials,
 *   falls back to them when the image is missing or fails.
 * - **Composed** — `<Avatar><AvatarImage src="…" /><AvatarFallback>AL</AvatarFallback></Avatar>`.
 *   A drop-in for the legacy `@vuer-ai/vuer-uikit` Avatar (which wrapped Radix);
 *   reimplemented with a tiny load-status context instead of a Radix dependency.
 */
export function Avatar({
  name,
  image,
  size,
  radius,
  className,
  children,
  style,
  ...rest
}: AvatarProps) {
  // Declared unconditionally (Rules of Hooks). Only used by the simple form.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  // Composed form: render children and coordinate image/fallback via context.
  if (children !== undefined) {
    const px = size ?? 24
    return (
      <AvatarComposed
        size={px}
        radius={radius}
        className={className}
        style={style}
        {...rest}
      >
        {children}
      </AvatarComposed>
    )
  }

  // Simple form (unchanged behavior): initials with optional image.
  const px = size ?? 32
  const showImage = !!image && failedSrc !== image
  const label = name ?? ''

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 select-none overflow-hidden',
        !showImage &&
          'text-uikit-ink font-uikit-ui font-semibold leading-none tracking-uikit-tighter opacity-90',
        className,
      )}
      style={{
        width: px,
        height: px,
        borderRadius: radius ?? 3,
        fontSize: Math.round(px * 0.36),
        background: showImage ? undefined : 'color-mix(in oklab, var(--ink) 8%, var(--bg))',
        ...style,
      }}
      {...rest}
    >
      {showImage ? (
        <img
          src={image}
          alt={label}
          className="w-full h-full object-cover"
          onError={() => setFailedSrc(image!)}
        />
      ) : (
        getInitials(label)
      )}
    </span>
  )
}

function AvatarComposed({
  size,
  radius,
  className,
  style,
  children,
  ...rest
}: { size: number; radius?: number } & ComponentProps<'span'>) {
  const [status, setStatus] = useState<ImageStatus>('idle')
  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <span
        data-slot="avatar"
        className={cn('relative flex shrink-0 overflow-hidden', className)}
        style={{
          width: size,
          height: size,
          borderRadius: radius ?? 9999,
          ...style,
        }}
        {...rest}
      >
        {children}
      </span>
    </AvatarContext.Provider>
  )
}

export type AvatarImageProps = ComponentProps<'img'>

/** Image for the composed `<Avatar>`. Hidden until it loads; on error the
 *  surrounding `<AvatarFallback>` takes over. */
export function AvatarImage({ className, onLoad, onError, ...props }: AvatarImageProps) {
  const ctx = useContext(AvatarContext)
  return (
    <img
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      style={{ display: ctx?.status === 'loaded' ? undefined : 'none' }}
      onLoad={(e) => {
        ctx?.setStatus('loaded')
        onLoad?.(e)
      }}
      onError={(e) => {
        ctx?.setStatus('error')
        onError?.(e)
      }}
      {...props}
    />
  )
}

export type AvatarFallbackProps = ComponentProps<'span'>

/** Fallback (usually initials) for the composed `<Avatar>`. Shown until the
 *  image loads. */
export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  const ctx = useContext(AvatarContext)
  if (ctx?.status === 'loaded') return null
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-[inherit]',
        'bg-uikit-chip text-uikit-ink text-uikit-11 font-medium select-none',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
