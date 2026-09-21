# Theme

The theme system persists a base theme (`light` / `dark` / `system`) plus an
optional `liquid` flag, resolves the active theme, and reflects it on
`html[data-theme]` — the attribute the kit's tokens key off.

> Live toggles drive `html[data-theme]` for the whole page, so this page documents
> them with code rather than an embedded demo (which would fight the docs site's
> own theme switch).

## Setup

Wrap your app once in `ThemeProvider`, and import the kit's stylesheet at the
root so the tokens are present:

```tsx
import { ThemeProvider } from '@dreamlake/uikit'
import '@dreamlake/uikit/styles.css'

export function App() {
  return (
    <ThemeProvider defaultBaseTheme="system">
      {/* …app… */}
    </ThemeProvider>
  )
}
```

## Toggles

`ThemeModeToggle` shows all three modes at once and moves a circular thumb to
the one in force. It is the toggle the app wears in its navbar.
`ThemeCycleToggle` is the one-glyph version for a surface the strip doesn't fit
— a sidebar footer, a collapsed rail, the marketing site's header — advancing
`dark → system → light` on each click. `size` scales it and the glyph follows at
half the box: 28 in the app's sidebar, 32 in the marketing header, which is the
2:1 ratio both have always kept. `LiquidToggle` flips the liquid flag. Both must be inside a `ThemeProvider` (or, for
`ThemeModeToggle`, driven as a controlled input — see below).

```tsx
import { ThemeModeToggle, ThemeCycleToggle, LiquidToggle } from '@dreamlake/uikit'

<header>
  <ThemeModeToggle />
  <LiquidToggle />
</header>

<footer>
  <ThemeCycleToggle />
</footer>
```

The strip is **transparent at rest and takes the chip tint on hover**, with an
elevated thumb riding in it. The frame is there to say "these three are one
control" at the moment someone is about to use it; a permanent tinted slab in a
quiet navbar is a box drawn around three icons that were reading fine without
one.

What makes that safe is the thumb's `shadow-uikit-sm`. A `--bg` thumb on a
transparent strip over a `--bg` page is invisible, and the control falls apart
into three loose icons — the elevation is what lets it read on its own ground,
so the frame doesn't have to carry it. It shares its curve with `ToggleButtons`
and `Tabs`' segment pill through `--uikit-ease-thumb` / `--uikit-dur-thumb`. Unselected glyphs differ only in
opacity: they used to shrink and counter-rotate, which meant every switch shoved
all three icons around while the thumb travelled underneath, competing with the
one piece of motion the control has.

`orientation="vertical"` stacks the segments for a collapsed icon rail, where
all three choices should stay directly clickable. The thumb travels the same
distance, on the other axis.

Both **replace** `ThemeColorToggle`, which was a rounded-square button on an
ink-tint hover. `ThemeCycleToggle` is the borderless circle the app actually
uses for this, and it cycles `dark → system → light` — the app's order.

The thumb runs on `--uikit-ease-thumb` / `--uikit-dur-thumb`, the same curve and
duration as the segmented `ToggleButtons` highlight, so two of them on one page
read as the same widget family. An unselected glyph sits at 85% and leans away
from the thumb; `prefers-reduced-motion` drops every transition.

The demo above is **controlled**, which is why it can be live on a page whose
own theme switch sits in the topbar: given `value` and `onValueChange` the
toggle stops reading the provider and reports upward instead. That is also the
migration path for an app that already keeps its own theme state — adopt the
control now, move the state into `ThemeProvider` later.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number` | `22` | Segment size in px — the thumb's diameter, and the control's height minus its 2px padding. |
| `value` | `BaseTheme` | — | Controlled mode. Omit to read the `ThemeProvider`. |
| `onValueChange` | `(t: BaseTheme) => void` | — | Controlled mode: called with the picked theme. |
| `enableSystem` | `boolean` | provider's setting (`true` when controlled) | Whether to offer the middle "follow the OS" segment. |

Uncontrolled, it needs a `ThemeProvider` above it and throws a named error if
there isn't one. With `enableSystem={false}` on the provider, the middle
segment drops out on its own.

## `useTheme`

Read or drive the theme from anywhere under the provider:

```tsx
import { useTheme } from '@dreamlake/uikit'

function Example() {
  const { baseTheme, setBaseTheme, isLiquid, toggleLiquid, computedTheme } = useTheme()
  return <button onClick={() => setBaseTheme('dark')}>Now: {computedTheme}</button>
}
```

| Member | Type | Description |
| --- | --- | --- |
| `baseTheme` | `'light' \| 'dark' \| 'system'` | The stored base theme. |
| `setBaseTheme` | `(t: BaseTheme) => void` | Set + persist the base theme. |
| `isLiquid` | `boolean` | Liquid flag. |
| `toggleLiquid` | `() => void` | Flip the liquid flag. |
| `computedTheme` | `'light' \| 'dark' \| 'liquid-light' \| 'liquid-dark'` | Resolved active theme. |
| `resolvedTheme` | `'light' \| 'dark' \| 'liquid-light' \| 'liquid-dark'` | Alias of `computedTheme`. |
| `systemTheme` | `'light' \| 'dark' \| undefined` | OS preference (when `system`). |
| `storageKey` | `string` | The localStorage key prefix in use. |

### `ThemeProvider` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultBaseTheme` | `BaseTheme` | `'system'` (or `'light'` if system disabled) | Initial base theme. |
| `defaultIsLiquid` | `boolean` | `false` | Initial liquid flag. |
| `enableSystem` | `boolean` | `true` | Track the OS color-scheme preference. |
| `storageKey` | `string` | `'dl-theme'` | localStorage key prefix. |
