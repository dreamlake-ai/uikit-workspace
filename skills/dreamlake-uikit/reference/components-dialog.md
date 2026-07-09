# Dialog

A modal primitive: dimmed backdrop, centered panel with header / body / footer
slots, Esc and backdrop-click dismissal, and body-scroll lock while open. It
floats above the rest of the page, unaffected by any clipping ancestor.

## Basic

A simple confirm dialog with title, eyebrow, body text, and an action footer.

## Publish dataset

A real-world form: a text input for the dataset family name, a radio list of
source bindrs, and a primary publish action. Demonstrates building form fields
inside the dialog body using design tokens — uppercase mono labels, underlined
inputs, custom radio dots that fill with `var(--uikit-accent)` when picked.

## Behavior

- **Floats above the page** — the dialog appears above all other content and is
  never clipped by an overflow-hidden, transformed, or sticky ancestor.
- **Body scroll lock** — the page behind the dialog can't scroll while it's
  open; scrolling is restored on close.
- **Esc + backdrop dismissal** — both routes call the same `onClose` handler.
  Caller controls whether to honor the dismissal (e.g. confirm before closing
  if there are unsaved edits).
- **Theme-aware** — the backdrop dims the page and the panel uses the surface
  and shadow tokens, so it flips automatically in dark mode.

> **No focus trap shipped** — the panel does not steal or trap focus. If you
> need keyboard-only flow within the dialog (e.g. a multi-step form), wire up
> your own focus management on the body content.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | **Required.** Controlled open state. |
| `onClose` | `() => void` | — | **Required.** Fires when the user dismisses the dialog (Esc key, backdrop click, or any explicit close affordance the caller renders). Caller must flip `open` to false. |
| `title` | `ReactNode` | — | Heading rendered top-left of the panel. 17px semibold ink. |
| `eyebrow` | `string` | — | Small uppercase mono label rendered next to the title. |
| `footer` | `ReactNode` | — | Footer content. Typically a row of action buttons aligned right. |
| `width` | `number` | `480` | Panel width in px. |
| `showEscHint` | `boolean` | `true` | Show the muted "esc" hint in the header. Clicking it also calls `onClose`. |
| `dismissOnBackdropClick` | `boolean` | `true` | Dismiss when the user clicks the dimmed backdrop. |
| `dismissOnEsc` | `boolean` | `true` | Dismiss when the user presses Escape. |
| `className` | `string` | — | Extra classes on the panel element. |
| `children` | `ReactNode` | — | Body content — typically form fields, message text, or a custom layout. |
