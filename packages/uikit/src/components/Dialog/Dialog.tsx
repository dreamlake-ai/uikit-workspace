import {
  type ReactNode,
  type ComponentProps,
  useEffect,
  useId,
  useState,
} from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useComposedRef, useModalPresence } from "../../lib/useModalPresence";

export interface DialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Fires when the dialog requests dismissal (Esc key, backdrop click, or
   *  any explicit close / cancel affordance). Caller must flip `open` to false. */
  onClose: () => void;
  /** Heading shown at the top-left of the panel. */
  title?: ReactNode;
  /** Small uppercase mono label rendered next to the title — e.g. "freeze a bindr → vN". */
  eyebrow?: string;
  /** Footer content. Typically a row of action buttons aligned right. */
  footer?: ReactNode;
  /** Panel width in px. Default 480. */
  width?: number;
  /** Show the close (×) button in the header. Default true. (Named for the
   *  "esc" text hint it used to render; kept for API compatibility.) */
  showEscHint?: boolean;
  /** Dismiss when the user clicks the dimmed backdrop. Default true. */
  dismissOnBackdropClick?: boolean;
  /** Dismiss when the user presses Escape. Default true. */
  dismissOnEsc?: boolean;
  /** Extra classes on the panel element. */
  className?: string;
  /** Opt in to modal keyboard focus management. Existing dialogs retain their behavior. */
  managedFocus?: boolean;
  /** Initial tabbable index or an explicit element ref (managedFocus only). */
  initialFocus?: ComponentProps<typeof FloatingFocusManager>["initialFocus"];
  /** Restore the opener, or an explicit trigger ref (managedFocus only). */
  returnFocus?: ComponentProps<typeof FloatingFocusManager>["returnFocus"];
  /** Accessible name when no visible title is supplied. */
  "aria-label"?: string;
  children: ReactNode;
}

// Own component so its hover state unmounts with the dialog content. Clicking
// × closes the dialog while the pointer is still over the button, so
// mouseleave never fires — hover state held by the (still-mounted) Dialog
// instance would survive the close and reopen pre-highlighted.
//
// Inline styles on purpose: consumers compile our utility classes at their own
// Tailwind pass, and a new arbitrary-value class here could silently miss
// older content configs.
function CloseButton({ onClose }: { onClose: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        appearance: "none",
        border: 0,
        padding: 0,
        cursor: "pointer",
        width: 22,
        height: 22,
        flexShrink: 0,
        borderRadius: 5,
        alignSelf: "center",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        // Colour-only hover (muted → ink), no fill — matches the design's close
        // affordance. (Previously painted an ink-tinted chip on hover.)
        background: "transparent",
        color: hov ? "var(--ink)" : "var(--uikit-muted)",
        opacity: hov ? 1 : 0.65,
        transition: "color 120ms ease, opacity 120ms ease",
      }}
    >
      <X size={15} strokeWidth={2} />
    </button>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  width = 480,
  showEscHint = true,
  dismissOnBackdropClick = true,
  dismissOnEsc = true,
  className,
  managedFocus = false,
  initialFocus,
  returnFocus,
  "aria-label": ariaLabel,
  children,
}: DialogProps) {
  const titleId = useId();
  const { refs, context } = useFloating({
    open,
    onOpenChange: (value) => {
      if (!value) onClose();
    },
  });
  const dismiss = useDismiss(context, {
    enabled: managedFocus && open,
    escapeKey: dismissOnEsc,
    outsidePress: false,
  });
  const { getFloatingProps } = useInteractions([dismiss]);
  // Esc to dismiss.
  useEffect(() => {
    if (!open || !dismissOnEsc || managedFocus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismissOnEsc, onClose, managedFocus]);

  // Lock body scroll while the dialog is open so the page doesn't move under the dim layer.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keeps the panel through its exit; while closing, it shows the last open
  // title/body/footer and is inert and hidden from assistive technology.
  const presence = useModalPresence(open, { title, eyebrow, footer, children });
  const panelRef = useComposedRef<HTMLDivElement>(
    presence.panelRef,
    managedFocus ? refs.setFloating : null,
  );
  if (!presence.present || typeof document === "undefined") return null;
  const shown = presence.content;

  const content = (
    <div
      ref={presence.backdropRef}
      role="presentation"
      data-state={presence.state}
      inert={!open}
      aria-hidden={open ? undefined : true}
      style={presence.backdropStyle}
      onClick={dismissOnBackdropClick && open ? onClose : undefined}
      className={cn(
        "uikit-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center font-uikit-ui",
        "bg-[rgba(0,0,0,0.55)]",
      )}
    >
      <div
        ref={panelRef}
        {...(managedFocus ? getFloatingProps() : {})}
        role="dialog"
        data-state={presence.state}
        onAnimationEnd={presence.onPanelAnimationEnd}
        aria-label={ariaLabel}
        aria-labelledby={!ariaLabel && shown.title ? titleId : undefined}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "uikit-modal-panel p-6 rounded-[14px] flex flex-col gap-4",
          "max-h-[85vh] overflow-y-auto",
          "bg-uikit-bg text-uikit-ink shadow-uikit-deep",
          className,
        )}
        // `lineHeight: normal` resets the app's ambient Tailwind-preflight 1.5 for
        // all dialog content, so fields/chips/buttons match the design's compact
        // vertical rhythm (the design inherits the browser default). One rule at
        // the panel root — no per-element height/padding overrides.
        style={{ ...presence.panelStyle, width, lineHeight: "normal" }}
      >
        {(shown.title || shown.eyebrow || showEscHint) && (
          <div className="flex items-baseline gap-2.5">
            {shown.title && (
              // The title is the dialog's name ("Move note") and keeps its words:
              // it shrinks only once the eyebrow is gone, then ellipsizes rather
              // than wrapping or pushing the close button out of the panel.
              <h3
                id={titleId}
                className="m-0 min-w-0 shrink truncate font-uikit-ui text-uikit-17 font-semibold leading-[1.2] tracking-uikit-tight text-uikit-ink"
              >
                {shown.title}
              </h3>
            )}
            {shown.eyebrow && (
              // The eyebrow is context — often a long resource name — so it yields
              // first: one line, ellipsized, stopping at the gap before the close
              // button. The heavy shrink weight spends the row's overflow here
              // before the title gives up a single character.
              <span className="min-w-0 shrink-[1000] truncate font-uikit-mono text-uikit-10 leading-uikit-snug text-uikit-muted opacity-60 tracking-uikit-wide uppercase">
                {shown.eyebrow}
              </span>
            )}
            <span className="flex-1" />
            {showEscHint && <CloseButton onClose={onClose} />}
          </div>
        )}

        {shown.children}

        {shown.footer && (
          <div className="flex items-center gap-3 justify-end">{shown.footer}</div>
        )}
      </div>
    </div>
  );
  return managedFocus ? (
    <FloatingPortal>
      <FloatingFocusManager
        context={context}
        initialFocus={initialFocus}
        returnFocus={returnFocus}
        // Disabling on close returns focus and lifts outside inertness at once,
        // as unmounting did, while the panel finishes its exit.
        disabled={!open}
        modal
        restoreFocus
        outsideElementsInert
      >
        {content}
      </FloatingFocusManager>
    </FloatingPortal>
  ) : (
    createPortal(content, document.body)
  );
}
