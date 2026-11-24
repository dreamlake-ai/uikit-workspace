import type { CSSProperties } from "react";
import type { ToggleShape } from "./toggleShape";

/** Memo editor geometry: one source for Vim and multi-mode panel toggles. */
export const EDITOR_TOGGLE_INSET = 2;
export const EDITOR_TOGGLE_HEIGHT = 20;
export const EDITOR_TOGGLE_MS = 240;
export const EDITOR_TOGGLE_HOVER = "#23aaff";

export const editorToggleRadius = (shape: ToggleShape, thumb = false) =>
  shape === "round"
    ? "var(--radius-uikit-round, 9999px)"
    : thumb
      ? "var(--radius-uikit-toggle-thumb, 2px)"
      : "var(--radius-uikit-toggle, 4px)";

export function editorToggleTrackStyle(
  shape: ToggleShape,
  tone: string | null,
  ms = EDITOR_TOGGLE_MS,
): CSSProperties {
  return {
    boxSizing: "border-box",
    height: EDITOR_TOGGLE_HEIGHT,
    border: "none",
    boxShadow: "none",
    borderRadius: editorToggleRadius(shape),
    background: tone ?? "var(--chip-bg)",
    transition: `background ${ms}ms ease`,
  };
}
export function editorToggleThumbStyle(shape: ToggleShape): CSSProperties {
  return {
    top: EDITOR_TOGGLE_INSET,
    height: EDITOR_TOGGLE_HEIGHT - 2 * EDITOR_TOGGLE_INSET,
    borderRadius: editorToggleRadius(shape, true),
    background: "var(--bg)",
    boxShadow: "none",
  };
}
export function editorToggleFaceStyle(
  active: boolean,
  highlighted: boolean,
  ms = EDITOR_TOGGLE_MS,
): CSSProperties {
  return {
    color: active ? "var(--ink)" : highlighted ? "#fff" : "var(--uikit-muted)",
    opacity: active || highlighted ? 1 : 0.5,
    transition: `color ${ms}ms ease, opacity ${ms}ms ease`,
  };
}
