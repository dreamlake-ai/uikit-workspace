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

<header>
  
  
</header>
```

## `useTheme`

Read or drive the theme from anywhere under the provider:

```tsx

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
