import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";
import { Spinner } from "../Spinner";
import { type ToastItem, type ToastType, toastStore } from "./toast";

export type ToasterPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToasterProps {
  /** Corner/edge to anchor toasts. Default `bottom-right`. */
  position?: ToasterPosition;
  /** Default auto-dismiss in ms (per-toast `duration` overrides). Default 4000. */
  duration?: number;
  className?: string;
}

const TONE: Record<ToastType, string> = {
  default: "var(--uikit-muted)",
  success: "var(--tone-green)",
  error: "var(--tone-red)",
  info: "var(--tone-blue)",
  warning: "var(--tone-amber)",
  loading: "var(--uikit-muted)",
};

const POSITION: Record<ToasterPosition, CSSProperties> = {
  "top-left": { top: 16, left: 16, alignItems: "flex-start" },
  "top-center": {
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    alignItems: "center",
  },
  "top-right": { top: 16, right: 16, alignItems: "flex-end" },
  "bottom-left": { bottom: 16, left: 16, alignItems: "flex-start" },
  "bottom-center": {
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    alignItems: "center",
  },
  "bottom-right": { bottom: 16, right: 16, alignItems: "flex-end" },
};

function ToastRow({ item }: { item: ToastItem }) {
  return (
    <div
      role="status"
      className={cn(
        "uikit-panel-in pointer-events-auto flex items-start gap-2.5 w-[340px] max-w-[calc(100vw-32px)]",
        // The row's typography is the TITLE's, so `1lh` on any child resolves
        // to the title's line box. Everything beside the title — the status
        // dot, the action, the dismiss — takes that height and centres inside
        // it, which puts each one on the first line's centre and keeps it
        // there when a description wraps underneath. Nudging them with margins
        // instead is what left the dot 1.2px low and the ✕ 1.8px high.
        "text-uikit-12 leading-uikit-snug",
        // No `border`: `shadow-uikit-soft` already ends in a
        // `0 0 0 1px var(--faint)` ring, which is the hairline this surface
        // wants. Carrying both stacked two 1px rules either side of the edge —
        // and being 8% alpha, they compounded to ~15% where they met, so the
        // toast read as a heavy 2px outline rather than a hairline.
        "rounded-[var(--radius)] bg-uikit-panel text-uikit-ink",
        "px-3 py-2.5 shadow-uikit-soft font-uikit-ui",
      )}
    >
      <span className="flex h-[1lh] w-3.5 shrink-0 items-center justify-center">
        {item.type === "loading" ? (
          <Spinner size={14} />
        ) : (
          <span
            className="size-2 rounded-full"
            style={{ background: TONE[item.type] }}
          />
        )}
      </span>
      <div className="flex-1 min-w-0">
        {item.title != null && (
          <div className="text-uikit-12 leading-uikit-snug font-medium">
            {item.title}
          </div>
        )}
        {item.description != null && (
          <div className="text-uikit-11 leading-uikit-snug text-uikit-muted mt-0.5">
            {item.description}
          </div>
        )}
      </div>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action!.onClick();
            toastStore.dismiss(item.id);
          }}
          // `text-uikit-11` sits on the label, not here: `1lh` is computed
          // from this element's own font and leading, so restating either on
          // the box that carries the height would stop it resolving to the
          // title's line box.
          className="flex h-[1lh] shrink-0 items-center font-medium text-uikit-accent hover:opacity-80 cursor-pointer"
        >
          <span className="text-uikit-11">{item.action.label}</span>
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => toastStore.dismiss(item.id)}
        // No `leading-none` here, for the same reason: it would make `1lh`
        // this button's own 12px rather than the title's line box.
        className="flex h-[1lh] shrink-0 items-center text-uikit-muted hover:text-uikit-ink cursor-pointer"
      >
        <span className="text-uikit-12 leading-none">✕</span>
      </button>
    </div>
  );
}

/**
 * Renders active toasts in a fixed stack. Mount once near the app root. Pairs
 * with the imperative `toast()` API. Self-contained reimplementation of the
 * sonner-based Toaster the legacy kit wrapped — no sonner dependency.
 */
export function Toaster({
  position = "bottom-right",
  duration = 4000,
  className,
}: ToasterProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  // Portals have no server-rendered form: on the server this component emits
  // nothing, so the client's FIRST render — the hydration render — has to emit
  // nothing either. Checking `typeof document` did the opposite: undefined on
  // the server, defined on the client, so the very first frames disagreed and
  // React discarded the server HTML and rebuilt the whole tree on the client.
  // An effect runs after that first render has been committed, so flipping this
  // there keeps the two initial outputs identical and creates the portal on the
  // render that follows.
  const [mounted, setMounted] = useState(false);
  const timers = useRef(
    new Map<string | number, ReturnType<typeof setTimeout>>(),
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => toastStore.subscribe(setItems), []);

  useEffect(() => {
    // Arm a dismiss timer for any toast that's newly visible and not sticky.
    for (const t of items) {
      const d = t.duration ?? duration;
      const sticky = d === Infinity || t.type === "loading";
      if (!sticky && !timers.current.has(t.id)) {
        timers.current.set(
          t.id,
          setTimeout(() => toastStore.dismiss(t.id), d),
        );
      }
    }
    // Clear timers for toasts that are gone.
    for (const [id, tm] of timers.current) {
      if (!items.find((t) => t.id === id)) {
        clearTimeout(tm);
        timers.current.delete(id);
      }
    }
  }, [items, duration]);

  if (!mounted) return null;

  const fromTop = position.startsWith("top");

  return createPortal(
    <div
      className={cn(
        "fixed z-[200] flex flex-col gap-2 pointer-events-none",
        className,
      )}
      style={{
        ...POSITION[position],
        flexDirection: fromTop ? "column" : "column-reverse",
      }}
    >
      {items.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  );
}
