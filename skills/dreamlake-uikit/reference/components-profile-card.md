# ProfileCard

A bordered card for a resource row — title, optional tag, right-aligned meta,
description, and a footer stats line. Optional hover-revealed slots reveal
controls (edit/delete top-right, or fork/open bottom-right) without
displacing the layout.

Each slot has default typography baked in so callers can pass plain strings
without any style code. Override by wrapping content in a styled element.

## Basic

All five content slots: `title`, `tag`, `titleRight`, `description`, `footer`.

## Hover actions

`hoverActions` is revealed on pointer-enter and anchored to the bottom-right of
the card. Clicks on it do not bubble to `onClick`.

## Top-right actions + footer-right

`topRightActions` reveals controls in the card's top-right on hover (the
edit/delete pattern). When this slot is provided, `titleRight` auto-fades on
hover and on keyboard focus so the meta (timestamp) doesn't visually collide
with the action cluster. On a touch device (`hover: none`) the actions are
always shown, so they join the title row instead — title, then the buttons, on
one line centred on the title — and the meta moves to the card's bottom-right
corner, at the right end of the footer row. A long name truncates before the
buttons. A card with no footer gets a footer row for the meta, on touch only.

`footerRight` adds a right-aligned cluster next to the footer — typically
ACL chips, member avatars, or status badges that should sit on the same row
as the left-side stats.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `ReactNode` | Primary name in the header. Default: 14px medium. |
| `tag` | `ReactNode` | Small badge immediately after the title — a kind such as `python` or `git`. Default: mono 10.5px, 80% opacity. Not for visibility: that is an icon leading the title — a lock for private, a globe for public (13px, private muted, public accent), its meaning in the kit tooltip — never the word `private`. |
| `titleRight` | `ReactNode` | Right-aligned header meta — timestamp, version, etc. Default: mono 11px, 65% opacity. Auto-fades on hover / keyboard focus when `topRightActions` is also set; on touch it moves to the bottom-right corner, at the end of the footer row. |
| `description` | `ReactNode` | Optional body paragraph. Default: 13px, 75% opacity, 1.5 line-height. |
| `footer` | `ReactNode` | Optional stats/meta row at the bottom-left. Default: mono 11px, 75% opacity, truncates. |
| `footerRight` | `ReactNode` | Right-aligned cluster next to `footer` (ACL chips, badges). Shares the footer row. |
| `tags` | `ReactNode` | Final row inside the card body — a horizontal, wrapping row of `<Tag>` chips (the "Pipelines tab" pattern). Pass an array of nodes or any flex-wrap-friendly subtree. |
| `topRightActions` | `ReactNode` | Controls anchored top-right, revealed on hover or keyboard focus; on touch always shown, at the end of the title row. Used for the edit/delete pattern. Clicks do not bubble to `onClick`. |
| `hoverActions` | `ReactNode` | Controls anchored bottom-right, revealed on hover. Clicks do not bubble to `onClick`. |
| `onClick` | `() => void` | Makes the card clickable. Adds pointer cursor. |
| `className` | `string` | Extra classes on the card root. |
