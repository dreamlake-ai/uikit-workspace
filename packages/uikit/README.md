# @dreamlake/uikit

React UI component library for DreamLake applications.

## Install

```bash
npm install @dreamlake/uikit
```

Peer dependencies: `react`, `react-dom`, and `lucide-react` (icons).

## Setup

The components are styled with **Tailwind CSS v4**. The package ships its
design tokens and `uikit-*` utility definitions as Tailwind source
(`styles.css` with an `@theme` block), which your app's Tailwind compiles.
Add this to your app's main stylesheet:

```css
@import 'tailwindcss';
@import '@dreamlake/uikit/styles.css';
@source "../node_modules/@dreamlake/uikit/dist/**/*.js";
```

The `@source` line points at the built bundle (`dist`) because, after the
package is built, the utility class strings the components use live in the
compiled JS — Tailwind needs to scan them to generate the matching CSS.
Adjust the relative path to your stylesheet's location. Dark mode flips
automatically via `[data-theme="dark"]` on `<html>`.

```tsx
import { Button, cn } from '@dreamlake/uikit'
```

## Components

- **Avatar** — User/entity avatar with fallback initials
- **BreadcrumbTree** — Hierarchical breadcrumb navigation
- **Dialog** — Modal dialog with overlay
- **FilterBar** — Composable filter controls
- **Menu** — Dropdown and context menus
- **ProfileCard** / **ProfileLayout** — User profile display
- **ResizableLayout** — Draggable split panes
- **Select** — Dropdown select input
- **SideNav** — Collapsible sidebar navigation
- **Tabs** — Tab panel container
- **Tag** — Label/chip component
- **VirtualList** / **VirtualListFlow** — Virtualized scrolling lists

## Documentation

[uikit.dreamlake.ai](https://uikit.dreamlake.ai)

## License

MIT
