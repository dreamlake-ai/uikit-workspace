# Menu

A trigger-anchored dropdown. The panel is portaled into `document.body` so it
floats above any clipping ancestor; positioning tracks the trigger on scroll
and resize. The trigger is rendered via a render-prop so it can react to the
open state — typical use is a tinted background or a rotated chevron while the
menu is open.

## Minimal

A minimal action menu — three items and a destructive divider.

## Workspace switcher

A faithful port of the workspace switcher: a two-line trigger (eyebrow + brand
wordmark with rotating chevron), `personal` and `organizations` sections of
account rows, three actions, and a destructive sign-out at the bottom. The
`MenuItem` `disabled` flag is wired to "Manage members" — only valid for
organizations.

The account row itself is composed by the caller (avatar + name + handle +
"current" marker) — the library doesn't ship a dedicated `MenuAccountRow`
because the row is highly app-specific and it would force a shared `Avatar`
decision before that's been made.

## Behavior

- **Portaled** — the panel renders into `document.body` via
  `React.createPortal`, so it floats above any clipping ancestor.
- **Anchor tracking** — the trigger's `getBoundingClientRect` is recomputed on
  `scroll` (capture-phase) and `resize`, so the panel follows the trigger as
  the page moves.
- **Esc + outside-click dismiss** — both call `onOpenChange(false)` (or update
  internal state if uncontrolled).
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
