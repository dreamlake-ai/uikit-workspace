import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface ProfileCardProps {
  title: ReactNode
  tag?: ReactNode // small badge/chip immediately after title
  titleRight?: ReactNode // right-aligned header meta (timestamp, version)
  description?: ReactNode
  footer?: ReactNode
  /** Right-aligned content alongside `footer`. Use for ACL chips, member
   *  avatars, status badges — anything that should sit on the footer's right
   *  while `footer` keeps the left-side stats. Shares the footer row's mono
   *  typography; wrap in a styled element to override. */
  footerRight?: ReactNode
  /** Final row inside the card body. Render `<Tag>` chips here for the
   *  "Pipelines tab" pattern — a horizontal, wrapping row at the bottom of
   *  the card. Pass an array of nodes or any flex-wrap-friendly subtree. */
  tags?: ReactNode
  /** Hover-revealed actions anchored to the card's top-right. Use for the
   *  edit/delete pattern. When this slot is provided, `titleRight` auto-fades
   *  on hover so the two don't visually collide. Clicks do not bubble to
   *  `onClick`. */
  topRightActions?: ReactNode
  /** Hover-revealed actions anchored to the card's bottom-right. Use for
   *  primary inline actions (fork, open, etc). Clicks do not bubble to
   *  `onClick`. */
  hoverActions?: ReactNode
  /** Always-visible actions in that same bottom-right corner.
   *
   *  The slot to reach for when the control must be FOUND, not just used:
   *  hover-revealed actions are invisible until a pointer is over the card, so
   *  a reader scanning a list cannot tell which rows offer the action, and a
   *  row's only affordance can go unnoticed entirely. This slot renders at
   *  rest — visibility is the caller's own styling, not a reveal.
   *
   *  Shares the corner with `hoverActions`; when both are given they sit on one
   *  line, revealed first, persistent last. */
  bottomRightActions?: ReactNode
  /** Destination for the card click. Renders the card as a real `<a>` so
   *  browser link affordances (⌘/ctrl+click, middle-click, right-click →
   *  open in new tab) work; same-origin hrefs still client-route under Vike.
   *  Action-slot clicks preventDefault so they never trigger navigation. */
  href?: string
  onClick?: () => void
  className?: string
}

export function ProfileCard({
  title,
  tag,
  titleRight,
  description,
  footer,
  footerRight,
  tags,
  topRightActions,
  hoverActions,
  bottomRightActions,
  href,
  onClick,
  className,
}: ProfileCardProps) {
  /*
   * The card is a container, and the link is INSIDE it — never the other way
   * round.
   *
   * A card that is itself the `<a>` has nowhere legal to put an action: a
   * `<button>` nested in an anchor is invalid content, and the browsers that
   * tolerate it still hand the anchor the click. Cancelling that navigation in
   * a capture-phase `preventDefault` — which is what this component used to do
   * — treats the symptom. The structure stays wrong, and everything downstream
   * of it (AT announcing one control, not two; a nested button that cannot be
   * activated by keyboard the way a button should) stays wrong with it.
   *
   * So: a `<a>` around the title, stretched over the whole card by an
   * `::after` overlay. The card is clickable edge to edge and it is a REAL
   * link — middle-click, ⌘-click, "copy link address" and "open in new tab"
   * all work, because they are the anchor's own behaviours rather than a
   * handler's imitation of them. Actions are siblings of that anchor, lifted
   * above the overlay, so a click on one reaches the button and nothing else.
   *
   * `data-uikit-card` is the handle for "the card" now that it is no longer
   * "the anchor" — consumers' tests need something stable to address.
   */
  // Revealed on hover, and NOT only on hover.
  //
  // `opacity-0` alone leaves a control that is invisible but still focusable
  // and still hit-testable — a keyboard user tabs into something they cannot
  // see, and `pointer-events-none` then makes it unclickable rather than
  // hidden, which is two bugs wearing one class. So:
  //
  //   focus-within — a keyboard user sees what they have landed on.
  //   (hover: none) — a touch device has no hover state to enter, so the
  //   control is simply present. Without it the action is unreachable on a
  //   phone, silently, since the pointer that would reveal it does not exist.
  //
  // The pointer-device appearance is unchanged: hidden at rest, shown on hover.
  const revealOnHover = cn(
    'opacity-0 pointer-events-none transition-opacity duration-[120ms]',
    'group-hover:opacity-100 group-hover:pointer-events-auto',
    'group-focus-within:opacity-100 group-focus-within:pointer-events-auto',
    '[@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto',
  )

  return (
    <div
      data-uikit-card=""
      onClick={onClick}
      className={cn(
        'group relative rounded-xl border border-uikit-faint',
        'px-4 py-3.5 min-w-0',
        'font-uikit-ui text-uikit-ink',
        // Clickable cards get a pointer + a subtle hover fill, so every consumer
        // (Overview / Projects / Datasets / Artifacts / …) reads the same on hover
        // without each having to re-declare it.
        (onClick || href) && 'cursor-pointer transition-colors duration-[120ms] hover:bg-[color-mix(in_srgb,var(--color-uikit-ink)_3%,transparent)]',
        className,
      )}
    >
      {/* header — title + tag share a shrinkable flex column on the left so
          long titles truncate with ellipsis instead of pushing titleRight
          (or worse, the card boundary) out. */}
      <div className="flex items-baseline gap-2.5">
        <div className="flex items-baseline gap-2.5 flex-1 min-w-0">
          {href ? (
            /* The overlay lives on the anchor, not on a wrapper, so the
               accessible name of the link is the title itself.
               `overflow` stays OFF this element — `truncate` here would clip
               the `::after` to the title's own box and the card would stop
               being clickable. The inner span does the truncating instead. */
            <a
              href={href}
              className={cn(
                'min-w-0 no-underline text-uikit-ink',
                "after:absolute after:inset-0 after:rounded-xl after:content-['']",
              )}
            >
              <span className="block text-uikit-14 font-medium tracking-uikit-tight leading-uikit-snug truncate">
                {title}
              </span>
            </a>
          ) : (
            <span className="text-uikit-14 font-medium tracking-uikit-tight leading-uikit-snug truncate min-w-0">
              {title}
            </span>
          )}
          {tag && (
            <span className="font-uikit-mono text-[10.5px] opacity-80 whitespace-nowrap shrink-0">
              {tag}
            </span>
          )}
        </div>
        {titleRight && (
          <span
            className={cn(
              'font-uikit-mono text-uikit-11 text-uikit-muted opacity-65 tracking-uikit-snug whitespace-nowrap shrink-0',
              // Above the stretched overlay. Consumers put `title`/`<time>`
              // meta here, and a pseudo-element covering it would swallow the
              // tooltip. The trade is that this small strip does not navigate.
              'relative z-10',
              // When topRightActions are also present, fade titleRight on
              // hover so the hover-revealed cluster doesn't collide with
              // the meta (e.g. timestamp behind edit/delete buttons).
              topRightActions && 'transition-opacity duration-[120ms] group-hover:opacity-0',
            )}
          >
            {titleRight}
          </span>
        )}
      </div>

      {/* description — `break-words` keeps unbroken strings (URLs, tokens)
          from spilling past the card edge. */}
      {description && (
        <div className="mt-1.5 text-uikit-13 font-normal opacity-75 leading-normal tracking-uikit-snug break-words">
          {description}
        </div>
      )}

      {/* footer (+ optional right-aligned cluster) */}
      {(footer || footerRight) && (
        <div className="mt-1.5 flex items-center gap-3 min-w-0 font-uikit-mono text-uikit-11 tracking-uikit-snug">
          {footer ? (
            <div className="flex-1 min-w-0 truncate opacity-75">{footer}</div>
          ) : (
            <span className="flex-1" />
          )}
          {footerRight && (
            <div className="flex-shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap">
              {footerRight}
            </div>
          )}
        </div>
      )}

      {/* tags row — `<Tag>` chips by convention. Wraps onto multiple lines
          when they don't fit; `min-w-0` lets the row shrink inside grid cells. */}
      {tags && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
          {tags}
        </div>
      )}

      {/*
        Action slots — siblings of the card's link, never inside it.
        `z-10` lifts them above the anchor's stretched `::after`, so a click
        lands on the button. No `preventDefault` anywhere: the click never
        reaches the anchor to begin with, which is the difference between a
        structure that is right and one corrected after the fact.
        `stopPropagation` stays, for the `onClick`-only (hrefless) card whose
        container handler would otherwise also fire.
      */}
      {topRightActions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute right-3 top-3 z-10 inline-flex items-center gap-1',
            revealOnHover,
          )}
        >
          {topRightActions}
        </div>
      )}

      {/*
        One corner, two reveal policies. The container is positioned and
        persistent; only the `hoverActions` group inside it fades, so adding a
        persistent action never changes when the hover-revealed ones appear.
      */}
      {(hoverActions || bottomRightActions) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute right-3 bottom-[9px] z-10 inline-flex items-center gap-1.5',
            'font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug',
          )}
        >
          {hoverActions && (
            <span className={cn('inline-flex items-center gap-1.5', revealOnHover)}>
              {hoverActions}
            </span>
          )}
          {bottomRightActions}
        </div>
      )}
    </div>
  )
}
