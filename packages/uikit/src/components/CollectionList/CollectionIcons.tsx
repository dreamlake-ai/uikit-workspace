import { Folder, FolderOpen, FolderKanban } from "lucide-react";
import "./CollectionList.css";

export interface CollectionIconProps {
  size?: number;
  strokeWidth?: number;
  /** Hold the active state for an expanded or selected collection. */
  open?: boolean;
}

/** Upstream Lucide silhouettes crossfade inside a stable icon slot. */
export function FolderCollectionIcon({
  size = 18,
  strokeWidth = 1.5,
  open = false,
}: CollectionIconProps) {
  return (
    <span
      className="uikit-collection-glyph uikit-folder-glyph"
      data-open={open}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Folder
        size={size}
        strokeWidth={strokeWidth}
        className="uikit-folder-closed"
        fill="currentColor"
        fillOpacity={0.1}
      />
      <FolderOpen
        size={size}
        strokeWidth={strokeWidth}
        className="uikit-folder-open"
        fill="currentColor"
        fillOpacity={0.16}
      />
    </span>
  );
}

/** Keep the shared Bindr mark, with translucent depth and a small active lift. */
export function BindrCollectionIcon({
  size = 18,
  strokeWidth = 1.5,
  open = false,
}: CollectionIconProps) {
  return (
    <span
      className="uikit-collection-glyph uikit-bindr-glyph"
      data-open={open}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <FolderKanban
        size={size}
        strokeWidth={strokeWidth}
        fill="currentColor"
        fillOpacity={0.12}
      />
    </span>
  );
}
