import {
  type ComponentProps,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { Pencil } from "lucide-react";
import { cn } from "../../lib/utils";

export interface AvatarProps extends Omit<ComponentProps<"span">, "children"> {
  /** Display name. Initials are derived automatically (first letter of the
   *  first two whitespace-separated words). Used by the simple `name`/`image`
   *  form; optional when composing with `<AvatarImage>` / `<AvatarFallback>`. */
  name?: string;
  /** Avatar image URL. Falls back to initials when absent or it fails to load. */
  image?: string;
  /** Avatar size in px. Default 32 for the simple form, 24 for the composed form. */
  size?: number;
  /** Border radius in px. Default 4 (rounded-square) in both forms. Pass
   *  `size / 2` for a circle. */
  radius?: number;
  /** Composed form: `<AvatarImage>` + `<AvatarFallback>` children (drop-in with
   *  the legacy Radix-based Avatar). When omitted, the simple `name`/`image`
   *  form renders instead. */
  children?: ReactNode;
  className?: string;
}

/**
 * Initials for a display name.
 *
 * Two words or more → the first letter of the first two. A SINGLE word → its
 * first two letters, not its first one: a lone letter in a 32px square reads as
 * a placeholder rather than as a person, and single-word names are the common
 * case here (a handle, an org, a team). This is the app's `monogram()`; the kit
 * used to take one letter per word unconditionally and so rendered "D" where
 * the app rendered "DR".
 */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

type ImageStatus = "idle" | "loaded" | "error";
const AvatarContext = createContext<{
  status: ImageStatus;
  setStatus: (s: ImageStatus) => void;
} | null>(null);

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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  /**
   * Catch an image that failed BEFORE React was listening.
   *
   * The markup is server-rendered, so the browser starts fetching as soon as
   * the HTML lands — often finishing, and failing, before hydration attaches
   * `onError`. That event is gone by then, and the avatar sits there showing
   * the broken-image glyph and its alt text forever. A ref callback runs at
   * attach time and can ask the element directly: a decoded image has a
   * natural width, a broken one has zero.
   */
  const catchEarlyError = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth === 0 && node.src) {
      setFailedSrc(node.getAttribute("src"));
    }
  }, []);

  // Composed form: render children and coordinate image/fallback via context.
  if (children !== undefined) {
    const px = size ?? 24;
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
    );
  }

  // Simple form (unchanged behavior): initials with optional image.
  const px = size ?? 32;
  const showImage = !!image && failedSrc !== image;
  const label = name ?? "";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 select-none overflow-hidden",
        // Mono, like every other small monogram the app draws (the profile
        // rows, the note-presence stack): at this size the initials are a
        // label, not display type. The 88px `AvatarHero` below stays on UI
        // type, where it IS display type.
        !showImage &&
          "text-uikit-ink font-uikit-mono font-semibold leading-none tracking-uikit-tighter opacity-90",
        className,
      )}
      style={{
        width: px,
        height: px,
        borderRadius: radius ?? 4,
        fontSize: Math.round(px * 0.36),
        background: showImage
          ? undefined
          : "color-mix(in oklab, var(--ink) 8%, var(--bg))",
        ...style,
      }}
      {...rest}
    >
      {showImage ? (
        <img
          ref={catchEarlyError}
          src={image}
          alt={label}
          className="w-full h-full object-cover"
          onError={() => setFailedSrc(image!)}
        />
      ) : (
        getInitials(label)
      )}
    </span>
  );
}

function AvatarComposed({
  size,
  radius,
  className,
  style,
  children,
  ...rest
}: { size: number; radius?: number } & ComponentProps<"span">) {
  const [status, setStatus] = useState<ImageStatus>("idle");
  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <span
        data-slot="avatar"
        className={cn("relative flex shrink-0 overflow-hidden", className)}
        style={{
          width: size,
          height: size,
          // The same rounded square as the simple form. The circle here was
          // inherited from the legacy Radix drop-in, and nothing in the app
          // wears one: every avatar it draws is a square at 4, 6 or 12px. A
          // component whose two forms disagree about their own shape is one
          // the caller has to remember a rule for.
          borderRadius: radius ?? 4,
          ...style,
        }}
        {...rest}
      >
        {children}
      </span>
    </AvatarContext.Provider>
  );
}

export type AvatarImageProps = ComponentProps<"img">;

/** Image for the composed `<Avatar>`. Hidden until it loads; on error the
 *  surrounding `<AvatarFallback>` takes over. */
export function AvatarImage({
  className,
  onLoad,
  onError,
  ...props
}: AvatarImageProps) {
  const ctx = useContext(AvatarContext);
  // Same pre-hydration race as the simple form: a server-rendered image can
  // finish — or fail — before React attaches these handlers, and the event is
  // gone by then. A ref callback runs at attach time and can ask the element
  // what actually happened.
  const settle = (node: HTMLImageElement | null) => {
    if (!node || !node.complete || !node.src) return;
    ctx?.setStatus(node.naturalWidth === 0 ? "error" : "loaded");
  };
  return (
    <img
      ref={settle}
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      style={{ display: ctx?.status === "loaded" ? undefined : "none" }}
      onLoad={(e) => {
        ctx?.setStatus("loaded");
        onLoad?.(e);
      }}
      onError={(e) => {
        ctx?.setStatus("error");
        onError?.(e);
      }}
      {...props}
    />
  );
}

export type AvatarFallbackProps = ComponentProps<"span">;

/** Fallback (usually initials) for the composed `<Avatar>`. Shown until the
 *  image loads. */
export function AvatarFallback({
  className,
  children,
  ...props
}: AvatarFallbackProps) {
  const ctx = useContext(AvatarContext);
  if (ctx?.status === "loaded") return null;
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-[inherit]",
        "bg-uikit-chip text-uikit-ink text-uikit-11 font-uikit-mono font-medium select-none",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AvatarHeroProps extends Omit<
  ComponentProps<"div">,
  "onClick"
> {
  /** Display name. Initials stand in when there is no image. */
  name: string;
  /** Image URL or data URL. */
  image?: string | null;
  /** Show the hover scrim + pencil and make the square clickable. Off by
   *  default, so someone viewing another person's profile is not offered an
   *  edit they have no permission for. */
  editable?: boolean;
  onEdit?: () => void;
}

/**
 * Full-width 1:1 avatar for a profile rail — the hero the app's profile page
 * has always drawn, and until now a private `RailAvatar` inside
 * `ProfileLayout`. Exported so a page that builds its own rail gets the same
 * square instead of re-deriving it.
 *
 * It fills its container, so the container caps it: the app's rail wants
 * `className="max-w-[248px]"` so the square does not blow up to the full column
 * width below the `lg` breakpoint.
 */
export function AvatarHero({
  name,
  image,
  editable = false,
  onEdit,
  className,
  ...rest
}: AvatarHeroProps) {
  return (
    <div
      onClick={editable ? onEdit : undefined}
      role={editable ? "button" : undefined}
      title={editable ? "change avatar" : undefined}
      className={cn(
        "group relative w-full aspect-square overflow-hidden rounded-xl select-none",
        // The initials size off the BOX, not off a literal. 35.5% of the width
        // is the app's 88px in its 248px rail — the ratio the design was drawn
        // at — and it now holds at any width. A fixed 88px was fine while the
        // only caller was that one rail; exported, it made a 120px rail render
        // initials at 73% of the square.
        "[container-type:inline-size]",
        editable && "cursor-pointer",
        className,
      )}
      {...rest}
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
            "w-full h-full flex items-center justify-center",
            "font-uikit-ui font-semibold text-uikit-ink opacity-90",
            "bg-[color-mix(in_oklab,var(--ink)_8%,var(--bg))]",
            "tracking-[-.04em] text-[35.5cqi]",
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {editable && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-2",
            "bg-[color-mix(in_srgb,black_38%,transparent)]",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            "text-white font-uikit-mono text-uikit-12 tracking-uikit-snug",
            "pointer-events-none",
          )}
        >
          <Pencil size={16} />
          {/* The label is a fixed 12px, so it stops fitting on one line well
              before the square stops being usable — at 112px it wrapped and
              overflowed. Under 160px the pencil carries the affordance alone;
              the title attribute still says what the click does. */}
          <span className="@max-[160px]:hidden">change avatar</span>
        </div>
      )}
    </div>
  );
}
