import { useState } from 'react'
import { BreadcrumbTree } from '@dreamlake/uikit'

type Node = { id: string; name: string; hasChildren?: boolean }

const TREE: Record<string, Node[]> = {
  'dreamlake': [
    { id: 'datasets',    name: 'datasets',    hasChildren: true  },
    { id: 'models',      name: 'models',      hasChildren: true  },
    { id: 'experiments', name: 'experiments', hasChildren: true  },
    { id: 'logs',        name: 'logs',        hasChildren: false },
  ],
  'dreamlake/datasets': [
    { id: 'datasets/droid-2024', name: 'droid-2024', hasChildren: true  },
    { id: 'datasets/ego4d',      name: 'ego4d',      hasChildren: true  },
    { id: 'datasets/imagenet',   name: 'imagenet',   hasChildren: false },
    { id: 'datasets/mujoco',     name: 'mujoco',     hasChildren: false },
  ],
  'dreamlake/models': [
    { id: 'models/pi0',    name: 'pi0',    hasChildren: true  },
    { id: 'models/pi0-v2', name: 'pi0-v2', hasChildren: false },
    { id: 'models/octo',   name: 'octo',   hasChildren: false },
  ],
  'dreamlake/experiments': [
    { id: 'experiments/2026-q1',   name: '2026-q1',   hasChildren: true  },
    { id: 'experiments/2026-q2',   name: '2026-q2',   hasChildren: true  },
    { id: 'experiments/ablations', name: 'ablations', hasChildren: false },
  ],
  'dreamlake/datasets/droid-2024': [
    { id: 'datasets/droid-2024/raw',       name: 'raw',       hasChildren: false },
    { id: 'datasets/droid-2024/processed', name: 'processed', hasChildren: false },
    { id: 'datasets/droid-2024/splits',    name: 'splits',    hasChildren: false },
  ],
  'dreamlake/datasets/ego4d': [
    { id: 'datasets/ego4d/kitchen', name: 'kitchen', hasChildren: false },
    { id: 'datasets/ego4d/outdoor', name: 'outdoor', hasChildren: false },
  ],
  'dreamlake/models/pi0': [
    { id: 'models/pi0/checkpoints', name: 'checkpoints', hasChildren: false },
    { id: 'models/pi0/configs',     name: 'configs',     hasChildren: false },
  ],
  'dreamlake/experiments/2026-q1': [
    { id: 'experiments/2026-q1/run-001', name: 'run-001', hasChildren: false },
    { id: 'experiments/2026-q1/run-002', name: 'run-002', hasChildren: false },
    { id: 'experiments/2026-q1/run-003', name: 'run-003', hasChildren: false },
  ],
}

async function fetchNodes(path: string, page: number, limit: number) {
  await new Promise(r => setTimeout(r, 120))
  const all = TREE[path] ?? []
  const start = (page - 1) * limit
  return {
    items: all.slice(start, start + limit),
    totalPages: Math.max(1, Math.ceil(all.length / limit)),
  }
}

export const BreadcrumbTreeSpec = () => {
  const [path, setPath] = useState<Node[]>([])
  return (
    <div className="space-y-4">
      <BreadcrumbTree
        rootPath="dreamlake"
        path={path}
        onNavigate={(_, newPath) => setPath(newPath)}
        fetchChildren={fetchNodes}
      />
      {path.length > 0 && (
        <div className="text-uikit-11 font-uikit-mono text-uikit-muted">
          dreamlake/{path.map(n => n.name).join('/')}
        </div>
      )}
    </div>
  )
}
