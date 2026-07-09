# useIsMobile

A hook that returns `true` when the viewport is narrower than `768px`. It
updates as the viewport changes and is SSR-safe (returns `false` until mounted,
so the server and first client render agree).

```tsx

function Nav() {
  const isMobile = useIsMobile()
  return isMobile ?  : 
}
```

## Returns

| Type | Description |
| --- | --- |
| `boolean` | `true` when `window.innerWidth < 768`. |
