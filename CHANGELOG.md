# Release notes

## 0.3.25 — 2026-11-27

- Preview stacks use transparent backing and visibly pull apart in three dimensions on hover or keyboard focus. Add a shared collection thumbnail modifier that preserves overflow; retain sharp front covers, one navigation action, and static reduced-motion/single-cover states.

## 0.3.24 — 2026-11-27

- Add compact collection rows and a documented virtualized tree-list composition using existing branch guides. Keep independent disclosure and source-link actions reachable in narrow rows, preserve native action-link navigation, and leave hierarchy/selection/inspectors with the host.

## 0.3.23 — 2026-11-27

- `ProgressRail` uses unframed accent-blue completion checks in both rail and compact presentations. Remove circular pending/current chrome; retain rail connectors, explicit error crosses, ordered state and current-step accessibility.

## 0.3.22 — 2026-11-27

- `ProgressRail compact` reuses the dense checklist presentation: small unframed state icons, inline label/detail and no connector. Default rail layout and explicit accessible stage state are unchanged. The standard example compares both presentations using the same stages.

## 0.3.21 — 2026-11-27

- `MediaViewerDialog` Close is now the shared `TransportButton` instead of a one-off 36px circle with a permanent grey fill: a quiet 30px square, 6px radius, hover wash, inset accent focus ring and a "Close" tooltip. The accessible name, `dismissible`, Escape, backdrop dismissal and focus handling are unchanged.
- The viewer's action cluster takes the dark theme's ink and hover wash in every theme, so Close and `TransportButton`s passed as `actions` stay legible over the always-dark backdrop in a light app. Actions now sit 4px apart and are vertically centred.

## 0.3.4 — 2026-11-23

- Add `FileDropOverlay` and `useFileDropTarget`: neutral hatch, dashed boundary, and clear prompt for exact pane or compact row targets. File-only handlers preserve text drags and internal moves; reset on drop, Escape, blur, and drag end.
- Include an interactive standard example and file-drop lifecycle tests.

## 0.3.3 — 2026-11-23

- Add compact panel toggle groups: neutral selection, mode-colored group background on hover and keyboard focus, and height inherited from tab gutters.
- Reduce document-tab shoulders and feet to 8px; balance close-button top/right spacing. Gutter actions stay transparent until hover and match inactive tab fill height.
- Update live tab-row examples and shared style guidance.

## 0.3.2 — 2026-11-23

- Add native `Checkbox`: an accent checkmark or mixed-state dash at rest, with an outline only on hover or keyboard focus. Supports controlled and uncontrolled state, native labels/forms, disabled controls, custom accents, and forced colors without animations.
- Add the standard Checkbox reference and interactive example with keyboard and touch validation. Preserve the published 0.3.1 Tooltip anchor/glide API alongside newer tree-guide and tab-row improvements.

## 0.3.1 — 2026-11-22

- `Tooltip` takes `anchorRect`: a `DOMRect`, a rect getter or a virtual element that replaces the trigger for placement. A getter is re-read on every animation frame while open, so one tooltip can serve a whole list (anchor it to the list's right edge at the hovered row's centre). Hover and focus still come from a `TooltipTrigger` when one is rendered; without one, drive `open`. Escape dismisses an anchor-only tooltip.
- `Tooltip` takes `glide` (`true` or `{ durationMs }`): when the anchor moves while open, the surface eases to the new position (160 ms, ease-out) and the wedge follows, instead of jumping. The first position after opening never glides; `prefers-reduced-motion: reduce` turns it off. The content stays mounted as the anchor moves.
- Docs: the Tooltip page shows a shared list popover that glides between rows.

## 0.2.14 — 2026-11-21

- Complete the shared editor `SlideToggle` with disabled behavior, button refs and native events, keyboard focus, and reduced-motion support. Preserve the 20px expanding-knob geometry.
- Add `PreviewToggle` beside the blue-hover `VimToggle` preset so memo editors and session Chat controls share the same primitive.
- Include the virtual-list pull droplet and automatic load-ahead, tab reveal gutters, and configurable panel close placement introduced since 0.2.13.

## 0.2.3 — 2026-09-26

- Keep layout examples within the text column. Dockit ContentRow remains available for content that needs a wider row.

## 0.2.2 — 2026-09-26

- Add opt-in mouse hover selection to `TabbedContainer`, preserving touch, click and keyboard navigation.
- Give layout examples individual section headings, remove outer cards, use Dockit ContentRow, and distinguish new, removed and moved tabs with color and symbols.

## 0.2.1 — 2026-09-26

- Resolve equal closest-panel distances by center distance before creation order, so an aligned neighbor wins over a touching corner in a grid.

## Unreleased

- **Breaking visual default (release as minor, 0.3.0): all toggles are square.** `Switch` (track and thumb), `ThemeModeToggle` (track, thumb and segments), `ThemeCycleToggle` and `SlideToggle` lose their round corners by default. `Switch` and `SlideToggle` use the new `--radius-uikit-toggle` (4px) track and `--radius-uikit-toggle-thumb` (2px) thumb tokens; `ThemeModeToggle` uses a 6px thumb in an 8px track; `ThemeCycleToggle` uses the 6px badge radius. `Toggle`, `ToggleButtons`, `PillRadio`, `ChipMulti`, `LiquidToggle` and the `Tabs` segment control were already square and do not change.
- Every toggle takes `shape?: "square" | "round"` (`ToggleShape`, default `"square"`). `shape="round"` keeps the stadium track and circular thumb, adds a `uikit-<control>-round` class and sets `data-shape="round"` on the root. Presets: `SwitchRound`, `ToggleRound`, `ToggleButtonsRound`, `TabsRound` (segment), `PillRadioRound`, `ChipMultiRound`, `SlideToggleRound`, `ThemeModeToggleRound`, `ThemeCycleToggleRound`, `LiquidToggleRound`. `toggleVariants({ shape })` accepts it too. New token `--radius-uikit-round` (9999px).
- Migration: to keep the old look, replace `<Switch …>` with `<SwitchRound …>` (or add `shape="round"`); do the same for `ThemeModeToggle` and `ThemeCycleToggle`.
- Docs: the Switch, Toggle, Tabs and Theme pages show each example in both shapes side by side; the Border & radius guide lists the toggle tokens.

- `TabRow`: the label's right padding tightens on hover/selection only when the tab has a close control. A fitted (`fitContent`), non-closable tab previously narrowed by 6px when selected or hovered and moved every tab after it.
- `TabRow` items accept `groupStart`: a thin, `aria-hidden` divider precedes that tab (ignored on the first tab) to separate tab groups. Tab semantics and arrow-key selection are unchanged.
- Dark segmented controls (Tabs `segment`, ToggleButtons `primary`/`secondary`) mirror light: the selected thumb is the page colour (`--uikit-segment-thumb` back to `--bg`), and the track is a recess below the page — new `--uikit-segment-track`, `color-mix(in srgb, #000 32%, var(--bg))` in dark, unset in light so light is unchanged. Dark unselected Tabs text on the track goes 4.09:1 → 5.76:1.
- Dark `--uikit-muted` `#8a8a8a` → `#999999`, so secondary text meets WCAG AA on the dark page (3.9:1 → 4.73:1). The color guide now says not to put opacity on `--ink` / `--muted` text.
- `Dialog`, `ModalContent` and `AlertDialogContent` share one spring-pop motion (`lib/useModalPresence`): a 340ms centred spring in, a 160ms shrink-and-fade out, and a backdrop fade alongside. The panel stays mounted, inert and hidden from assistive technology through its exit with its last open content; Esc, scroll lock and focus return still release when `open` turns false. A close or reopen mid-animation starts from the pose on screen. Reduced motion fades only. `Modal` and `AlertDialog` no longer use the top-anchored `uikit-panel-in`. Tests that expect a closed dialog to leave the DOM at once should wait for the exit or query by role.
- `BreadcrumbTree` gains a second panel layout and a toggle between them. `columns` is the existing Miller browser; `tree` is the whole expanded tree in one flow that wraps into columns, so several branches stay on screen at once. `view` / `defaultView` / `onViewChange` / `hideViewToggle` control it.
- `BreadcrumbTree` applies a drag to its own cache and no longer refetches to confirm it, so a re-parent no longer collapses the rest of the panel. `onMove` reports failure by rejecting; hosts should stop bumping `refreshToken` on a successful move. `BreadcrumbMove` gains `fromPath`.
- The panel flips above its trigger when there is not enough room below, instead of hanging off the bottom of the window where a fixed element cannot be scrolled back into view.
- Add `ListSearchInput` with an optional removable filter badge. The × control and Backspace at a collapsed caret at the start remove the filter without changing the query.
- Reuse that control in `FilterBar`; collapse category choices on search focus and match the category tabs with a 2px ink underline.
- Show panel close controls on header hover or keyboard focus without moving header content.
- Document the shared search control and its keyboard behavior.

## 0.1.15 — 2026-09-13

- Waterfall entry panes resize through the shared drag divider or keyboard arrows/Home/End. Public width bounds, resize callback, and a disable toggle support embedded views.
- Responsive limits retain timeline space on narrow containers, with requested widths restored when space returns.

## 0.1.14 — 2026-09-13

- The initial viewport fits the full input event span with padding, respecting explicit zoom limits. Search, expansion, and data rerenders preserve navigation. Empty input retains a finite fallback.

- Hover highlights join squarely across the tree/timeline divider. Only the outside corners of a row or subtree are rounded; standalone TreeView styling is unchanged.
- Zoom-out is unlimited by default (`maxWindow={Infinity}`). Both wheel zoom and the duration drag control respect explicit minimum and maximum windows.
- Ruler tick spacing scales with the visible window, so zooming out to long traces does not generate unbounded tick elements.
- Updated the [Waterfall guide](packages/docs/pages/components/waterfall/+Page.mdx) with defaults and a one-hour maximum example.
