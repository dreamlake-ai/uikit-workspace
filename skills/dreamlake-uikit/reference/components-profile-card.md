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
hover so the meta (timestamp) doesn't visually collide with the action
cluster.

`footerRight` adds a right-aligned cluster next to the footer — typically
ACL chips, member avatars, or status badges that should sit on the same row
as the left-side stats.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `ReactNode` | Primary name in the header. Default: 14px medium. |
| `tag` | `ReactNode` | Small badge immediately after the title. Default: mono 10.5px, 80% opacity. |
| `titleRight` | `ReactNode` | Right-aligned header meta — timestamp, version, etc. Default: mono 11px, 65% opacity. Auto-fades on hover when `topRightActions` is also set. |
| `description` | `ReactNode` | Optional body paragraph. Default: 13px, 75% opacity, 1.5 line-height. |
| `footer` | `ReactNode` | Optional stats/meta row at the bottom-left. Default: mono 11px, 75% opacity, truncates. |
| `footerRight` | `ReactNode` | Right-aligned cluster next to `footer` (ACL chips, badges). Shares the footer row. |
| `tags` | `ReactNode` | Final row inside the card body — a horizontal, wrapping row of `` chips (the "Pipelines tab" pattern). Pass an array of nodes or any flex-wrap-friendly subtree. |
| `topRightActions` | `ReactNode` | Controls anchored top-right, revealed on hover. Used for the edit/delete pattern. Clicks do not bubble to `onClick`. |
| `hoverActions` | `ReactNode` | Controls anchored bottom-right, revealed on hover. Clicks do not bubble to `onClick`. |
| `onClick` | `() => void` | Makes the card clickable. Adds pointer cursor. |
| `className` | `string` | Extra classes on the card root. |
