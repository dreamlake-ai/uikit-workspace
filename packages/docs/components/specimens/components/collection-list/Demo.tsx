import { useEffect, useRef, useState } from "react";
import {
  CollectionList,
  CollectionRow,
  Button,
  Menu,
  MenuItem,
  VirtualListFlow,
} from "@dreamlake/uikit";
import {
  Folder,
  Hash,
  FileText,
  MoreHorizontal,
  Pin,
  PinOff,
  Boxes,
} from "lucide-react";

const entries = [
  {
    id: "brief",
    name: "Research brief",
    detail: "Memo · planning",
    kind: "memo",
  },
  {
    id: "data",
    name: "Evaluation recordings",
    detail: "Folder · 128 files",
    kind: "folder",
  },
  {
    id: "results",
    name: "Robot manipulation evaluation with a long descriptive title",
    detail: "Memo · results",
    kind: "memo",
  },
];
function Example({ kind }: { kind: "Folder" | "Bindr" | "Project" }) {
  const [pins, setPins] = useState<string[]>(
    kind === "Bindr" ? ["results"] : [],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const item =
      content.current?.querySelector<HTMLElement>('[role="menuitem"]');
    if (item) {
      item.tabIndex = 0;
      item.focus();
    }
  }, [menu]);
  const rows = entries
    .filter((row) => row.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(pins.includes(b.id)) - Number(pins.includes(a.id)));
  return (
    <section
      style={{
        minWidth: 0,
        flex: "1 1 280px",
        padding: 12,
        border: "1px solid var(--faint)",
        borderRadius: 10,
      }}
    >
      <h3
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          margin: "0 0 12px",
        }}
      >
        {kind === "Folder" ? (
          <Folder size={16} />
        ) : kind === "Bindr" ? (
          <Hash size={16} />
        ) : (
          <Boxes size={16} />
        )}
        {kind}
      </h3>
      <input
        aria-label={`Search ${kind}`}
        placeholder="Search this collection…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        style={{
          width: "100%",
          marginBottom: 12,
          background: "transparent",
          border: 0,
          borderBottom: "1px solid var(--faint)",
          color: "var(--ink)",
        }}
      />
      <CollectionList aria-label={`${kind} contents`}>
        {rows.map((row) => (
          <CollectionRow
            key={row.id}
            role="button"
            tabIndex={0}
            aria-label={row.name}
            aria-pressed={selected === row.id}
            onClick={() => setSelected(row.id)}
            onKeyDown={(event) => {
              if (
                event.target === event.currentTarget &&
                ["Enter", " "].includes(event.key)
              ) {
                event.preventDefault();
                setSelected(row.id);
              }
            }}
            icon={
              row.kind === "folder" ? (
                <Folder size={18} />
              ) : (
                <FileText size={18} />
              )
            }
            name={row.name}
            meta="2h"
            detail={row.detail}
            pinned={pins.includes(row.id)}
            actions={
              <Menu
                open={menu === row.id}
                onOpenChange={(open) => setMenu(open ? row.id : null)}
                align="right"
                trigger={() => (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon
                    aria-label={`More actions for ${row.name}`}
                    aria-haspopup="menu"
                  >
                    <MoreHorizontal size={14} />
                  </Button>
                )}
              >
                <div
                  ref={menu === row.id ? content : undefined}
                  onKeyDown={(event) => {
                    if (["Enter", " "].includes(event.key)) {
                      event.preventDefault();
                      content.current
                        ?.querySelector<HTMLElement>('[role="menuitem"]')
                        ?.click();
                    }
                    if (event.key === "Tab") setMenu(null);
                  }}
                >
                  <MenuItem
                    icon={
                      pins.includes(row.id) ? (
                        <PinOff size={14} />
                      ) : (
                        <Pin size={14} />
                      )
                    }
                    label={
                      pins.includes(row.id) ? "Unpin from top" : "Pin to top"
                    }
                    onClick={() => {
                      setMenu(null);
                      setPins((current) =>
                        current.includes(row.id)
                          ? current.filter((id) => id !== row.id)
                          : [...current, row.id],
                      );
                    }}
                  />
                </div>
              </Menu>
            }
          />
        ))}
        {!rows.length && <p role="status">No matches in this collection.</p>}
      </CollectionList>
    </section>
  );
}
export function Demo() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      <Example kind="Folder" />
      <Example kind="Bindr" />
      <Example kind="Project" />
    </div>
  );
}

export function LongList() {
  const items = Array.from({ length: 1000 }, (_, index) => ({
    id: String(index),
    name: `Recording ${index + 1}`,
  }));
  return (
    <div style={{ height: 280 }}>
      <VirtualListFlow
        items={items}
        getItemKey={(item) => item.id}
        height={280}
        itemHeight={40}
      >
        {(item, _index, style) => (
          <CollectionRow
            style={style}
            icon={<FileText size={18} />}
            name={item.name}
            meta="1m"
          />
        )}
      </VirtualListFlow>
    </div>
  );
}
