import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Track } from "./types";

/** Left gutter of editable track-name headers (multi-track mode only). Owns the
 *  inline-rename state; delegates activate / rename / remove to the host. */
export function TrackHeads({
  tracks,
  active,
  onActivate,
  onRename,
  onRemove,
}: {
  tracks: Track[];
  active: number;
  onActivate: (index: number) => void;
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
}) {
  const [renaming, setRenaming] = useState<number | null>(null);
  return (
    <div className="va-track-heads">
      <div className="va-th-spacer" />
      {tracks.map((tr, ti) => (
        <div
          key={tr.id || ti}
          className={cn("va-th", ti === active && "active")}
          onMouseDown={() => onActivate(ti)}
        >
          {renaming === ti ? (
            <input
              className="va-th-input"
              defaultValue={tr.name}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                else if (e.key === "Escape") {
                  e.currentTarget.value = tr.name;
                  e.currentTarget.blur();
                }
              }}
              onBlur={(e) => {
                onRename(ti, e.currentTarget.value.trim() || tr.name);
                setRenaming(null);
              }}
            />
          ) : (
            <span
              className="va-th-name"
              title="Double-click to rename"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setRenaming(ti);
              }}
            >
              {tr.name}
            </span>
          )}
          {tracks.length > 1 && (
            <button
              className="va-th-x"
              aria-label={`Remove ${tr.name}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(ti);
              }}
            >
              <X />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
