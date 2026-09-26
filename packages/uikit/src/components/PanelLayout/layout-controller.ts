import {
  applyClose,
  applyDock,
  panelLeaf,
  panelSplit,
  type LeafNode,
  type PanelNode,
} from "./panel-tree";
import type {
  LayoutController,
  LayoutPlacement,
  LayoutQuery,
  LayoutRect,
  LayoutRegionInfo,
  LayoutRequest,
  LayoutResolution,
  LayoutResult,
  LayoutSnapshot,
  LayoutView,
} from "./layout-controller.types";

const leaves = (n: PanelNode): LeafNode[] =>
  n.kind === "leaf" ? [n] : n.children.flatMap(leaves);
const replace = (n: PanelNode, id: string, value: PanelNode): PanelNode =>
  n.id === id
    ? value
    : n.kind === "leaf"
      ? n
      : ({
          ...n,
          children: n.children.map((c) => replace(c, id, value)),
        } as PanelNode);
const distance = (a: LayoutRect, b: LayoutRect) =>
  Math.hypot(
    Math.max(0, a.x - b.x - b.width, b.x - a.x - a.width),
    Math.max(0, a.y - b.y - b.height, b.y - a.y - a.height),
  );
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const nonempty = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 1000;
const oneOf = (v: unknown, allowed: string[]) =>
  v === undefined || (typeof v === "string" && allowed.includes(v));
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const metadata = (v: unknown) =>
  object(v) &&
  Object.entries(v).every(
    ([k, x]) =>
      nonempty(k) &&
      (x === null ||
        ["string", "boolean"].includes(typeof x) ||
        (typeof x === "number" && Number.isFinite(x))),
  );
function validQuery(q: unknown): q is LayoutQuery {
  if (!object(q)) return false;
  const keys = [
    "id",
    "name",
    "role",
    "scope",
    "descendants",
    "level",
    "spanning",
    "content",
    "visibility",
    "empty",
    "replaceable",
    "minWidth",
    "minHeight",
    "direction",
    "from",
    "select",
  ];
  return (
    Object.keys(q).every((k) => keys.includes(k)) &&
    ["id", "name", "role", "scope", "from"].every(
      (k) => q[k] === undefined || nonempty(q[k]),
    ) &&
    ["empty", "replaceable", "descendants"].every(
      (k) => q[k] === undefined || typeof q[k] === "boolean",
    ) &&
    ["minWidth", "minHeight"].every(
      (k) =>
        q[k] === undefined ||
        (typeof q[k] === "number" &&
          Number.isFinite(q[k]) &&
          Number(q[k]) >= 0),
    ) &&
    (q.content === undefined || metadata(q.content)) &&
    (q.spanning === undefined ||
      (Array.isArray(q.spanning) &&
        q.spanning.length > 0 &&
        q.spanning.every(nonempty))) &&
    oneOf(q.level, ["panel", "area"]) &&
    oneOf(q.visibility, ["contains", "displays"]) &&
    oneOf(q.direction, ["right", "left", "above", "below"]) &&
    oneOf(q.select, [
      "unique",
      "first",
      "last",
      "original",
      "closest",
      "largest",
      "smallest",
    ]) &&
    (!(q.direction || q.select === "closest") || nonempty(q.from))
  );
}
/** Runtime gate shared by browser callers and JSON agent requests. */
export function validateLayoutRequest(raw: unknown): LayoutRequest {
  if (!object(raw) || JSON.stringify(raw).length > 65536)
    throw new Error("Invalid or oversized layout request");
  const r = raw;
  if (
    r.ifRevision !== undefined &&
    (!Number.isInteger(r.ifRevision) || Number(r.ifRevision) < 0)
  )
    throw new Error("Invalid revision");
  const keys: Record<string, string[]> = {
    open: [
      "view",
      "destination",
      "placement",
      "reuse",
      "mode",
      "name",
      "role",
      "fallback",
    ],
    pin: ["tabId", "pinned"],
    activate: ["tabId"],
    close: ["tabId"],
    name: ["destination", "name"],
    move: ["tabId", "destination", "placement"],
  };
  if (
    typeof r.action !== "string" ||
    !keys[r.action] ||
    Object.keys(r).some(
      (k) => !["action", "ifRevision", ...keys[r.action as string]].includes(k),
    )
  )
    throw new Error("Unknown layout operation or field");
  if ("tabId" in r && !nonempty(r.tabId)) throw new Error("Invalid tab ID");
  if (
    ["pin", "activate", "close", "move"].includes(r.action) &&
    !nonempty(r.tabId)
  )
    throw new Error("Missing tab ID");
  if (r.action === "pin" && typeof r.pinned !== "boolean")
    throw new Error("Invalid pinned state");
  if (["open", "name", "move"].includes(r.action) && !validQuery(r.destination))
    throw new Error("Invalid destination query");
  if (r.action === "name" && !nonempty(r.name)) throw new Error("Invalid name");
  if (
    r.action === "move" &&
    !["tab", "right", "left", "above", "below"].includes(String(r.placement))
  )
    throw new Error("Invalid placement");
  if (r.action === "open") {
    const v = r.view;
    if (
      !object(v) ||
      !nonempty(v.kind) ||
      !nonempty(v.resource) ||
      Object.keys(v).some(
        (k) => !["kind", "resource", "title", "content"].includes(k),
      ) ||
      (v.title !== undefined && !nonempty(v.title)) ||
      (v.content !== undefined && !metadata(v.content))
    )
      throw new Error("Invalid view descriptor");
    if (
      !oneOf(r.placement, ["tab", "right", "left", "above", "below"]) ||
      !oneOf(r.reuse, ["existing", "new-instance"]) ||
      !oneOf(r.mode, ["tab", "preview"])
    )
      throw new Error("Invalid open policy");
    if (["name", "role"].some((k) => r[k] !== undefined && !nonempty(r[k])))
      throw new Error("Invalid destination metadata");
    if (
      r.fallback !== undefined &&
      (!object(r.fallback) ||
        Object.keys(r.fallback).some(
          (k) => !["destination", "placement"].includes(k),
        ) ||
        !validQuery(r.fallback.destination) ||
        !["tab", "right", "left", "above", "below"].includes(
          String(r.fallback.placement),
        ))
    )
      throw new Error("Invalid fallback");
  }
  return clone(raw) as unknown as LayoutRequest;
}

/** Intent controller over a host-owned tree. No React, browser, or application dependency.
 * Region lineage is session-local; view roles and pins travel on leaves through native docking.
 */
export function createLayoutController(host: {
  getRoot(): PanelNode;
  replaceRoot(root: PanelNode): void;
  describe?: (leaf: LeafNode) => LayoutView | undefined;
  createView?: (view: LayoutView) => LeafNode;
  updateView?: (leaf: LeafNode, view: LayoutView) => LeafNode;
  validateView?: (view: LayoutView) => void;
  canDispose?: (leaf: LeafNode) => boolean | Promise<boolean>;
  bounds?: () => LayoutRect;
}): LayoutController {
  let revision = 0,
    sequence = 0,
    fingerprint = "";
  type History = {
    id: string;
    nodeId: string;
    tabIds: string[];
    created: number;
    names: string[];
    originalNames: string[];
  };
  let history: History[] = [];
  const areaNames = new Map<string, string[]>();
  let currentNodes = new Map<string, PanelNode>();
  const describe = (leaf: LeafNode) =>
    host.describe?.(leaf) ?? leaf.layout?.view;
  function inspect(): LayoutSnapshot {
    const root = host.getRoot(),
      rect = host.bounds?.() ?? { x: 0, y: 0, width: 100, height: 100 };
    const nextFingerprint = JSON.stringify([root, rect]);
    if (nextFingerprint !== fingerprint) {
      fingerprint = nextFingerprint;
      revision++;
    }
    const regions: LayoutRegionInfo[] = [],
      used = new Set<string>(),
      nextHistory: History[] = [];
    const live = new Set(leaves(root).map((l) => l.id));
    const previousNodeIds = new Set(currentNodes.keys());
    currentNodes = new Map();
    const walk = (n: PanelNode, bounds: LayoutRect, parentId?: string) => {
      currentNodes.set(n.id, n);
      const ls = leaves(n);
      if (n.kind === "split") {
        regions.push({
          id: n.id,
          nodeId: n.id,
          level: "area",
          parentId,
          names: areaNames.get(n.id) ?? [],
          roles: [],
          created: 0,
          originalNames: areaNames.get(n.id) ?? [],
          bounds,
          tabs: [],
        });
        const total = n.sizes.reduce((a, b) => a + b, 0);
        let offset = 0;
        n.children.forEach((c, i) => {
          const fraction = n.sizes[i] / total;
          const box =
            n.dir === "row"
              ? {
                  ...bounds,
                  x: bounds.x + offset * bounds.width,
                  width: bounds.width * fraction,
                }
              : {
                  ...bounds,
                  y: bounds.y + offset * bounds.height,
                  height: bounds.height * fraction,
                };
          offset += fraction;
          walk(c, box, n.id);
        });
        return;
      }
      const ids = ls.map((l) => l.id);
      // A surviving original tab anchors the original region even if detached siblings move before it.
      let old = history.find((h) => !used.has(h.id) && h.nodeId === n.id);
      if (!old)
        old = history.find(
          (h) =>
            !used.has(h.id) &&
            ids.includes(h.tabIds.find((id) => live.has(id)) ?? ""),
        );
      const inherited = history
        .filter((h) => h.tabIds.some((id) => ids.includes(id)))
        .flatMap((h) => h.names);
      // A native split can create a fresh empty leaf without controller metadata.
      // Inherit the family only from the newly-created enclosing split, never from
      // an unrelated existing neighbor or a tab moved from another region.
      const parent = parentId ? currentNodes.get(parentId) : undefined;
      const splitFamily =
        !old && !inherited.length && parent && !previousNodeIds.has(parent.id)
          ? history
              .filter((h) =>
                leaves(parent).some((l) => h.tabIds.includes(l.id)),
              )
              .flatMap((h) => h.names)
          : [];
      const names = [
        ...new Set([
          ...inherited,
          ...splitFamily,
          ...ls.flatMap((l) => l.layout?.names ?? []),
        ]),
      ];
      const entry: History = old
        ? {
            ...old,
            nodeId: n.id,
            tabIds: ids,
            names: [...new Set([...old.names, ...names])],
          }
        : {
            id: `region-${++sequence}`,
            nodeId: n.id,
            tabIds: ids,
            created: sequence,
            names,
            originalNames: [],
          };
      used.add(entry.id);
      nextHistory.push(entry);
      const active = n.kind === "leaf" ? n.id : n.activeId;
      regions.push({
        id: entry.id,
        nodeId: n.id,
        level: "panel",
        parentId,
        names: entry.names,
        originalNames: entry.originalNames,
        created: entry.created,
        bounds,
        roles: [
          ...new Set(
            ls.flatMap((l) => (l.layout?.role ? [l.layout.role] : [])),
          ),
        ],
        tabs: ls.map((l) => ({
          id: l.id,
          active: l.id === active,
          pinned: !!l.layout?.pinned,
          preview: !!l.layout?.preview,
          role: l.layout?.role,
          view: describe(l),
        })),
      });
    };
    walk(root, rect);
    history = nextHistory;
    // First appearance of a name establishes its original; never reassign after that original closes.
    for (const h of history)
      for (const name of h.names)
        if (!knownNames.has(name)) {
          knownNames.add(name);
          h.originalNames.push(name);
          const r = regions.find((r) => r.id === h.id)!;
          r.originalNames = h.originalNames;
        }
    return clone({
      version: 1,
      revision,
      geometry: host.bounds ? "pixels" : "normalized",
      regions,
    });
  }
  const knownNames = new Set<string>();
  function select(q: LayoutQuery, snapshot: LayoutSnapshot): LayoutResolution {
    const all = snapshot.regions;
    const address = (id: string) =>
      all.find(
        (r) =>
          r.id === id || r.nodeId === id || r.tabs.some((t) => t.id === id),
      );
    let candidates = all.filter((r) => r.level === (q.level ?? "panel"));
    if (q.id) {
      const found = address(q.id);
      candidates = found ? [found] : [];
    }
    if (q.spanning) {
      const targets = q.spanning.map(address);
      if (targets.some((t) => !t)) candidates = [];
      else {
        const ancestors = (r: LayoutRegionInfo): string[] => [
          r.id,
          ...(r.parentId && address(r.parentId)
            ? ancestors(address(r.parentId)!)
            : []),
        ];
        const shared = ancestors(targets[0]!).filter((id) =>
          targets.every((t) => ancestors(t!).includes(id)),
        );
        candidates = shared.length ? [address(shared[0])!] : [];
      }
    }
    if (q.scope) {
      const scope =
        address(q.scope) ?? all.find((r) => r.names.includes(q.scope!));
      if (!scope) candidates = [];
      else {
        const inside = (r: LayoutRegionInfo): boolean =>
          r.parentId === scope.nodeId ||
          !!(
            q.descendants !== false &&
            r.parentId &&
            address(r.parentId) &&
            inside(address(r.parentId)!)
          );
        candidates = candidates.filter(inside);
      }
    }
    const origin = q.from ? address(q.from) : undefined;
    if (q.from && !origin)
      return {
        status: "not-found",
        revision,
        reason: "Source panel no longer exists",
        candidates: [],
      };
    candidates = candidates.filter((r) => {
      if (q.name && !r.names.includes(q.name)) return false;
      if (q.role && !r.roles.includes(q.role)) return false;
      if (q.empty !== undefined && q.empty !== r.tabs.every((t) => !t.view))
        return false;
      if (
        q.replaceable !== undefined &&
        q.replaceable !== r.tabs.some((t) => t.preview && !t.pinned)
      )
        return false;
      if (
        (q.minWidth !== undefined && r.bounds.width < q.minWidth) ||
        (q.minHeight !== undefined && r.bounds.height < q.minHeight)
      )
        return false;
      if (
        q.content &&
        !r.tabs
          .filter((t) => q.visibility !== "displays" || t.active)
          .some((t) =>
            Object.entries(q.content!).every(
              ([k, v]) =>
                (k === "kind"
                  ? t.view?.kind
                  : k === "resource"
                    ? t.view?.resource
                    : t.view?.content?.[k]) === v,
            ),
          )
      )
        return false;
      if (q.direction && origin) {
        const a = origin.bounds,
          b = r.bounds;
        if (r.id === origin.id) return false;
        const eps = 0.01;
        return q.direction === "right"
          ? b.x >= a.x + a.width - eps
          : q.direction === "left"
            ? b.x + b.width <= a.x + eps
            : q.direction === "below"
              ? b.y >= a.y + a.height - eps
              : b.y + b.height <= a.y + eps;
      }
      return true;
    });
    const choice = q.select ?? "unique";
    if (choice === "original")
      candidates = candidates.filter((r) =>
        q.name ? r.originalNames.includes(q.name) : false,
      );
    if (["first", "last", "largest", "smallest", "closest"].includes(choice)) {
      const score = (r: LayoutRegionInfo) =>
        choice === "first"
          ? r.created
          : choice === "last"
            ? -r.created
            : choice === "largest"
              ? -r.bounds.width * r.bounds.height
              : choice === "smallest"
                ? r.bounds.width * r.bounds.height
                : distance(origin!.bounds, r.bounds);
      candidates.sort(
        (a, b) =>
          score(a) - score(b) ||
          a.created - b.created ||
          a.id.localeCompare(b.id),
      );
      candidates = candidates.slice(0, 1);
    }
    return {
      status:
        candidates.length === 1
          ? "ready"
          : candidates.length
            ? "ambiguous"
            : "not-found",
      revision,
      reason:
        candidates.length === 1
          ? `Selected by ${choice}${q.name ? ` in ${q.name}` : ""}`
          : candidates.length
            ? "Multiple destinations match; specify a selector"
            : "No destination matches",
      candidates: candidates.map((r) => r.id),
      ...(candidates.length === 1 ? { panelId: candidates[0].id } : {}),
    };
  }
  function resolve(raw: LayoutRequest): LayoutResolution {
    const snapshot = inspect();
    let r: LayoutRequest;
    try {
      r = validateLayoutRequest(raw);
      if (r.action === "open") host.validateView?.(r.view);
    } catch (e) {
      return {
        status: "invalid",
        revision,
        reason: String(e instanceof Error ? e.message : e),
        candidates: [],
      };
    }
    if (r.ifRevision !== undefined && r.ifRevision !== revision)
      return {
        status: "stale",
        revision,
        reason: "Layout changed; inspect and resolve again",
        candidates: [],
      };
    if ("tabId" in r) {
      const region = snapshot.regions.find((p) =>
        p.tabs.some((t) => t.id === r.tabId),
      );
      if (!region)
        return {
          status: "not-found",
          revision,
          reason: "Tab no longer exists",
          candidates: [],
        };
      if (r.action !== "move")
        return {
          status: "ready",
          revision,
          reason: `${r.action} addressed tab`,
          candidates: [region.id],
          panelId: region.id,
          tabId: r.tabId,
          effect: r.action,
        };
    }
    if (r.action === "open" && r.reuse !== "new-instance") {
      const existing = snapshot.regions
        .flatMap((p) => p.tabs.map((t) => ({ p, t })))
        .filter(
          ({ t }) =>
            t.view?.kind === r.view.kind && t.view.resource === r.view.resource,
        );
      if (existing.length) {
        const found = existing.find((x) => x.t.active) ?? existing[0];
        return {
          status: "ready",
          revision,
          reason: "Existing resource takes precedence over placement",
          candidates: [found.p.id],
          panelId: found.p.id,
          tabId: found.t.id,
          effect: "activate",
        };
      }
    }
    const targeted = r as Extract<LayoutRequest, { destination: LayoutQuery }>;
    let result = select(targeted.destination, snapshot);
    let placement: "tab" | "right" | "left" | "above" | "below" =
      "placement" in r ? (r.placement ?? "tab") : "tab";
    if (result.status === "not-found" && r.action === "open" && r.fallback) {
      result = select(r.fallback.destination, snapshot);
      placement = r.fallback.placement;
      result.reason = `Fallback: ${result.reason}`;
    }
    if (result.status !== "ready") return result;
    const region = snapshot.regions.find((p) => p.id === result.panelId)!;
    if (placement === "tab" && region.level === "area" && r.action !== "name")
      return {
        ...result,
        status: "invalid",
        reason:
          "A spatial area cannot hold tabs; select a child panel or split beside the area",
      };
    if (
      r.action === "move" &&
      region.tabs.some((t) => t.id === r.tabId) &&
      (placement === "tab" || region.tabs.length < 2)
    )
      return {
        ...result,
        status: "invalid",
        reason: "Source and destination are the same panel",
      };
    if (r.action === "open") {
      const eligible =
        placement === "tab" && r.mode === "preview"
          ? region.tabs.filter(
              (t) => t.preview && !t.pinned && (!r.role || t.role === r.role),
            )
          : [];
      const replacing =
        eligible.find((t) => t.active) ?? eligible[eligible.length - 1];
      return {
        ...result,
        placement,
        effect: replacing ? "replace" : "create",
        tabId: replacing?.id,
      };
    }
    return {
      ...result,
      placement,
      effect: r.action === "name" ? "name" : "move",
      tabId: "tabId" in r ? r.tabId : undefined,
    };
  }
  async function apply(raw: LayoutRequest): Promise<LayoutResult> {
    const result = resolve(raw);
    if (result.status !== "ready") return result;
    const r = validateLayoutRequest(raw),
      root = host.getRoot(),
      before = revision;
    if ((result.effect === "replace" || r.action === "close") && result.tabId) {
      const leaf = leaves(root).find((l) => l.id === result.tabId)!;
      if (host.canDispose && !(await host.canDispose(leaf)))
        return {
          ...result,
          status: "blocked",
          reason: "View disposal guard refused the operation",
        };
      inspect();
      if (before !== revision)
        return {
          ...result,
          status: "stale",
          revision,
          reason:
            "Layout changed during disposal guard; retry from a fresh inspection",
        };
    }
    const snapshot = inspect(),
      region = snapshot.regions.find((p) => p.id === result.panelId)!;
    const node = currentNodes.get(region.nodeId)!;
    let next = root,
      tabId = result.tabId;
    if (r.action === "name") {
      if (region.level === "area") {
        areaNames.set(region.nodeId, [
          ...new Set([...(areaNames.get(region.nodeId) ?? []), r.name]),
        ]);
        revision++;
      } else
        next = mapLeaves(root, (l) =>
          region.tabs.some((t) => t.id === l.id)
            ? {
                ...l,
                layout: {
                  ...l.layout,
                  names: [...new Set([...(l.layout?.names ?? []), r.name])],
                },
              }
            : l,
        );
    } else if (r.action === "pin")
      next = mapLeaves(root, (l) =>
        l.id === r.tabId
          ? { ...l, layout: { ...l.layout, pinned: r.pinned } }
          : l,
      );
    else if (r.action === "close")
      next = applyClose(root, r.tabId) ?? panelLeaf();
    else if (r.action === "activate") next = activate(root, r.tabId);
    else if (r.action === "move") {
      // Native docking preserves leaf metadata and connected content identity.
      if (region.level === "area") {
        const leaf = leaves(root).find((l) => l.id === r.tabId)!;
        if (leaves(node).some((l) => l.id === r.tabId))
          return {
            ...result,
            status: "invalid",
            reason: "Cannot move a tab beside an area that contains itself",
          };
        next = applyClose(root, r.tabId)!;
        next = replace(next, node.id, splitAround(node, leaf, r.placement));
      } else
        next = applyDock(
          root,
          r.tabId,
          (region.tabs.find((t) => t.active && t.id !== r.tabId) ??
            region.tabs.find((t) => t.id !== r.tabId))!.id,
          r.placement === "tab"
            ? "center"
            : r.placement === "above"
              ? "top"
              : r.placement === "below"
                ? "bottom"
                : r.placement,
        );
    } else if (r.action === "open") {
      if (result.effect === "activate") {
        next = mapLeaves(root, (l) =>
          l.id === result.tabId
            ? (host.updateView?.(l, r.view) ?? {
                ...l,
                layout: { ...l.layout, view: r.view },
              })
            : l,
        );
        next = activate(next, result.tabId!);
      } else {
        let leaf =
          host.createView?.(r.view) ??
          panelLeaf({
            view: r.view.kind,
            title: r.view.title ?? r.view.resource,
          });
        leaf = {
          ...leaf,
          layout: {
            ...leaf.layout,
            view: r.view,
            preview: r.mode === "preview",
            role: r.role,
            names: [
              ...new Set([
                ...(r.name ? [r.name] : []),
                ...(result.placement !== "tab" ? region.names : []),
              ]),
            ],
          },
        };
        tabId = leaf.id;
        if (result.effect === "replace") {
          const old = leaves(root).find((l) => l.id === result.tabId)!;
          leaf.layout = {
            ...old.layout,
            ...leaf.layout,
            names: [
              ...new Set([
                ...(old.layout?.names ?? []),
                ...(leaf.layout?.names ?? []),
              ]),
            ],
          };
          next = replace(root, old.id, leaf);
          next = mapNodes(next, (n) =>
            n.kind === "group" && n.activeId === old.id
              ? { ...n, activeId: leaf.id }
              : n,
          );
          history = history.map((h) => ({
            ...h,
            tabIds: h.tabIds.map((id) => (id === old.id ? leaf.id : id)),
          }));
        } else if (result.placement === "tab") {
          const tabs = leaves(node).filter((l) => describe(l));
          next = replace(root, node.id, {
            kind: "group",
            id: node.kind === "group" ? node.id : `panel-${leaf.id}`,
            keepTabs: true,
            children: [...tabs, leaf],
            activeId: leaf.id,
          });
          if (!tabs.length)
            history = history.map((h) =>
              h.id === region.id ? { ...h, tabIds: [leaf.id] } : h,
            );
        } else
          next = replace(
            root,
            node.id,
            splitAround(node, leaf, result.placement!),
          );
      }
    }
    if (next !== root) host.replaceRoot(next);
    const after = inspect(),
      actual = after.regions.find((p) => p.tabs.some((t) => t.id === tabId));
    return {
      ...result,
      status: "applied",
      revision: after.revision,
      tabId,
      panelId: actual?.id ?? result.panelId,
    };
  }
  return { inspect, resolve, apply };
}
function mapLeaves(
  root: PanelNode,
  fn: (leaf: LeafNode) => LeafNode,
): PanelNode {
  return root.kind === "leaf"
    ? fn(root)
    : ({
        ...root,
        children: root.children.map((c) => mapLeaves(c, fn)),
      } as PanelNode);
}
function mapNodes(
  root: PanelNode,
  fn: (node: PanelNode) => PanelNode,
): PanelNode {
  return fn(
    root.kind === "leaf"
      ? root
      : ({
          ...root,
          children: root.children.map((c) => mapNodes(c, fn)),
        } as PanelNode),
  );
}
function splitAround(
  node: PanelNode,
  incoming: LeafNode,
  placement: LayoutPlacement,
): PanelNode {
  const before = placement === "left" || placement === "above";
  return panelSplit(
    placement === "left" || placement === "right" ? "row" : "column",
    before ? [incoming, node] : [node, incoming],
  );
}

function activate(root: PanelNode, id: string): PanelNode {
  return mapNodes(root, (n) =>
    n.kind === "group" && n.children.some((c) => c.id === id)
      ? { ...n, activeId: id }
      : n,
  );
}
