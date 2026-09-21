# Kbd

A keyboard-shortcut chip — `⌘K` beside a search field, `esc` in a dialog footer.

```tsx
import { Kbd } from '@dreamlake/uikit'

<Kbd>⌘K</Kbd>
<Kbd>esc</Kbd>
```

It renders a real `<kbd>`, so the markup says what it is.

It is deliberately quiet: mono at 9.5px on the faintest ink wash in the kit,
muted text, no border. This is a hint about a shortcut that already works, never
a control — anything louder competes with the field it is sitting inside. If you
find yourself wanting a Kbd to look clickable, what you want is a
[Button](reference/components-button.md).

See [Input](reference/components-input.md) for the ⌘K search field it was built for,
including `InputSlot`'s `hideOnFocus`.

## Props

Native `<kbd>` attributes, plus `className`.
