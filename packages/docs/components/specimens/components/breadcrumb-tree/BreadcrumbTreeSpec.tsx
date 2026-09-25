import { useRef, useState } from "react";
import { BreadcrumbTree } from "@dreamlake/uikit";
import type { BreadcrumbMove } from "@dreamlake/uikit";

type Node = { id: string; name: string; hasChildren?: boolean };

const SEED: Record<string, Node[]> = {
  dreamlake: [
    { id: "datasets", name: "datasets", hasChildren: true },
    { id: "models", name: "models", hasChildren: true },
    { id: "experiments", name: "experiments", hasChildren: true },
    { id: "logs", name: "logs", hasChildren: false },
  ],
  "dreamlake/datasets": [
    { id: "datasets/droid-2024", name: "droid-2024", hasChildren: true },
    { id: "datasets/ego4d", name: "ego4d", hasChildren: true },
    { id: "datasets/imagenet", name: "imagenet", hasChildren: false },
    { id: "datasets/mujoco", name: "mujoco", hasChildren: false },
  ],
  "dreamlake/models": [
    { id: "models/pi0", name: "pi0", hasChildren: true },
    { id: "models/pi0-v2", name: "pi0-v2", hasChildren: false },
    { id: "models/octo", name: "octo", hasChildren: false },
  ],
  "dreamlake/experiments": [
    { id: "experiments/2026-q1", name: "2026-q1", hasChildren: true },
    { id: "experiments/2026-q2", name: "2026-q2", hasChildren: true },
    { id: "experiments/ablations", name: "ablations", hasChildren: false },
  ],
  "dreamlake/datasets/droid-2024": [
    { id: "datasets/droid-2024/raw", name: "raw", hasChildren: false },
    {
      id: "datasets/droid-2024/processed",
      name: "processed",
      hasChildren: false,
    },
    { id: "datasets/droid-2024/splits", name: "splits", hasChildren: false },
  ],
  "dreamlake/datasets/ego4d": [
    { id: "datasets/ego4d/kitchen", name: "kitchen", hasChildren: false },
    { id: "datasets/ego4d/outdoor", name: "outdoor", hasChildren: false },
  ],
  "dreamlake/models/pi0": [
    { id: "models/pi0/checkpoints", name: "checkpoints", hasChildren: false },
    { id: "models/pi0/configs", name: "configs", hasChildren: false },
  ],
  "dreamlake/experiments/2026-q1": [
    { id: "experiments/2026-q1/run-001", name: "run-001", hasChildren: false },
    { id: "experiments/2026-q1/run-002", name: "run-002", hasChildren: false },
    { id: "experiments/2026-q1/run-003", name: "run-003", hasChildren: false },
  ],
};

const clone = (t: Record<string, Node[]>) =>
  Object.fromEntries(
    Object.entries(t).map(([k, v]) => [k, v.map((n) => ({ ...n }))]),
  );

const keyOf = (segments: string[]) => ["dreamlake", ...segments].join("/");

export const BreadcrumbTreeSpec = () => {
  const [path, setPath] = useState<Node[]>([]);
  // A stand-in for the server: the drag mutates it, and `fetchChildren` reads
  // it back. Nothing here tells the tree what happened — the point of the demo
  // is that the tree does not ask.
  const treeRef = useRef<Record<string, Node[]>>(clone(SEED));
  const [lastMove, setLastMove] = useState<string | null>(null);

  const fetchNodes = async (p: string, page: number, limit: number) => {
    await new Promise((r) => setTimeout(r, 120));
    const all = treeRef.current[p] ?? [];
    const start = (page - 1) * limit;
    return {
      items: all.slice(start, start + limit),
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
    };
  };

  const onMove = async ({ source, fromPath, to }: BreadcrumbMove) => {
    // Deliberately slow, to make it obvious the panel has already moved the row
    // by the time this returns.
    await new Promise((r) => setTimeout(r, 400));
    const tree = treeRef.current;
    const fromKey = keyOf(fromPath.map((n) => n.name));
    const toKey = keyOf(to.parentPath.map((n) => n.name));
    const oldPrefix = `${fromKey}/${source.name}`;
    const newPrefix = `${toKey}/${source.name}`;

    tree[fromKey] = (tree[fromKey] ?? []).filter((n) => n.id !== source.id);
    tree[toKey] = [...(tree[toKey] ?? []), { ...source }];

    for (const k of Object.keys(tree)) {
      if (k !== oldPrefix && !k.startsWith(`${oldPrefix}/`)) continue;
      tree[newPrefix + k.slice(oldPrefix.length)] = tree[k];
      delete tree[k];
    }
    setLastMove(`${oldPrefix} → ${newPrefix}`);
  };

  return (
    <div className="space-y-4">
      <BreadcrumbTree
        rootPath="dreamlake"
        path={path}
        onNavigate={(_, newPath) => setPath(newPath)}
        fetchChildren={fetchNodes}
        dnd={{ onMove }}
      />
      {path.length > 0 && (
        <div className="text-uikit-11 font-uikit-mono text-uikit-muted">
          dreamlake/{path.map((n) => n.name).join("/")}
        </div>
      )}
      {lastMove && (
        <div className="text-uikit-11 font-uikit-mono text-uikit-muted opacity-70">
          moved {lastMove}
        </div>
      )}
    </div>
  );
};
