import type { CSSProperties } from "react";
import "./CollectionList.css";

export interface ListDividerProps {
  label: string;
  className?: string;
  style?: CSSProperties;
}

/** A labelled boundary, not a row: no selection, focus or disclosure controls.
 * Keep dividers outside the host's selectable items and keyboard row selectors.
 * Works in CollectionList and as a separate item in VirtualList/VirtualListFlow. */
export function ListDivider({
  label,
  className = "",
  style,
}: ListDividerProps) {
  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="horizontal"
      className={`uikit-list-divider ${className}`}
      style={style}
    >
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
