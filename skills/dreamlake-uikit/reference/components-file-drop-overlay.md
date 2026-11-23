# File Drop Overlay

A dashed edge and diagonal hatch cover the owning surface. A clear center holds the destination prompt. The overlay never intercepts pointer events or replaces the underlying content.

Position the parent with `position: relative`. `useFileDropTarget` supplies file-only drag handlers and clears feedback after drop, Escape, window blur, and drag end. Use `disabled` for read-only surfaces. Wire its `onDrop` to capture when an editor would otherwise consume the drop. Internal row moves and text drags are left to their existing handlers.

`FileDropOverlay` takes `active`, `title`, `description`, and `compact` for a destination row. Keep destination resolution, upload permission checks, transfer queues, and file picking in the product. Always provide a keyboard and mobile file-picker action alongside drag-and-drop.
