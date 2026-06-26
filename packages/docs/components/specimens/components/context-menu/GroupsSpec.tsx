import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@dreamlake/uikit";

export const GroupsSpec = () => (
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
        Right-click for grouped actions
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuLabel>Edit</ContextMenuLabel>
      <ContextMenuGroup>
        <ContextMenuItem onSelect={() => console.log("cut")}>
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => console.log("copy")}>
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => console.log("paste")}>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuLabel>View</ContextMenuLabel>
      <ContextMenuGroup>
        <ContextMenuItem onSelect={() => console.log("zoom-in")}>
          Zoom in
          <ContextMenuShortcut>⌘+</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => console.log("zoom-out")}>
          Zoom out
          <ContextMenuShortcut>⌘-</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuGroup>
    </ContextMenuContent>
  </ContextMenu>
);
