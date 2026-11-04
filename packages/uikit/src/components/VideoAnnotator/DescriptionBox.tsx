import type { Segment } from "./types";
import { fmt } from "./segments";

/** The boxed per-segment description editor rendered below the timeline when
 *  `showDescription` is set. Shows the selected segment's caption plus a word
 *  count and its time/frame range. */
export function DescriptionBox({
  segment,
  index,
  extractFps,
  onChange,
  readOnly = false,
}: {
  segment: Segment | null;
  index: number;
  extractFps?: number | null;
  onChange?: (index: number, value: string) => void;
  /** View only: the caption shows in the same box but can't be edited. */
  readOnly?: boolean;
}) {
  const words = segment ? (segment.description || "").trim().split(/\s+/).filter(Boolean).length : 0;
  const range = segment
    ? `phase ${index + 1} · ${fmt(segment.start)}–${fmt(segment.end)}` +
      (extractFps
        ? ` · frames ${Math.round(segment.start * extractFps) + 1}–${Math.round(segment.end * extractFps) + 1}`
        : "")
    : "";
  return (
    <div className="va-desc">
      <textarea
        className="va-desc-box"
        aria-label="Phase description"
        placeholder={readOnly ? "No description" : "Phase description — edit to match the clip"}
        readOnly={readOnly}
        value={segment?.description ?? ""}
        onChange={readOnly ? undefined : (e) => onChange?.(index, e.target.value)}
      />
      <div className="va-desc-meta">
        <span>{words} words</span>
        <span>{range}</span>
      </div>
    </div>
  );
}
