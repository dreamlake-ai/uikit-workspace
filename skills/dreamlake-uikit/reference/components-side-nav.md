# SideNav

A sidebar shell with a pinned header, a pinned footer, and a scrollable body
divided into titled groups. Group titles stick to the top of the scroll
container as the user scrolls. The shell paints `var(--rail-bg)` as its
background, so it follows the active theme automatically.

## Demo

Scroll inside the panel to see group titles stick. Click a dataset to see the
active state.

## Props

### SideNav

| Prop | Type | Description |
| --- | --- | --- |
| `header` | `ReactNode` | Pinned top area — logo, workspace label, collapse button, etc. |
| `footer` | `ReactNode` | Pinned bottom area — shortcuts, upload queue, account row, etc. |
| `children` | `ReactNode` | Scrollable content, typically `SideNavGroup` elements. |
| `className` | `string` | Extra classes on the root. Background defaults to `var(--rail-bg)`. |

### SideNavGroup

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Group label — uppercase mono. Sticks to the top of the scroll container when scrolled past. |
| `action` | `ReactNode` | Node rendered to the right of the title — typically a small icon button. |
| `children` | `ReactNode` | Group content — fully up to the caller. |
| `className` | `string` | Extra classes on the group wrapper. |

> **Background inheritance** — sticky group titles use `bg-inherit` to cover
> items scrolling beneath them. The SideNav root paints `var(--rail-bg)`, which
> propagates through the inheritance chain to the title automatically.
