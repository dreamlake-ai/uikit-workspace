import { describe, it, expect } from "vitest";
import {
  createLayoutController,
  validateLayoutRequest,
} from "./layout-controller";
import {
  applyDock,
  panelLeaf,
  panelGroup,
  panelSplit,
  normalizeTree,
  type PanelNode,
  type LeafNode,
} from "./panel-tree";
import type { LayoutOpenRequest, LayoutQuery } from "./layout-controller.types";
const view = (
  id: string,
  kind = "note",
  extra: Partial<NonNullable<LeafNode["layout"]>> = {},
): LeafNode => ({
  ...panelLeaf({ view: kind, title: id }),
  layout: { view: { kind, resource: id }, ...extra },
});
const X = { kind: "artifact", resource: "X" };
function fixture(root: PanelNode, guard?: () => boolean | Promise<boolean>) {
  let tree = root;
  const api = createLayoutController({
    getRoot: () => tree,
    replaceRoot: (n) => {
      tree = normalizeTree(n);
    },
    canDispose: guard,
  });
  return {
    api,
    get root() {
      return tree;
    },
    set root(n: PanelNode) {
      tree = n;
    },
  };
}
const open = (
  destination: LayoutQuery,
  extra: Partial<LayoutOpenRequest> = {},
): LayoutOpenRequest => ({ action: "open", view: X, destination, ...extra });
const all = (root: PanelNode): LeafNode[] =>
  root.kind === "leaf" ? [root] : root.children.flatMap(all);
describe("layout request controller", () => {
  it.each(["tab", "right", "below", "left", "above"] as const)(
    "opens atomically with %s placement",
    async (placement) => {
      const a = view("A");
      const f = fixture(a);
      const before = f.api.inspect();
      const plan = f.api.resolve(open({ id: a.id }, { placement }));
      expect(plan.status).toBe("ready");
      expect(f.api.inspect()).toEqual(before);
      const result = await f.api.apply(open({ id: a.id }, { placement }));
      expect(result.status).toBe("applied");
      expect(all(f.root).map((l) => l.layout?.view?.resource)).toContain("X");
      expect(f.root.kind).toBe(placement === "tab" ? "group" : "split");
    },
  );
  it("splits beside a whole tab group, retaining its active tab", async () => {
    const a = view("A"),
      b = view("B");
    const group = panelGroup([a, b], 1);
    const f = fixture(group);
    await f.api.apply(open({ id: b.id }, { placement: "right" }));
    expect(f.root.kind).toBe("split");
    if (f.root.kind === "split") expect(f.root.children[0]).toEqual(group);
  });
  it("spans stacked panels without extracting either view", async () => {
    const a = view("A"),
      b = view("B");
    const f = fixture(panelSplit("column", [a, b]));
    const original = f.root;
    await f.api.apply(open({ spanning: [a.id, b.id] }, { placement: "right" }));
    expect(f.root.kind).toBe("split");
    if (f.root.kind === "split") {
      expect(f.root.dir).toBe("row");
      expect(f.root.children[0]).toEqual(original);
    }
  });
  it("spawns below only the requested region", async () => {
    const a = view("A"),
      list = view("List");
    const f = fixture(panelSplit("row", [list, a]));
    await f.api.apply(open({ id: a.id }, { placement: "below" }));
    if (f.root.kind !== "split") throw Error();
    expect(f.root.children[0]).toEqual(list);
    expect(f.root.children[1].kind).toBe("split");
  });
  it("activates existing without rearranging tabs or allocating a split", async () => {
    const a = view("A"),
      x = view("X", "artifact"),
      y = view("Y");
    const f = fixture(panelSplit("row", [a, panelGroup([x, y], 1)]));
    const ids = all(f.root).map((l) => l.id);
    const result = await f.api.apply(
      open({ id: a.id }, { placement: "right" }),
    );
    expect(result.effect).toBe("activate");
    expect(all(f.root).map((l) => l.id)).toEqual(ids);
    expect(
      f.api
        .inspect()
        .regions.flatMap((r) => r.tabs)
        .find((t) => t.id === x.id)?.active,
    ).toBe(true);
  });
  it("permits explicit duplicate instances", async () => {
    const a = view("A"),
      x = view("X", "artifact");
    const f = fixture(panelSplit("row", [a, x]));
    await f.api.apply(open({ id: a.id }, { reuse: "new-instance" }));
    expect(
      all(f.root).filter((l) => l.layout?.view?.resource === "X"),
    ).toHaveLength(2);
  });
  it("pin protects replacement but not explicit close", async () => {
    const a = view("A"),
      x = view("X", "artifact", { preview: true, role: "preview" });
    const f = fixture(panelSplit("row", [a, x]));
    await f.api.apply({ action: "pin", tabId: x.id, pinned: true });
    await f.api.apply(
      open(
        { role: "preview" },
        { view: { ...X, resource: "Y" }, mode: "preview", role: "preview" },
      ),
    );
    expect(all(f.root).map((l) => l.layout?.view?.resource)).toEqual([
      "A",
      "X",
      "Y",
    ]);
    await f.api.apply(
      open(
        { role: "preview" },
        { view: { ...X, resource: "Z" }, mode: "preview", role: "preview" },
      ),
    );
    expect(all(f.root).map((l) => l.layout?.view?.resource)).toEqual([
      "A",
      "X",
      "Z",
    ]);
    expect((await f.api.apply({ action: "close", tabId: x.id })).status).toBe(
      "applied",
    );
  });
  it("rejects a guard refusal without changing the tree", async () => {
    const x = view("old", "artifact", { preview: true });
    const f = fixture(x, () => false);
    const before = f.root;
    expect(
      (await f.api.apply(open({ id: x.id }, { mode: "preview" }))).status,
    ).toBe("blocked");
    expect(f.root).toBe(before);
  });
  it("rechecks layout revision after an asynchronous guard", async () => {
    let release!: (v: boolean) => void;
    const x = view("old", "artifact", { preview: true });
    const f = fixture(
      x,
      () =>
        new Promise((r) => {
          release = r;
        }),
    );
    const pending = f.api.apply(open({ id: x.id }, { mode: "preview" }));
    f.root = panelSplit("row", [x, view("B")]);
    release(true);
    expect((await pending).status).toBe("stale");
    expect(all(f.root)).toHaveLength(2);
  });
  it("refuses stale explicit revisions", async () => {
    const a = view("A");
    const f = fixture(a);
    const revision = f.api.inspect().revision;
    f.root = panelSplit("row", [a, view("B")]);
    expect(
      (await f.api.apply(open({ id: a.id }, { ifRevision: revision }))).status,
    ).toBe("stale");
  });
  it("reports ambiguity and permits an explicit creation fallback", async () => {
    const a = view("A"),
      b = view("B");
    const f = fixture(panelSplit("row", [a, b]));
    expect(f.api.resolve(open({})).status).toBe("ambiguous");
    const result = await f.api.apply(
      open(
        { name: "preview" },
        {
          name: "preview",
          fallback: { destination: { id: a.id }, placement: "right" },
        },
      ),
    );
    expect(result.status).toBe("applied");
    expect(
      f.api.resolve(
        open({ name: "preview" }, { view: { ...X, resource: "Y" } }),
      ).status,
    ).toBe("ready");
  });
  it("does not apply fallback to ambiguity", () => {
    const f = fixture(panelSplit("row", [view("A"), view("B")]));
    expect(
      f.api.resolve(
        open(
          {},
          {
            fallback: { destination: { select: "first" }, placement: "right" },
          },
        ),
      ).status,
    ).toBe("ambiguous");
  });
  it("preserves original identity when detached tab moves before original", async () => {
    const x = view("X", "artifact"),
      y = view("Y", "artifact");
    const f = fixture(panelGroup([x, y], 1));
    await f.api.apply({
      action: "name",
      destination: { id: x.id },
      name: "preview",
    });
    const original = f.api
      .inspect()
      .regions.find((r) => r.level === "panel")!.id;
    f.root = applyDock(f.root, y.id, x.id, "top");
    const snapshot = f.api.inspect();
    expect(
      snapshot.regions.filter((r) => r.names.includes("preview")),
    ).toHaveLength(2);
    expect(
      f.api.resolve(
        open(
          { name: "preview", select: "original" },
          { view: { ...X, resource: "Z" } },
        ),
      ).panelId,
    ).toBe(original);
    const last = f.api.resolve(
      open(
        { name: "preview", select: "last" },
        { view: { ...X, resource: "Z" } },
      ),
    );
    expect(
      snapshot.regions.find((r) => r.id === last.panelId)?.tabs[0].id,
    ).toBe(y.id);
  });
  it("keeps name and origin through replacement", async () => {
    const x = view("old", "artifact", { preview: true, names: ["preview"] });
    const f = fixture(x);
    const original = f.api.inspect().regions[0].id;
    await f.api.apply(open({ name: "preview" }, { mode: "preview" }));
    expect(
      f.api.resolve(
        open(
          { name: "preview", select: "original" },
          { view: { ...X, resource: "Y" } },
        ),
      ).panelId,
    ).toBe(original);
  });
  it("keeps original closed rather than silently electing a successor", async () => {
    const x = view("X"),
      y = view("Y");
    const f = fixture(panelGroup([x, y]));
    await f.api.apply({
      action: "name",
      destination: { id: x.id },
      name: "preview",
    });
    f.root = applyDock(f.root, y.id, x.id, "right");
    f.api.inspect();
    await f.api.apply({ action: "close", tabId: x.id });
    expect(
      f.api.resolve(open({ name: "preview", select: "original" })).status,
    ).toBe("not-found");
  });
  it("distinguishes contains from displays", () => {
    const x = view("X", "artifact"),
      a = view("A"),
      z = view("Z", "artifact");
    const f = fixture(panelSplit("row", [panelGroup([x, a], 1), z]));
    expect(
      f.api.resolve(
        open({ content: { kind: "artifact" } }, { reuse: "new-instance" }),
      ).status,
    ).toBe("ambiguous");
    const r = f.api.resolve(
      open(
        { content: { kind: "artifact" }, visibility: "displays" },
        { reuse: "new-instance" },
      ),
    );
    expect(
      f.api.inspect().regions.find((p) => p.id === r.panelId)?.tabs[0].id,
    ).toBe(z.id);
  });
  it("filters content by project metadata", () => {
    const a = view("A"),
      b = view("B");
    a.layout!.view!.content = { project: "alpha" };
    b.layout!.view!.content = { project: "beta" };
    const f = fixture(panelSplit("row", [a, b]));
    const r = f.api.resolve(open({ content: { project: "beta" } }));
    expect(
      f.api.inspect().regions.find((p) => p.id === r.panelId)?.tabs[0].id,
    ).toBe(b.id);
  });
  it("selects closest right panel and largest empty area", () => {
    const a = view("A"),
      small = panelLeaf(),
      large = panelLeaf();
    const f = fixture(panelSplit("row", [a, small, large], [30, 20, 50]));
    const near = f.api.resolve(
      open({ from: a.id, direction: "right", select: "closest" }),
    );
    expect(
      f.api.inspect().regions.find((p) => p.id === near.panelId)?.tabs[0].id,
    ).toBe(small.id);
    const largest = f.api.resolve(open({ empty: true, select: "largest" }));
    expect(
      f.api.inspect().regions.find((p) => p.id === largest.panelId)?.tabs[0].id,
    ).toBe(large.id);
  });
  it("addresses the group on the right and inserts below the entire area", async () => {
    const a = view("A"),
      p = view("P"),
      q = view("Q"),
      right = panelSplit("column", [p, q]);
    const f = fixture(panelSplit("row", [a, right]));
    const request = open(
      { level: "area", from: a.id, direction: "right", select: "closest" },
      { placement: "below" },
    );
    expect(f.api.resolve(request).panelId).toBe(right.id);
    await f.api.apply(request);
    if (f.root.kind !== "split") throw Error();
    expect(f.root.children[1].kind).toBe("split");
  });
  it("rejects tab insertion directly into a spatial group", () => {
    const f = fixture(panelSplit("column", [view("A"), view("B")]));
    expect(f.api.resolve(open({ level: "area" })).status).toBe("invalid");
  });
  it("does not mutate returned inspection data", () => {
    const f = fixture(view("A"));
    const s = f.api.inspect();
    s.regions[0].tabs[0].view!.resource = "changed";
    expect(f.api.inspect().regions[0].tabs[0].view?.resource).toBe("A");
  });
  it.each([
    { action: "open", view: X, destination: { select: "closest" } },
    { action: "pin", tabId: "x", pinned: "yes" },
    { action: "open", view: X, destination: {}, placement: "diagonal" },
    { action: "open", view: X, destination: {}, unknown: true },
  ])("rejects invalid JSON %#", (r) =>
    expect(() => validateLayoutRequest(r)).toThrow(),
  );
});

import { layoutExampleSets } from "./layout-examples";
for (const set of layoutExampleSets)
  for (const branch of set.branches)
    it(`documentation fork: ${set.id} / ${branch.title}`, async () => {
      const f = fixture(set.start(), () => branch.guard !== false);
      let result;
      for (const request of branch.requests) {
        const plan = f.api.resolve(request);
        result = await f.api.apply(request);
        if (result.status !== "applied") break;
        expect(plan.status).toBe("ready");
      }
      expect(result?.status).toBe(branch.expected ?? "applied");
    });

it("uses the host empty view when closing its last tab", async () => {
  const a = view("A");
  let root: PanelNode = a;
  const api = createLayoutController({
    getRoot: () => root,
    replaceRoot: (n) => {
      root = n;
    },
    createEmpty: () => panelLeaf({ view: "host-empty" }),
  });
  await api.apply({ action: "close", tabId: a.id });
  expect(all(root)[0].view).toBe("host-empty");
});
