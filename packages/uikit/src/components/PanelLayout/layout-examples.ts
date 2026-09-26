/** Executable documentation fixtures. Each branch forks the same starting layout. */
import type { LeafNode, PanelNode } from "./panel-tree";
import type {
  LayoutQuery,
  LayoutRequest,
  LayoutView,
} from "./layout-controller.types";
let seed = 0;
const v = (
  id: string,
  kind = "note",
  metadata: Partial<NonNullable<LeafNode["layout"]>> = {},
): LeafNode => ({
  kind: "leaf",
  id,
  n: ++seed,
  instanceId: id,
  view: kind,
  title: id,
  layout: { view: { kind, resource: id }, ...metadata },
});
const x = (id = "X", metadata: Partial<NonNullable<LeafNode["layout"]>> = {}) =>
  v(id, "artifact", metadata);
const empty = (id: string): LeafNode => ({ kind: "leaf", id, n: ++seed });
const tabs = (...children: LeafNode[]): PanelNode => ({
  kind: "group",
  id: `tabs-${children.map((c) => c.id).join("-")}`,
  children,
  activeId: children[children.length - 1].id,
  keepTabs: true,
});
const split = (dir: "row" | "column", ...children: PanelNode[]): PanelNode => ({
  kind: "split",
  id: `split-${++seed}`,
  dir,
  children,
  sizes: children.map(() => 100 / children.length),
});
const row = (...c: PanelNode[]) => split("row", ...c),
  col = (...c: PanelNode[]) => split("column", ...c);
const open = (
  destination: LayoutQuery,
  placement: "tab" | "right" | "below" = "tab",
  extra: Record<string, unknown> = {},
): LayoutRequest =>
  ({
    action: "open",
    view: { kind: "artifact", resource: "X", title: "X" },
    destination,
    placement,
    ...extra,
  }) as LayoutRequest;
export interface LayoutExampleBranch {
  title: string;
  explanation: string;
  requests: LayoutRequest[];
  expected?: string;
  guard?: boolean;
}
export interface LayoutExampleSet {
  id: string;
  title: string;
  description: string;
  start: () => PanelNode;
  branches: LayoutExampleBranch[];
}
const branch = (
  title: string,
  explanation: string,
  ...requests: LayoutRequest[]
): LayoutExampleBranch => ({ title, explanation, requests });
export const layoutExampleSets: LayoutExampleSet[] = [
  {
    id: "single",
    title: "One panel",
    description: "Same source, three placements. No existing X.",
    start: () => v("A"),
    branches: [
      branch("Tab", "A remains mounted behind X.", open({ id: "A" })),
      branch(
        "Right",
        "A stays visible to the left.",
        open({ id: "A" }, "right"),
      ),
      branch("Below", "A stays visible above.", open({ id: "A" }, "below")),
    ],
  },
  {
    id: "two-regions",
    title: "List and editor",
    description: "The editor is the source. Only its region is divided.",
    start: () => row(v("List", "list"), v("A")),
    branches: [
      branch("Tab in editor", "The list stays untouched.", open({ id: "A" })),
      branch(
        "Right of editor",
        "The editor region is split, not the whole page.",
        open({ id: "A" }, "right"),
      ),
      branch(
        "Below editor",
        "The list retains its full height.",
        open({ id: "A" }, "below"),
      ),
    ],
  },
  {
    id: "tab-group",
    title: "A source with two tabs",
    description:
      "B is active. Placement beside B means beside its entire panel.",
    start: () => tabs(v("A"), v("B")),
    branches: [
      branch(
        "Third tab",
        "A and B remain in the same panel.",
        open({ id: "B" }),
      ),
      branch(
        "Right of group",
        "Neither existing tab is extracted.",
        open({ id: "B" }, "right"),
      ),
      branch(
        "Below group",
        "The source group retains its active tab.",
        open({ id: "B" }, "below"),
      ),
    ],
  },
  {
    id: "span",
    title: "One panel versus the whole area",
    description: "A is above B. Choose the placement scope explicitly.",
    start: () => col(v("A"), v("B")),
    branches: [
      branch("Right of A", "Only A is split.", open({ id: "A" }, "right")),
      branch(
        "Right of both",
        "X spans the combined height.",
        open({ spanning: ["A", "B"] }, "right"),
      ),
      branch(
        "Below both",
        "X is below the combined area.",
        open({ spanning: ["A", "B"] }, "below"),
      ),
    ],
  },
  {
    id: "wide",
    title: "A full-width bottom panel",
    description: "A and B begin side by side.",
    start: () => row(v("A"), v("B")),
    branches: [
      branch("Below A", "B keeps its full height.", open({ id: "A" }, "below")),
      branch(
        "Below both",
        "X spans the combined width.",
        open({ spanning: ["A", "B"] }, "below"),
      ),
    ],
  },
  {
    id: "detach",
    title: "Detach a named preview tab",
    description:
      "Preview originally contains Y and Z. First detach Z below Y; then choose where X opens.",
    start: () =>
      row(
        v("A"),
        tabs(
          x("Y", { names: ["preview"], role: "preview" }),
          x("Z", { names: ["preview"], role: "preview" }),
        ),
      ),
    branches: [
      branch(
        "Original",
        "The original named region remains anchored to Y.",
        {
          action: "move",
          tabId: "Z",
          destination: { id: "Y" },
          placement: "below",
        },
        open({ name: "preview", select: "original" }),
      ),
      branch(
        "Last",
        "The detached region is the newest preview family member.",
        {
          action: "move",
          tabId: "Z",
          destination: { id: "Y" },
          placement: "below",
        },
        open({ name: "preview", select: "last" }),
      ),
      branch(
        "Closest right",
        "Geometry selects the nearest panel; ties use creation order.",
        {
          action: "move",
          tabId: "Z",
          destination: { id: "Y" },
          placement: "below",
        },
        open({ from: "A", direction: "right", select: "closest" }),
      ),
      branch(
        "Right-hand group",
        "Open below the whole group right of A.",
        {
          action: "move",
          tabId: "Z",
          destination: { id: "Y" },
          placement: "below",
        },
        open(
          { level: "area", from: "A", direction: "right", select: "closest" },
          "below",
        ),
      ),
      branch(
        "Contains Z",
        "Content follows Z to its new location.",
        {
          action: "move",
          tabId: "Z",
          destination: { id: "Y" },
          placement: "below",
        },
        open({ content: { resource: "Z" } }),
      ),
    ],
  },
  {
    id: "reuse",
    title: "X already exists",
    description: "X is inactive behind Y in the right panel.",
    start: () => row(v("A"), tabs(x(), v("Y"))),
    branches: [
      branch(
        "Activate existing",
        "No tab order or geometry changes.",
        open({ id: "A" }, "right"),
      ),
      branch(
        "New instance",
        "Create a second independent X.",
        open({ id: "A" }, "right", { reuse: "new-instance" }),
      ),
    ],
  },
  {
    id: "pin",
    title: "Preview replacement and pins",
    description: "Y is an unpinned preview on the right.",
    start: () => row(v("A"), x("Y", { preview: true, role: "preview" })),
    branches: [
      branch(
        "Replace preview",
        "X replaces the eligible preview Y.",
        open({ role: "preview" }, "tab", { mode: "preview", role: "preview" }),
      ),
      branch(
        "Pin then open",
        "Pinned Y survives and X becomes another tab.",
        { action: "pin", tabId: "Y", pinned: true },
        open({ role: "preview" }, "tab", { mode: "preview", role: "preview" }),
      ),
      branch(
        "Pin, open, open again",
        "Z replaces unpinned X while pinned Y survives.",
        { action: "pin", tabId: "Y", pinned: true },
        open({ role: "preview" }, "tab", { mode: "preview", role: "preview" }),
        open({ role: "preview" }, "tab", {
          view: { kind: "artifact", resource: "Z" },
          mode: "preview",
          role: "preview",
        }),
      ),
      branch(
        "Pin then explicitly close",
        "A pin prevents replacement, not an explicit guarded close.",
        { action: "pin", tabId: "Y", pinned: true },
        { action: "close", tabId: "Y" },
      ),
    ],
  },
  {
    id: "content",
    title: "Contains versus displays",
    description:
      "The middle panel contains an inactive artifact Y. The right panel displays artifact Z.",
    start: () => row(v("A"), tabs(x("Y"), v("B")), x("Z")),
    branches: [
      {
        ...branch(
          "Contains artifact",
          "Two regions qualify; no implicit choice.",
          open({ content: { kind: "artifact" } }),
        ),
        expected: "ambiguous",
      },
      branch(
        "Displays artifact",
        "Only the active artifact Z qualifies.",
        open({ content: { kind: "artifact" }, visibility: "displays" }),
      ),
      branch(
        "Contains exact Y",
        "Inactive tabs can identify a destination.",
        open({ content: { resource: "Y" } }),
      ),
      branch(
        "Same project",
        "Application metadata provides the project relation.",
        open({ content: { project: "alpha" } }),
      ),
    ].map((b) => b),
  },
  {
    id: "available-space",
    title: "Available space",
    description: "Two empty panels sit to the right of A; their sizes differ.",
    start: () =>
      ({
        ...row(v("A"), empty("Small"), empty("Large")),
        sizes: [30, 20, 50],
      }) as PanelNode,
    branches: [
      branch(
        "Closest empty",
        "Choose the nearer empty panel.",
        open({ empty: true, from: "A", direction: "right", select: "closest" }),
      ),
      branch(
        "Largest empty",
        "Choose the largest available region.",
        open({ empty: true, select: "largest" }),
      ),
    ],
  },
  {
    id: "fallback",
    title: "No destination, ambiguity, and guards",
    description: "Only A exists. Failures keep the starting layout intact.",
    start: () => v("A"),
    branches: [
      {
        ...branch(
          "Missing destination",
          "No implicit creation when a named destination is absent.",
          open({ name: "preview" }),
        ),
        expected: "not-found",
      },
      branch(
        "Create if absent",
        "An explicit fallback creates Preview beside A.",
        open({ name: "preview" }, "tab", {
          name: "preview",
          role: "preview",
          fallback: { destination: { id: "A" }, placement: "right" },
        }),
      ),
      {
        ...branch(
          "Save guard blocks close",
          "Disposal is checked before changing the layout.",
          { action: "close", tabId: "A" },
        ),
        guard: false,
        expected: "blocked",
      },
      {
        ...branch(
          "Stale revision",
          "An old inspection cannot authorize a new mutation.",
          open({ id: "A" }, "right", { ifRevision: 0 }),
        ),
        expected: "stale",
      },
    ],
  },
];
// The host supplies project metadata; the query language remains domain-neutral.
const contentSet = layoutExampleSets.find((s) => s.id === "content")!;
const initialContent = contentSet.start;
contentSet.start = () => {
  const root = initialContent();
  if (root.kind === "split") {
    const last = root.children[2] as LeafNode;
    last.layout!.view!.content = { project: "alpha" };
  }
  return root;
};
