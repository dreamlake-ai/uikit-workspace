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
        "rounded-[var(--radius)] border border-uikit-faint bg-uikit-panel text-uikit-ink",
        "px-3 py-2.5 shadow-uikit-soft font-uikit-ui",
      )}
    >
      <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center">
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
          className="shrink-0 text-uikit-11 font-medium text-uikit-accent hover:opacity-80 cursor-pointer"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => toastStore.dismiss(item.id)}
        className="shrink-0 text-uikit-muted hover:text-uikit-ink cursor-pointer text-uikit-12 leading-none"
      >
        ✕
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
  const timers = useRef(
    new Map<string | number, ReturnType<typeof setTimeout>>(),
  );

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

  if (typeof document === "undefined") return null;

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
