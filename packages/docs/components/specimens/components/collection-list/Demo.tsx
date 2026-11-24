import { useEffect, useRef, useState } from "react";
import {
  CollectionList,
  FolderCollectionIcon,
  BindrCollectionIcon,
  PinnedPlaneIcon,
  PinnedCollectionDrawer,
  CollectionRow,
  Button,
  Menu,
  MenuItem,
  VirtualListFlow,
} from "@dreamlake/uikit";
import {
  FileText,
  MoreHorizontal,
  Pin,
  PinOff,
  Boxes,
  Film,
  AudioLines,
  Image,
  Braces,
  Monitor,
  Table2,
  FolderArchive,
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
  const renderRow = (row: (typeof entries)[number]) => (
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
          <FolderCollectionIcon open={selected === row.id} />
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
                pins.includes(row.id) ? <PinOff size={14} /> : <Pin size={14} />
              }
              label={pins.includes(row.id) ? "Unpin from top" : "Pin to top"}
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
  );
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
          <FolderCollectionIcon size={16} />
        ) : kind === "Bindr" ? (
          <BindrCollectionIcon size={16} />
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
        {rows.some((row) => pins.includes(row.id)) && (
          <PinnedCollectionDrawer
            count={rows.filter((row) => pins.includes(row.id)).length}
          >
            {rows.filter((row) => pins.includes(row.id)).map(renderRow)}
          </PinnedCollectionDrawer>
        )}
        {rows.filter((row) => !pins.includes(row.id)).map(renderRow)}
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

export function CollectionIconStates() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Button
        variant="ghost"
        aria-pressed={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Show resting icons" : "Show active icons"}
      </Button>
      <CollectionRow
        role="button"
        tabIndex={0}
        aria-pressed={open}
        icon={<FolderCollectionIcon open={open} />}
        name="Folder"
        pinned
      />
      <CollectionRow
        role="button"
        tabIndex={0}
        aria-pressed={open}
        icon={<BindrCollectionIcon open={open} />}
        name="Bindr"
        pinned
      />
      <PinnedCollectionDrawer count={2} open={open} onOpenChange={setOpen}>
        <CollectionRow
          icon={<FileText size={18} />}
          name="Research brief"
          pinned
        />
        <CollectionRow
          icon={<FolderCollectionIcon />}
          name="Evaluation recordings"
          pinned
        />
      </PinnedCollectionDrawer>
      <span
        style={{
          display: "inline-flex",
          gap: 9,
          alignItems: "center",
          color: "var(--muted)",
        }}
      >
        <PinnedPlaneIcon /> Pinned collection
      </span>
    </div>
  );
}

/** The pin decorates the existing type icon, regardless of resource kind. */
export function PinnedResourceIcons() {
  const [pinned, setPinned] = useState(true);
  const icons = [
    { name: "Memo", icon: <FileText size={18} /> },
    { name: "Folder", icon: <FolderCollectionIcon /> },
    { name: "Episode", icon: <FolderArchive size={18} /> },
    { name: "Video", icon: <Film size={18} /> },
    { name: "Audio", icon: <AudioLines size={18} /> },
    { name: "Image", icon: <Image size={18} /> },
    { name: "JSON", icon: <Braces size={18} /> },
    { name: "Table", icon: <Table2 size={18} /> },
    { name: "Computer", icon: <Monitor size={18} /> },
    { name: "Bindr", icon: <BindrCollectionIcon /> },
  ];
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setPinned(!pinned)}>
        {pinned ? "Show unpinned icons" : "Show pinned icons"}
      </Button>
      <div
        aria-label="Resource pin icon examples"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 4,
          marginTop: 8,
        }}
      >
        {icons.map(({ name, icon }) => (
          <CollectionRow key={name} name={name} icon={icon} pinned={pinned} />
        ))}
      </div>
    </div>
  );
}
