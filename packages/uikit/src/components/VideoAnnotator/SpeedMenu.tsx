import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/** Playback-speed dropdown. Self-contained: owns its open state and closes on
 *  outside click / Escape (the old version stayed open until you re-clicked the
 *  button or picked a value). */
export function SpeedMenu({
  rate,
  speeds,
  onPick,
}: {
  rate: number;
  speeds: number[];
  onPick: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("va-speedsel", open && "open")}>
      <button
        type="button"
        className="va-speedbtn"
        aria-label="Playback speed"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span>{rate}×</span>
        <ChevronDown size={12} className="va-caret" />
      </button>
      {open && (
        <div className="va-speedmenu" role="listbox">
          {speeds.map((v) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={v === rate}
              onClick={() => {
                onPick(v);
                setOpen(false);
              }}
            >
              {v === rate && <Check size={12} className="va-speedcheck" />}
              {v}×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
