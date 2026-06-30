# Dialog

A modal primitive: dimmed backdrop, centered panel with header / body / footer
slots, Esc and backdrop-click dismissal, body-scroll lock while open. Renders
into `document.body` via `createPortal` so it floats above any clipping
ancestor.

## Basic

A simple confirm dialog with title, eyebrow, body text, and an action footer.

## Publish dataset

A real-world form: a text input for the dataset family name, a radio list of
source bindrs, and a primary publish action. Demonstrates building form fields
inside the dialog body using design tokens — uppercase mono labels, underlined
inputs, custom radio dots that fill with `var(--uikit-accent)` when picked.

## Behavior

- **Portaled** — the dialog renders into `document.body` via
  `React.createPortal`, so it floats above any clipping ancestor
  (`overflow: hidden`, `transform`, sticky containers).
- **Body scroll lock** — `document.body.style.overflow` is set to `hidden`
  while the dialog is open, restored on close.
- **Esc + backdrop dismissal** — both routes call the same `onClose` handler.
  Caller controls whether to honor the dismissal (e.g. confirm before closing
  if there are unsaved edits).
- **Tokens** — backdrop is
  `color-mix(in srgb, var(--ink) 35%, transparent)`, panel is `var(--bg)` with
  the layered `--shadow-tint-*` shadows, so dark mode flips automatically.

> **No focus trap shipped** — the panel does not steal or trap focus. If you
> need keyboard-only flow within the dialog (e.g. a multi-step form), wire up
> your own focus management on the body content.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Controlled open state. |
| `onClose` | `() => void` | — | Fires when the user dismisses the dialog (Esc key, backdrop click, or any explicit close affordance the caller renders). Caller must flip `open` to false. |
| `title` | `ReactNode` | — | Heading rendered top-left of the panel. 17px semibold ink. |
| `eyebrow` | `string` | — | Small uppercase mono label rendered next to the title. |
| `footer` | `ReactNode` | — | Footer content. Typically a row of action buttons aligned right. |
| `width` | `number` | `480` | Panel width in px. |
| `showEscHint` | `boolean` | `true` | Show the muted "esc" hint in the header. Clicking it also calls `onClose`. |
| `dismissOnBackdropClick` | `boolean` | `true` | Dismiss when the user clicks the dimmed backdrop. |
| `dismissOnEsc` | `boolean` | `true` | Dismiss when the user presses Escape. |
| `className` | `string` | — | Extra classes on the panel element. |
| `children` | `ReactNode` | — | Body content — typically form fields, message text, or a custom layout. |
