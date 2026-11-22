/**
 * Corner shape shared by every toggle-like control in the kit (Switch, Toggle,
 * ToggleButtons, Tabs `segment`, PillRadio / ChipMulti, SlideToggle and the
 * theme toggles).
 *
 * - `square` (default): small-radius corners from the radius ladder, the same
 *   corners as Button and Input.
 * - `round`: the stadium track and circular thumb. Each control also exposes a
 *   `*Round` preset (`SwitchRound`, `ToggleRound`, …) and stamps a
 *   `uikit-<control>-round` class plus `data-shape="round"` on its root, so
 *   stylesheets can target the round look.
 */
export type ToggleShape = "square" | "round";

/** `uikit-<name>-round` when round, otherwise `undefined` (for `cn`). */
export function roundClass(name: string, shape: ToggleShape | undefined) {
  return shape === "round" ? `uikit-${name}-round` : undefined;
}
