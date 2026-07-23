/**
 * WorkflowCanvas — the Workflow v2 stage-spine canvas, in PipelineGraph's
 * visual language: beige dot-grid plane, 156×72 status-tinted node cards,
 * orthogonal rounded edges that detour around cards, connector tag pills,
 * pan / zoom, and a glass legend.
 *
 * Structure: stage nodes ON the spine (order-implied stage→stage edges);
 * member nodes (compute / uda / sampler / control) fan out from their stage;
 * run-time agent instances stack under their uda card. Two orientations —
 * 'vertical' (spine top-down, members fan right) and 'horizontal' (spine
 * left-right, members fan down).
 *
 * Draft mode = pass no statusByNodeId (static blueprint). Run mode = pass
 * statusByNodeId (+ agentsByNodeId) and the same canvas animates.
 *
 * Edge routing reuses PipelineGraph's buildEdgePath (horizontal-primary);
 * vertical-primary edges are routed in axis-swapped space and rendered under
 * a matrix(0,1,1,0,0,0) reflection, so obstacle detours work in both
 * orientations.
 */
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { cn } from '../../lib/utils'
import { buildEdgePath, type Obstacle, type Pt } from '../PipelineGraph/edge-path'
import { FLOW, type EdgeFlow } from '../PipelineGraph/flow'
import {
  labelAnchor, layoutWorkflow, portAnchor, roundedPath,
  type WfOrientation, type WfRect,
} from './layout'
import {
  nodeInputs, nodeOutputs,
  type AgentInstance, type WorkflowNodeRunStateValue, type WorkflowSpec,
} from './spec'
import { WF_KIND_TOKEN } from './nodes/chrome'
import { StageNode } from './nodes/StageNode'
import {
  AgentInstanceCard, ComputeNodeCard, ControlNodeCard, SamplerNodeCard, UdaNodeCard,
} from './nodes/MemberCards'

export interface WorkflowCanvasProps {
  spec: WorkflowSpec
  orientation?: WfOrientation
  /** Run overlay: per-node run states (absent = draft blueprint). */
  statusByNodeId?: Record<string, WorkflowNodeRunStateValue>
  /** Run overlay: agent instances fanned under their uda node. */
  agentsByNodeId?: Record<string, AgentInstance[]>
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Edge-state + kind legend (top-left). Default true. */
  showControls?: boolean
  className?: string
}

const CSS = `
@keyframes wfNodePulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--color-uikit-tone-blue) 50%,transparent)}50%{box-shadow:0 0 0 5px transparent}}
@keyframes wfEdgeFlow{to{stroke-dashoffset:-22}}
.wf-edge-flow{animation:wfEdgeFlow .9s linear infinite}
@keyframes wfEdgeQueued{to{stroke-dashoffset:-18}}
.wf-edge-queued{animation:wfEdgeQueued 2.6s linear infinite;opacity:.8}
`
function useInjectedStyles() {
  useEffect(() => {
    const ID = 'wf-canvas-v2-styles'
    if (document.getElementById(ID)) return
    const el = document.createElement('style')
    el.id = ID
    el.textContent = CSS
    document.head.appendChild(el)
  }, [])
}

type View = { x: number; y: number; k: number }

/** Edge flow from endpoint run states (draft: both undefined → idle). */
function edgeFlowFromStates(
  src?: WorkflowNodeRunStateValue,
  dst?: WorkflowNodeRunStateValue,
): EdgeFlow {
  if (src === 'error' || dst === 'error') return 'error'
  if (src === 'progress') return 'running'
  if (src === 'done' && dst === 'progress') return 'running'
  if (src === 'done' && (dst === 'idle' || dst === 'queued' || dst == null)) return 'queued'
  if (src === 'done' && dst === 'done') return 'ok'
  return 'idle'
}

const swap = (p: Pt): Pt => ({ x: p.y, y: p.x })
const swapRect = (r: WfRect): Obstacle => ({ x0: r.y, y0: r.x, x1: r.y + r.h, y1: r.x + r.w })
const rectObstacle = (r: WfRect): Obstacle => ({ x0: r.x - 4, y0: r.y - 4, x1: r.x + r.w + 4, y1: r.y + r.h + 4 })

export function WorkflowCanvas({
  spec, orientation = 'vertical', statusByNodeId, agentsByNodeId,
  selectedId, onSelect, showControls = true, className,
}: WorkflowCanvasProps) {
  useInjectedStyles()

  const [internalSel, setInternalSel] = useState<string | null>(null)
  const selected = selectedId !== undefined ? selectedId : internalSel
  const select = useCallback((id: string | null) => {
    if (selectedId === undefined) setInternalSel(id)
    onSelect?.(id)
  }, [selectedId, onSelect])

  const [view, setView] = useState<View>({ x: 24, y: 16, k: 1 })
  const [posOverride, setPosOverride] = useState<Record<string, { x: number; y: number }>>({})
  useEffect(() => { setPosOverride({}) }, [spec, orientation])

  const containerRef = useRef<HTMLDivElement>(null)
  const fitViewRef = useRef<() => void>(() => {})
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const dragRef = useRef<{ id: string; sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(null)

  const layout = useMemo(
    () => layoutWorkflow(spec, orientation, agentsByNodeId),
    [spec, orientation, agentsByNodeId],
  )

  // -- auto-fit: center the graph in the container, shrinking to fit when
  //    needed. Runs on mount and whenever the layout changes (orientation
  //    toggle, spec edit, run overlay); double-click the plane to re-fit.
  const fitView = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const cw = el.clientWidth
    const ch = el.clientHeight
    if (!cw || !ch) return
    const PAD = 28
    const { w, h } = layout.size
    const kFit = Math.min((cw - PAD * 2) / w, (ch - PAD * 2) / h)
    const k = Math.min(1, Math.max(0.35, kFit))
    // Center each axis when the scaled graph fits; otherwise align the flow
    // start (top / left) so the root stage is visible.
    const x = w * k <= cw - PAD ? (cw - w * k) / 2 : PAD
    const y = h * k <= ch - PAD ? (ch - h * k) / 2 : PAD
    setView({ x, y, k })
  }, [layout.size])
  fitViewRef.current = fitView
  useEffect(() => { fitView() }, [fitView])

  // Apply drag overrides on top of the computed layout.
  const stageRects = useMemo(() => {
    const out: Record<string, WfRect> = {}
    for (const [id, r] of Object.entries(layout.stageRects)) {
      const ov = posOverride[id]
      out[id] = ov ? { ...r, x: ov.x, y: ov.y } : r
    }
    return out
  }, [layout.stageRects, posOverride])
  const nodeRects = useMemo(() => {
    const out: Record<string, WfRect> = {}
    for (const [id, r] of Object.entries(layout.nodeRects)) {
      const ov = posOverride[id]
      out[id] = ov ? { ...r, x: ov.x, y: ov.y } : r
    }
    return out
  }, [layout.nodeRects, posOverride])

  const nodeById = useMemo(
    () => Object.fromEntries(spec.nodes.map((n) => [n.id, n])),
    [spec.nodes],
  )
  const membersByStage = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of spec.nodes) m.set(n.stageId, (m.get(n.stageId) ?? 0) + 1)
    return m
  }, [spec.nodes])
  const doneByStage = useMemo(() => {
    if (!statusByNodeId) return new Map<string, number>()
    const m = new Map<string, number>()
    for (const n of spec.nodes) {
      if (statusByNodeId[n.id] === 'done') m.set(n.stageId, (m.get(n.stageId) ?? 0) + 1)
    }
    return m
  }, [spec.nodes, statusByNodeId])

  const bounds = useMemo(() => {
    let w = layout.size.w + 160
    let h = layout.size.h + 160
    for (const r of [...Object.values(stageRects), ...Object.values(nodeRects)]) {
      w = Math.max(w, r.x + r.w + 160)
      h = Math.max(h, r.y + r.h + 160)
    }
    return { w, h }
  }, [layout.size, stageRects, nodeRects])

  // -- pan / zoom ------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        setView((v) => {
          const k = Math.min(2.2, Math.max(0.35, v.k * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))
          const wx = (cx - v.x) / v.k
          const wy = (cy - v.y) / v.k
          return { k, x: cx - wx * k, y: cy - wy * k }
        })
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onBgDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
    select(null)
  }
  const onBgMove = (e: ReactPointerEvent) => {
    const p = panRef.current
    if (!p) return
    setView((v) => ({ ...v, x: p.vx + (e.clientX - p.x), y: p.vy + (e.clientY - p.y) }))
  }
  const onBgUp = (e: ReactPointerEvent) => {
    panRef.current = null
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
  }

  const cardHandlers = (id: string, rect: WfRect) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = { id, sx: e.clientX, sy: e.clientY, bx: rect.x, by: rect.y, moved: false }
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const d = dragRef.current
      if (!d || d.id !== id) return
      const dx = (e.clientX - d.sx) / view.k
      const dy = (e.clientY - d.sy) / view.k
      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true
      setPosOverride((o) => ({ ...o, [id]: { x: d.bx + dx, y: d.by + dy } }))
    },
    onPointerUp: (e: ReactPointerEvent) => {
      const d = dragRef.current
      dragRef.current = null
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
      if (d && !d.moved) select(id === selected ? null : id)
    },
  })

  // -- edges -----------------------------------------------------------------
  // Data edges route on the main axis: vertical orientation is vertical-
  // primary, so we build in axis-swapped space and render reflected.
  const verticalPrimary = orientation === 'vertical'

  const obstacles = useMemo<Obstacle[]>(() => {
    const rects = [...Object.values(stageRects), ...Object.values(nodeRects)]
    return verticalPrimary ? rects.map(swapRect) : rects.map(rectObstacle)
  }, [stageRects, nodeRects, verticalPrimary])

  const dataEdges = useMemo(() => {
    return spec.edges.map((e) => {
      const fromNode = nodeById[e.from]
      const toNode = nodeById[e.to]
      const fromRect = nodeRects[e.from]
      const toRect = nodeRects[e.to]
      if (!fromNode || !toNode || !fromRect || !toRect) return null
      const outs = nodeOutputs(fromNode)
      const ins = nodeInputs(toNode)
      const oi = Math.max(0, outs.findIndex((p) => p.name === (e.fromPort ?? 'out')))
      const ii = Math.max(0, ins.findIndex((p) => p.name === (e.toPort ?? 'in')))
      const from = portAnchor(fromRect, 'out', oi, outs.length, orientation)
      const to = portAnchor(toRect, 'in', ii, ins.length, orientation)
      const obs = obstacles.filter((o) => {
        const fr = verticalPrimary ? swapRect(fromRect) : rectObstacle(fromRect)
        const tr = verticalPrimary ? swapRect(toRect) : rectObstacle(toRect)
        return o !== null && !(o.x0 === fr.x0 && o.y0 === fr.y0) && !(o.x0 === tr.x0 && o.y0 === tr.y0)
      })
      const d = verticalPrimary
        ? buildEdgePath(swap(from), swap(to), { obstacles: obs })
        : buildEdgePath(from, to, { obstacles: obs })
      const flow = edgeFlowFromStates(statusByNodeId?.[e.from], statusByNodeId?.[e.to])
      const label = e.fromPort && e.fromPort !== 'out'
        ? e.fromPort
        : outs[oi] && outs[oi].type !== 'any' ? outs[oi].type : null
      return { id: e.id, d, flow, from, to, label, labelPos: null as Pt | null }
    }).filter(Boolean) as {
      id: string; d: string; flow: EdgeFlow; from: Pt; to: Pt
      label: string | null; labelPos: Pt | null
    }[]
  }, [spec.edges, nodeById, nodeRects, obstacles, orientation, statusByNodeId, verticalPrimary])

  // Second pass: place each connector tag ON its routed path, dodging cards,
  // agent stacks, and labels already placed.
  const labeledEdges = useMemo(() => {
    const avoid: WfRect[] = [
      ...Object.values(stageRects),
      ...Object.values(nodeRects),
      ...layout.agentRects,
    ]
    const taken: { x: number; y: number; w: number; h: number }[] = []
    return dataEdges.map((e) => {
      if (!e.label) return e
      const { pt, box } = labelAnchor(e.d, avoid, {
        swapped: verticalPrimary,
        boxW: e.label.length * 5.6 + 14,
        boxH: 16,
        taken,
      })
      taken.push(box)
      return { ...e, labelPos: pt }
    })
  }, [dataEdges, stageRects, nodeRects, layout.agentRects, verticalPrimary])

  // Fan-out stubs — stage → each member, along the flow axis. The stage's
  // out-face spreads one anchor per member so the fan reads at a glance.
  const stubPaths = useMemo(() => {
    const byStage = new Map<string, string[]>()
    for (const s of layout.stubs) {
      const arr = byStage.get(s.stageId) ?? []
      arr.push(s.nodeId)
      byStage.set(s.stageId, arr)
    }
    const out: { key: string; d: string; nodeId: string; stageId: string }[] = []
    for (const [stageId, memberIds] of byStage) {
      const fromR = stageRects[stageId]
      if (!fromR) continue
      memberIds.forEach((nodeId, i) => {
        const toR = nodeRects[nodeId]
        if (!toR) return
        const from = portAnchor(fromR, 'out', i, memberIds.length, orientation)
        const to = portAnchor(toR, 'in', 0, 1, orientation)
        const d = verticalPrimary
          ? buildEdgePath(swap(from), swap(to), {})
          : buildEdgePath(from, to, {})
        out.push({ key: `${stageId}->${nodeId}`, d, nodeId, stageId })
      })
    }
    return out
  }, [layout.stubs, stageRects, nodeRects, orientation, verticalPrimary])

  // Spine — stage → next stage (order-implied) through the RESERVED side
  // corridor: out of the stage's side face, along the corridor lane, into
  // the next stage's side face. Never threads between member cards.
  const spinePaths = useMemo(() => {
    const paths: { key: string; d: string; to: Pt }[] = []
    const lane = layout.corridor
    for (let i = 0; i + 1 < spec.stages.length; i++) {
      const a = stageRects[spec.stages[i].id]
      const b = stageRects[spec.stages[i + 1].id]
      if (!a || !b) continue
      if (orientation === 'vertical') {
        // Leave the LEFT face, run down the corridor, enter the next LEFT face.
        const from = { x: a.x, y: a.y + a.h / 2 }
        const to = { x: b.x, y: b.y + b.h / 2 }
        paths.push({
          key: `spine-${i}`, to,
          d: roundedPath([from, { x: lane, y: from.y }, { x: lane, y: to.y }, to]),
        })
      } else {
        // Leave the TOP face, run along the corridor, enter the next TOP face.
        const from = { x: a.x + a.w / 2, y: a.y }
        const to = { x: b.x + b.w / 2, y: b.y }
        paths.push({
          key: `spine-${i}`, to,
          d: roundedPath([from, { x: from.x, y: lane }, { x: to.x, y: lane }, to]),
        })
      }
    }
    return paths
  }, [spec.stages, stageRects, layout.corridor, orientation])

  const isAdjacent = useCallback((edgeFrom: string, edgeTo: string) =>
    !!selected && (edgeFrom === selected || edgeTo === selected), [selected])

  // -- render ----------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`${spec.name} workflow canvas`}
      onPointerDown={onBgDown}
      onPointerMove={onBgMove}
      onPointerUp={onBgUp}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-node]')) return
        fitViewRef.current()
      }}
      className={cn('relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing outline-none', className)}
      style={{
        backgroundColor: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
        backgroundImage: `radial-gradient(circle, var(--color-uikit-canvas-dot, var(--color-uikit-faint)) ${Math.max(0.6, 1.2 * view.k)}px, transparent ${Math.max(0.9, 1.5 * view.k)}px)`,
        backgroundSize: `${Math.max(8, 20 * view.k)}px ${Math.max(8, 20 * view.k)}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
        backgroundRepeat: 'repeat',
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        <svg width={bounds.w} height={bounds.h} className="absolute top-0 left-0 pointer-events-none overflow-visible">
          {/* spine (order-implied stage→stage, via the reserved side corridor) */}
          {spinePaths.map((s) => (
            <g key={s.key} opacity={selected ? 0.45 : 1} style={{ transition: 'opacity 160ms ease' }}>
              <path d={s.d} fill="none" stroke="var(--color-uikit-ink-50)" strokeWidth={1.6} strokeLinecap="round" />
              {verticalPrimary ? (
                // enters the next stage's LEFT face → arrow points right
                <path d={`M ${s.to.x - 6} ${s.to.y - 4} L ${s.to.x} ${s.to.y} L ${s.to.x - 6} ${s.to.y + 4}`} fill="none" stroke="var(--color-uikit-ink-50)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                // enters the next stage's TOP face → arrow points down
                <path d={`M ${s.to.x - 4} ${s.to.y - 6} L ${s.to.x} ${s.to.y} L ${s.to.x + 4} ${s.to.y - 6}`} fill="none" stroke="var(--color-uikit-ink-50)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
          ))}

          {/* fan-out stubs — stage → member, light dashed, structural not data */}
          {stubPaths.map((s) => (
            <g
              key={s.key}
              transform={verticalPrimary ? 'matrix(0,1,1,0,0,0)' : undefined}
              opacity={selected && selected !== s.nodeId && selected !== s.stageId ? 0.25 : 0.85}
              style={{ transition: 'opacity 160ms ease' }}
            >
              <path d={s.d} fill="none" stroke="var(--color-uikit-ink-12)" strokeWidth={1.3} strokeDasharray="3 4" strokeLinecap="round" />
            </g>
          ))}

          {/* data edges */}
          {dataEdges.map((e) => {
            const flowSpec = FLOW[e.flow]
            const edge = spec.edges.find((x) => x.id === e.id)
            const hot = edge ? isAdjacent(edge.from, edge.to) : false
            const stroke = hot ? 'var(--color-uikit-accent)' : flowSpec.color
            const width = hot ? Math.max(flowSpec.width, 2) : flowSpec.width
            const dim = !!selected && !hot
            const anim = e.flow === 'running' ? 'wf-edge-flow' : e.flow === 'queued' ? 'wf-edge-queued' : undefined
            return (
              <g key={e.id} opacity={dim ? 0.28 : 1} style={{ transition: 'opacity 160ms ease' }}>
                <g transform={verticalPrimary ? 'matrix(0,1,1,0,0,0)' : undefined}>
                  <path
                    d={e.d} fill="none" stroke={stroke} strokeWidth={width}
                    strokeLinecap="round" strokeDasharray={flowSpec.dash}
                    className={hot ? undefined : anim}
                  />
                </g>
                {verticalPrimary ? (
                  <path d={`M ${e.to.x - 4} ${e.to.y - 6} L ${e.to.x} ${e.to.y} L ${e.to.x + 4} ${e.to.y - 6}`} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d={`M ${e.to.x - 6} ${e.to.y - 4} L ${e.to.x} ${e.to.y} L ${e.to.x - 6} ${e.to.y + 4}`} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
                )}
              </g>
            )
          })}
        </svg>

        {/* stage nodes */}
        {spec.stages.map((s) => {
          const r = stageRects[s.id]
          if (!r) return null
          return (
            <StageNode
              key={s.id}
              stage={s}
              memberCount={membersByStage.get(s.id) ?? 0}
              doneCount={statusByNodeId ? (doneByStage.get(s.id) ?? 0) : undefined}
              pos={{ x: r.x, y: r.y }}
              selected={selected === s.id}
              dimmed={!!selected && selected !== s.id}
              {...cardHandlers(s.id, r)}
            />
          )
        })}

        {/* member nodes */}
        {spec.nodes.map((n) => {
          const r = nodeRects[n.id]
          if (!r) return null
          const common = {
            pos: { x: r.x, y: r.y },
            state: statusByNodeId?.[n.id],
            selected: selected === n.id,
            dimmed: !!selected && selected !== n.id,
            ...cardHandlers(n.id, r),
          }
          switch (n.kind) {
            case 'compute': return <ComputeNodeCard key={n.id} node={n} {...common} />
            case 'uda': return <UdaNodeCard key={n.id} node={n} {...common} />
            case 'sampler': return <SamplerNodeCard key={n.id} node={n} {...common} />
            case 'control': return <ControlNodeCard key={n.id} node={n} {...common} />
          }
        })}

        {/* agent instances (run overlay) */}
        {layout.agentRects.map((a) => {
          const agents = agentsByNodeId?.[a.nodeId] ?? []
          const agent = agents.find((x) => x.agentId === a.agentId)
          if (!agent) return null
          const parentOv = posOverride[a.nodeId]
          const base = layout.nodeRects[a.nodeId]
          const dx = parentOv && base ? parentOv.x - base.x : 0
          const dy = parentOv && base ? parentOv.y - base.y : 0
          return (
            <AgentInstanceCard
              key={`${a.nodeId}:${a.agentId}`}
              agent={agent}
              pos={{ x: a.x + dx, y: a.y + dy }}
              dimmed={!!selected && selected !== a.nodeId}
            />
          )
        })}

        {/* connector tag pills — placed ON the routed path, dodging cards */}
        {labeledEdges.map((e) => e.label && e.labelPos && (
          <span
            key={`tag-${e.id}`}
            style={{
              position: 'absolute', left: e.labelPos.x, top: e.labelPos.y,
              transform: 'translate(-50%, -50%)',
              fontFamily: 'var(--font-uikit-mono)', fontSize: 9, lineHeight: 1,
              padding: '2px 6px', borderRadius: 5,
              background: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
              border: '2px solid var(--color-uikit-muted)',
              color: 'var(--color-uikit-muted)',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              opacity: selected ? 0.4 : 1, transition: 'opacity 160ms ease',
            }}
          >
            {e.label}
          </span>
        ))}
      </div>

      {showControls && <Legend />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Legend — glass card: node kinds + edge states.
// ---------------------------------------------------------------------------

const LEGEND_KINDS = ['stage', 'compute', 'uda', 'sampler', 'control'] as const
const LEGEND_FLOWS: EdgeFlow[] = ['running', 'ok', 'queued', 'idle']

function Legend() {
  return (
    <div
      className="hidden sm:flex"
      style={{
        position: 'absolute', left: 14, top: 12, zIndex: 6,
        background: 'color-mix(in oklab, var(--color-uikit-panel) 88%, transparent)',
        backdropFilter: 'blur(8px) saturate(1.05)',
        WebkitBackdropFilter: 'blur(8px) saturate(1.05)',
        border: '1px solid color-mix(in oklab, var(--color-uikit-faint) 70%, transparent)',
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,.06)',
        fontFamily: 'var(--font-uikit-mono)',
        color: 'var(--color-uikit-muted)',
        pointerEvents: 'none',
        flexDirection: 'column', alignItems: 'flex-start', gap: 4,
        padding: '8px 10px', fontSize: 10.5, letterSpacing: '.04em', whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.7,
        paddingBottom: 2, marginBottom: 2, width: '100%',
        borderBottom: '1px solid color-mix(in oklab, var(--color-uikit-faint) 80%, transparent)',
      }}>nodes</span>
      {LEGEND_KINDS.map((k) => (
        <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: WF_KIND_TOKEN[k], opacity: k === 'stage' ? 0.75 : 1 }} />
          <span style={{ opacity: 0.9 }}>{k}</span>
        </span>
      ))}
      <span style={{
        fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.7,
        padding: '4px 0 2px', marginBottom: 2, width: '100%',
        borderBottom: '1px solid color-mix(in oklab, var(--color-uikit-faint) 80%, transparent)',
      }}>edges</span>
      {LEGEND_FLOWS.map((f) => {
        const s = FLOW[f]
        return (
          <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="22" height="8" viewBox="0 0 22 8">
              <line x1="1" y1="4" x2="21" y2="4" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" />
            </svg>
            <span style={{ color: s.color, opacity: 0.9 }}>{s.label}</span>
          </span>
        )
      })}
    </div>
  )
}
