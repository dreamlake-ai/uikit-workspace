# Menu

A trigger-anchored dropdown. The panel floats above any clipping ancestor and
follows the trigger as the page scrolls or resizes. The trigger is rendered via
a render-prop so it can react to the open state — typical use is a tinted
background or a rotated chevron while the menu is open.

## Minimal

A minimal action menu — three items and a destructive divider.

## Workspace switcher

A workspace switcher example: a two-line trigger (eyebrow + brand
wordmark with rotating chevron), `personal` and `organizations` sections of
account rows, three actions, and a destructive sign-out at the bottom. The
`MenuItem` `disabled` flag is wired to "Manage members" — only valid for
organizations.

The account row itself is composed by the caller (avatar + name + handle +
"current" marker) — the library doesn't ship a dedicated `MenuAccountRow`
because the row is highly app-specific and it would force a shared `Avatar`
decision before that's been made.

## Behavior

- **Wedge points at the chevron** — the panel's top edge carries a wedge that
  centers on the first `[data-menu-arrow]` descendant of the trigger. Tag the
  chevron with it; without a tag the wedge falls back to the trigger's center,
  which is only right for triggers whose chevron sits near the middle. The
  wedge is clamped 16px off both panel corners, and `arrow={false}` drops it.
- **Chevron rests pointing up** — draw the chevron up and rotate it `0deg →
  180deg` on open so it sweeps clockwise down toward the panel. Match the
  panel's own entry motion — `duration-[280ms]`,
  `ease-[cubic-bezier(0.2,0.8,0.2,1)]` — so chevron and panel move as one.
- **Rows are inset chips** — the panel pads 6px on each side so `MenuItem`
  hover and any caller-composed selected state render as rounded 6px chips,
  never edge-to-edge bands. Caller-composed rows should use `px-2` +
  `rounded-uikit-badge` to line up with `MenuItem` (see the switcher above).
- **Floats above clipping ancestors** — the panel is not clipped by
  `overflow: hidden`, `transform`, or sticky containers, and follows the
  trigger as the page scrolls or resizes.
- **Esc + outside-click dismiss** — pressing Escape or clicking outside both the
  trigger and the panel closes the menu.
- **Controlled or uncontrolled** — pass `open` + `onOpenChange` for full
  control, or rely on `defaultOpen` and let the menu manage its own state.

> **No keyboard navigation shipped** — the menu doesn't intercept
> ↑/↓/Enter to walk through items. If you need full keyboard flow, layer it on
> top by managing `open` yourself and adding listeners to the trigger / items.

## Props

### Menu

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `trigger` | `(open: boolean) => ReactNode` | — | Render-prop for the trigger element. Receives the current open state. |
| `align` | `'left' \| 'right'` | `'left'` | Panel horizontal alignment relative to the trigger. |
| `width` | `number` | `240` | Panel min-width in px. |
| `arrow` | `boolean` | `true` | Render a wedge on the panel's top edge pointing back at the trigger. |
| `open` | `boolean` | — | Controlled open state. Omit for uncontrolled mode. |
| `onOpenChange` | `(open: boolean) => void` | — | Fires when the menu wants to open or close. Required when controlled. |
| `defaultOpen` | `boolean` | `false` | Initial open state in uncontrolled mode. |
| `dismissOnEsc` | `boolean` | `true` | Dismiss when the user presses Escape. |
| `dismissOnOutsideClick` | `boolean` | `true` | Dismiss when the user clicks outside both the trigger and panel. |
| `className` | `string` | — | Extra classes on the panel element. |
| `children` | `ReactNode` | — | Panel content — typically `MenuSection`, `MenuItem`, `MenuDivider`. |

### MenuSection

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | Uppercase mono label rendered above the section's items. |
| `children` | `ReactNode` | Section content. |

### MenuItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `ReactNode` | — | Optional icon rendered before the label. |
| `label` | `ReactNode` | — | Item label. |
| `danger` | `boolean` | `false` | Use the design's semantic error color and a tinted-red hover. |
| `disabled` | `boolean` | `false` | Visually muted, non-clickable, no hover effect. |
| `onClick` | `() => void` | — | Click handler. Suppressed when disabled. |

### MenuDivider

No props. Renders a 1px `var(--faint)` separator with `4px` margin top and bottom.
