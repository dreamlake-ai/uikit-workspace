import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@dreamlake/uikit";

export const BasicSpec = () => (
  <ContextMenu>
    <ContextMenuTrigger>
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: 120,
          borderRadius: 10,
          border: "1px dashed var(--uikit-faint, rgba(0,0,0,0.15))",
          color: "var(--uikit-muted, #888)",
          fontSize: 13,
          userSelect: "none",
        }}
      >
        Right-click anywhere in this area
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem onSelect={() => console.log("open")}>
        Open
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => console.log("rename")}>
        Rename
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => console.log("duplicate")}>
        Duplicate
      </ContextMenuItem>
      <ContextMenuItem disabled>Archive</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem danger onSelect={() => console.log("delete")}>
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);
