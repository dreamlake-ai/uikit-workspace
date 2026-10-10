# useIsMobile

A hook that returns `true` when the viewport matches the narrow-screen media
query, using a breakpoint of `768px` by default. It
updates as the viewport changes and is SSR-safe (returns `false` until mounted,
so the server and first client render agree).

```tsx
import { useIsMobile } from '@dreamlake/uikit'

function Nav() {
  const isMobile = useIsMobile()
  return isMobile ? <DrawerNav /> : <SideNav />
}
```

## Custom breakpoint

Pass a breakpoint in CSS pixels when the whole application switches its
composition at a wider size. Existing callers keep the 768px default.

```tsx
const isNarrow = useIsMobile(1024)
```

The hook subscribes to `matchMedia('(max-width: 1023px)')` for this example.
Changing the argument replaces the listener and immediately reads the new
query's result; unmounting removes the listener.

## Returns

| Type | Description |
| --- | --- |
| `boolean` | `true` when the media query for `breakpoint - 1` CSS pixels matches. |
