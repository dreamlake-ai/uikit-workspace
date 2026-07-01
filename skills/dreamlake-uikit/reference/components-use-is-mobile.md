# useIsMobile

A hook that returns `true` when the viewport is narrower than `768px`. It tracks
resizes via `matchMedia` and is SSR-safe (returns `false` until mounted, so the
server and first client render agree).

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
