# Split Button

A **split button** joins a direct action and a chevron that opens alternatives.
A **button group** is the broader pattern of related adjacent buttons; use a split
button when those alternatives belong to one primary action, such as **New note**.

## Styles and examples

Use the existing [Button](reference/components-button.md) variants rather than inventing a
second style system. `secondary` is **framed**, `primary` is **filled**, `ghost`
is bare, and `action` supplies the hover background for header controls. Both
halves share the variant, size and **6px rounded rectangle** geometry. Only the
joined inner corners are square. Text and icon-only examples below are interactive.

The main half calls `onClick` immediately. Only the chevron opens the menu. Menu
items close it after selection; disabled items do not. `disabled` and `loading`
disable both halves. Icon-only primary actions need an `aria-label`.

## Keyboard

Tab visits each button. Enter or Space activates the focused half. Arrow Down or
Arrow Up on the chevron opens the menu. Inside it, Up/Down and Home/End move among
enabled items; Enter/Space selects; Escape closes and returns focus to the chevron.
The standard Button focus ring remains visible on each half.

## Props

`SplitButton` accepts Button props for the primary action, except `href` and
`asChild`: this pattern performs an action rather than navigating. `variant`
defaults to `secondary`; `size` defaults to `sm`.

| Prop           | Type                      | Default          | Description                                               |
| -------------- | ------------------------- | ---------------- | --------------------------------------------------------- |
| `children`     | `ReactNode`               | required         | Primary label or icon.                                    |
| `menu`         | `ReactNode`               | required         | Alternatives using MenuItem, MenuSection and MenuDivider. |
| `menuLabel`    | `string`                  | `'More options'` | Accessible label for the chevron.                         |
| `menuWidth`    | `number`                  | `200`            | Menu width, clamped to the viewport by Menu.              |
| `align`        | `'left' \| 'right'`       | `'right'`        | Menu alignment.                                           |
| `open`         | `boolean`                 | —                | Optional controlled menu state.                           |
| `onOpenChange` | `(open: boolean) => void` | —                | Receives menu state changes.                              |

Keep app-specific alternatives and handlers in the app; UIKit owns the shared
shape, disabled state, focus behavior and dropdown composition.
