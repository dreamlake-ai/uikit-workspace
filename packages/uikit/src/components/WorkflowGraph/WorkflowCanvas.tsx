/**
 * WorkflowCanvas — the Workflow v2 stage-hub canvas, in PipelineGraph's
 * visual language: beige dot-grid plane, 156×72 status-tinted node cards,
 * orthogonal rounded edges that detour around cards, connector tag pills,
 * pan / zoom, and a draggable glass legend.
 *
 * STAGES ARE HUBS. Members fan out from their stage node and work converges
 * into the next stage node:
 *  - an intra-stage data edge draws directly member → member;
 *  - a CROSS-stage data edge routes THROUGH the downstream stage node —
 *    rendered as two segments: source member → stage (convergence) and
 *    stage → target member (fan-out);
 *  - source members (no incoming edges) get a dispatch fan from their own
 *    stage node;
 *  - a plain stage → stage spine edge appears only where no member path
 *    connects consecutive stages (e.g. an empty stage).
 *
 * Two orientations: 'vertical' (root stage at top, flow top→bottom) and
 * 'horizontal' (root at left, flow left→right). One card style for all
 * nodes. Run overlay via statusByNodeId / agentsByNodeId.
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
  /** Run overlay: per-node run states (absent = plain blueprint). */
  statusByNodeId?: Record<string, WorkflowNodeRunStateValue>
  /** Run overlay: agent instances fanned under their uda node. */
  agentsByNodeId?: Record<string, AgentInstance[]>
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** Node-kind + edge-state legend (draggable). Default true. */
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

/** Edge flow from endpoint run states (blueprint: both undefined → idle). */
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

/** Flow style for a dispatch fan, from the target member's state alone. */
function fanFlow(dst?: WorkflowNodeRunStateValue): EdgeFlow {
  if (dst === 'progress') return 'running'
  if (dst === 'done') return 'ok'
  if (dst === 'error') return 'error'
  if (dst === 'queued') return 'queued'
  return 'idle'
}

const swap = (p: Pt): Pt => ({ x: p.y, y: p.x })
// Generous obstacle padding: routed edges detour PAD px away from this
// boundary, so lines keep clear daylight from card edges.
const swapRect = (r: WfRect): Obstacle => ({ x0: r.y - 8, y0: r.x - 8, x1: r.y + r.h + 8, y1: r.x + r.w + 8 })
const rectObstacle = (r: WfRect): Obstacle => ({ x0: r.x - 8, y0: r.y - 8, x1: r.x + r.w + 8, y1: r.y + r.h + 8 })

interface Seg {
  key: string
  d: string
  flow: EdgeFlow
  to: Pt
  /** Selection ids that keep this segment "hot" (undimmed + accented). */
  hotIds: string[]
  label: string | null
  labelPos: Pt | null
  spine?: boolean
  /** Path was built in axis-swapped space (render under the reflection). */
  swapped: boolean
  /** Arrowhead direction: along the flow axis, or ±side axis (hub side faces). */
  arrow: 'flow' | 's+' | 's-'
}

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

  // -- auto-fit --------------------------------------------------------------
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
    const x = w * k <= cw - PAD ? (cw - w * k) / 2 : PAD
    const y = h * k <= ch - PAD ? (ch - h * k) / 2 : PAD
    setView({ x, y, k })
  }, [layout.size])
  fitViewRef.current = fitView
  useEffect(() => { fitView() }, [fitView])

  // Drag overrides on top of the computed layout.
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

  // -- segments (hub routing) ------------------------------------------------
  const verticalPrimary = orientation === 'vertical'

  const segments = useMemo<Seg[]>(() => {
    const allRects = [...Object.values(stageRects), ...Object.values(nodeRects)]
    const obstacles = verticalPrimary ? allRects.map(swapRect) : allRects.map(rectObstacle)
    const route = (from: Pt, to: Pt, exclude: WfRect[]): string => {
      const ex = new Set(exclude.map((r) => (verticalPrimary ? swapRect(r) : rectObstacle(r))
      ).map((o) => `${o.x0},${o.y0}`))
      const obs = obstacles.filter((o) => !ex.has(`${o.x0},${o.y0}`))
      return verticalPrimary
        ? buildEdgePath(swap(from), swap(to), { obstacles: obs })
        : buildEdgePath(from, to, { obstacles: obs })
    }
    const sideCoord = (id: string) => {
      const r = nodeRects[id]
      if (!r) return 0
      return verticalPrimary ? r.x : r.y
    }
    const stageOf = (nodeId: string) => nodeById[nodeId]?.stageId

    // Classify edges + build hub anchor orderings.
    const intra: typeof spec.edges = []
    const cross: typeof spec.edges = []
    for (const e of spec.edges) {
      const sa = stageOf(e.from)
      const sb = stageOf(e.to)
      if (!sa || !sb || !nodeRects[e.from] || !nodeRects[e.to]) continue
      if (sa === sb) intra.push(e)
      else cross.push(e)
    }
    // hub inbound: cross edges grouped by TARGET stage, ordered by source side pos
    const inbound = new Map<string, typeof spec.edges>()
    for (const e of cross) {
      const t = stageOf(e.to)!
      const arr = inbound.get(t) ?? []
      arr.push(e)
      inbound.set(t, arr)
    }
    for (const arr of inbound.values()) arr.sort((a, b) => sideCoord(a.from) - sideCoord(b.from))
    // hub outbound: cross deliveries + dispatch fans for source members,
    // grouped by stage, ordered by target side pos
    type Out = { targetId: string; edge?: (typeof spec.edges)[number] }
    const outbound = new Map<string, Out[]>()
    for (const e of cross) {
      const t = stageOf(e.to)!
      const arr = outbound.get(t) ?? []
      arr.push({ targetId: e.to, edge: e })
      outbound.set(t, arr)
    }
    const hasIncoming = new Set(spec.edges.map((e) => e.to))
    for (const n of spec.nodes) {
      if (!hasIncoming.has(n.id) && nodeRects[n.id]) {
        const arr = outbound.get(n.stageId) ?? []
        arr.push({ targetId: n.id })
        outbound.set(n.stageId, arr)
      }
    }
    for (const arr of outbound.values()) arr.sort((a, b) => sideCoord(a.targetId) - sideCoord(b.targetId))

    const memberIn = (id: string, port?: string): Pt => {
      const n = nodeById[id]
      const ins = nodeInputs(n)
      const i = Math.max(0, ins.findIndex((p) => p.name === (port ?? 'in')))
      return portAnchor(nodeRects[id], 'in', i, ins.length, orientation)
    }
    const memberOut = (id: string, port?: string): Pt => {
      const n = nodeById[id]
      const outs = nodeOutputs(n)
      const i = Math.max(0, outs.findIndex((p) => p.name === (port ?? 'out')))
      return portAnchor(nodeRects[id], 'out', i, outs.length, orientation)
    }
    // Edge pills carry DATA TYPES only — port NAMES are labeled at the node
    // face (see the port-marker layer), so parallel port fans don't fight
    // over pill space.
    const outLabel = (e: (typeof spec.edges)[number]): string | null => {
      const outs = nodeOutputs(nodeById[e.from])
      const p = outs.find((x) => x.name === (e.fromPort ?? 'out')) ?? outs[0]
      return p && p.type !== 'artifact' ? p.type : null
    }

    const segs: Seg[] = []

    // Flow-coordinate helpers: f = flow axis (y vertical / x horizontal),
    // s = side axis. Face-aware hub routing is written once in flow space.
    interface FlowPt { s: number; f: number }
    const toF = (p: Pt): FlowPt => (verticalPrimary ? { s: p.x, f: p.y } : { s: p.y, f: p.x })
    const toR = (q: FlowPt): Pt => (verticalPrimary ? { x: q.s, y: q.f } : { x: q.f, y: q.s })
    const frect = (r: WfRect) => (verticalPrimary
      ? { sMin: r.x, sMax: r.x + r.w, fMin: r.y, fMax: r.y + r.h }
      : { sMin: r.y, sMax: r.y + r.h, fMin: r.x, fMax: r.x + r.w })
    const rp = (pts: FlowPt[]) => roundedPath(pts.map(toR))

    // Intra-stage data edges: direct member → member (flow-face ports).
    for (const e of intra) {
      const from = memberOut(e.from, e.fromPort)
      const to = memberIn(e.to, e.toPort)
      segs.push({
        key: e.id, to,
        d: route(from, to, [nodeRects[e.from], nodeRects[e.to]]),
        flow: edgeFlowFromStates(statusByNodeId?.[e.from], statusByNodeId?.[e.to]),
        hotIds: [e.from, e.to],
        label: outLabel(e), labelPos: null,
        swapped: verticalPrimary, arrow: 'flow',
      })
    }

    // ── hub segments with intelligent face selection ──
    // Convergence (member → hub): ≤3 segments use the hub's flow face;
    // beyond that, the outermost pairs peel onto the LEFT/RIGHT side faces
    // (wrapping around the near corner when the source sits over the hub).
    for (const [t, edges] of inbound) {
      const H = frect(stageRects[t])
      const items = edges
        .map((e) => ({ e, P: memberOut(e.from, e.fromPort) }))
        .sort((a, b) => toF(a.P).s - toF(b.P).s)
      const faces: ('left' | 'right' | 'flow')[] = Array(items.length).fill('flow')
      let lo = 0
      let hi = items.length - 1
      while (hi - lo + 1 > 3) { faces[lo++] = 'left'; faces[hi--] = 'right' }
      const groups = { left: [] as number[], flow: [] as number[], right: [] as number[] }
      items.forEach((_, i) => groups[faces[i]].push(i))
      const fLen = H.fMax - H.fMin

      // Dedupe pills: a bundle of parallel segments from the same source
      // carrying the same type gets ONE pill, on the bundle's middle segment.
      const labelKeep = new Map<number, string>()
      {
        const byBundle = new Map<string, number[]>()
        items.forEach(({ e }, i) => {
          const label = outLabel(e)
          if (!label) return
          const k = `${e.from}|${label}`
          const arr = byBundle.get(k) ?? []
          arr.push(i)
          byBundle.set(k, arr)
        })
        for (const [k, idxs] of byBundle) {
          labelKeep.set(idxs[Math.floor(idxs.length / 2)], k.split('|')[1])
        }
      }

      items.forEach(({ e, P }, i) => {
        const flow = edgeFlowFromStates(statusByNodeId?.[e.from], statusByNodeId?.[e.to])
        const face = faces[i]
        const base = {
          key: `${e.id}#up`, flow,
          hotIds: [e.from, e.to, t],
          label: labelKeep.get(i) ?? null, labelPos: null,
        }
        if (face === 'flow') {
          const gi = groups.flow.indexOf(i)
          const to = portAnchor(stageRects[t], 'in', gi, Math.max(1, groups.flow.length), orientation)
          segs.push({
            ...base, to,
            d: route(P, to, [nodeRects[e.from], stageRects[t]]),
            swapped: verticalPrimary, arrow: 'flow',
          })
        } else {
          const g = groups[face]
          const gi = g.indexOf(i)
          // Side faces are PARTITIONED: inbound anchors on the upstream half,
          // outbound on the downstream half — arriving arrows never sit on
          // departing lines.
          const fLo = H.fMin + 10
          const fHi = H.fMin + fLen / 2 - 6
          const fA = g.length === 1
            ? (fLo + fHi) / 2
            : fLo + gi * ((fHi - fLo) / (g.length - 1))
          const sEdge = face === 'left' ? H.sMin : H.sMax
          const p0 = toF(P)
          const onThatSide = face === 'left' ? p0.s < H.sMin - 8 : p0.s > H.sMax + 8
          const lane = 28 + gi * 16
          const outward = face === 'left' ? H.sMin - lane : H.sMax + lane
          const pts: FlowPt[] = onThatSide
            ? [p0, { s: p0.s, f: fA }, { s: sEdge, f: fA }]
            : [
                p0,
                { s: p0.s, f: H.fMin - 24 - gi * 12 },
                { s: outward, f: H.fMin - 24 - gi * 12 },
                { s: outward, f: fA },
                { s: sEdge, f: fA },
              ]
          segs.push({
            ...base, to: toR({ s: sEdge, f: fA }),
            d: rp(pts),
            swapped: false, arrow: face === 'left' ? 's+' : 's-',
          })
        }
      })
    }

    // Fan-out (hub → member): deliveries of cross-stage edges + dispatch
    // fans for source members. Targets clearly to the side leave from the
    // hub's side face with a clean L; aligned targets use the flow face.
    for (const [t, outs] of outbound) {
      const H = frect(stageRects[t])
      const items = outs
        .map((o) => ({ ...o, T: memberIn(o.targetId, o.edge?.toPort) }))
        .sort((a, b) => toF(a.T).s - toF(b.T).s)
      const faceOf = (T: Pt): 'left' | 'right' | 'flow' => {
        const s = toF(T).s
        if (s < H.sMin - 8) return 'left'
        if (s > H.sMax + 8) return 'right'
        return 'flow'
      }
      const groups = { left: [] as number[], flow: [] as number[], right: [] as number[] }
      items.forEach(({ T }, i) => groups[faceOf(T)].push(i))
      const fLen = H.fMax - H.fMin

      items.forEach(({ targetId, edge, T }, i) => {
        const flow = edge
          ? edgeFlowFromStates(statusByNodeId?.[edge.from], statusByNodeId?.[targetId])
          : fanFlow(statusByNodeId?.[targetId])
        const face = faceOf(T)
        const base = {
          key: edge ? `${edge.id}#dn` : `fan-${t}-${targetId}`,
          flow, to: T,
          hotIds: edge ? [edge.from, targetId, t] : [t, targetId],
          label: null, labelPos: null,
        }
        if (face === 'flow') {
          const gi = groups.flow.indexOf(i)
          const from = portAnchor(stageRects[t], 'out', gi, Math.max(1, groups.flow.length), orientation)
          segs.push({
            ...base,
            d: route(from, T, [stageRects[t], nodeRects[targetId]]),
            swapped: verticalPrimary, arrow: 'flow',
          })
        } else {
          const g = groups[face]
          const gi = g.indexOf(i)
          // Downstream half of the side face (inbound owns the upstream half).
          const fLo = H.fMin + fLen / 2 + 6
          const fHi = H.fMax - 10
          const fA = g.length === 1
            ? (fLo + fHi) / 2
            : fLo + gi * ((fHi - fLo) / (g.length - 1))
          const sEdge = face === 'left' ? H.sMin : H.sMax
          const t0 = toF(T)
          segs.push({
            ...base,
            d: rp([{ s: sEdge, f: fA }, { s: t0.s, f: fA }, t0]),
            swapped: false, arrow: 'flow',
          })
        }
      })
    }

    // Spine stage → stage, only where no member path connects them.
    for (let i = 0; i + 1 < spec.stages.length; i++) {
      const a = spec.stages[i]
      const b = spec.stages[i + 1]
      const aEmpty = (membersByStage.get(a.id) ?? 0) === 0
      const bHasInbound = (inbound.get(b.id) ?? []).length > 0
      if (!aEmpty && bHasInbound) continue
      const ra = stageRects[a.id]
      const rb = stageRects[b.id]
      if (!ra || !rb) continue
      const from = orientation === 'vertical'
        ? { x: ra.x + ra.w / 2, y: ra.y + ra.h }
        : { x: ra.x + ra.w, y: ra.y + ra.h / 2 }
      const to = orientation === 'vertical'
        ? { x: rb.x + rb.w / 2, y: rb.y }
        : { x: rb.x, y: rb.y + rb.h / 2 }
      segs.push({
        key: `spine-${a.id}`, to,
        d: route(from, to, [ra, rb]),
        flow: 'idle', hotIds: [a.id, b.id],
        label: null, labelPos: null, spine: true,
        swapped: verticalPrimary, arrow: 'flow',
      })
    }

    return segs
  }, [spec, stageRects, nodeRects, nodeById, membersByStage, statusByNodeId, orientation, verticalPrimary])

  // Label placement pass: on the routed path, dodging cards + other labels.
  const labeledSegments = useMemo(() => {
    // Inflate card rects so pills keep daylight from card edges.
    const grow = (r: WfRect): WfRect => ({ x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 })
    const avoid: WfRect[] = [
      ...Object.values(stageRects).map(grow),
      ...Object.values(nodeRects).map(grow),
      ...layout.agentRects.map(grow),
    ]
    const taken: { x: number; y: number; w: number; h: number }[] = []
    return segments.map((s) => {
      if (!s.label) return s
      const { pt, box } = labelAnchor(s.d, avoid, {
        swapped: s.swapped,
        boxW: s.label.length * 5.6 + 14,
        boxH: 16,
        taken,
      })
      taken.push(box)
      return { ...s, labelPos: pt }
    })
  }, [segments, stageRects, nodeRects, layout.agentRects, verticalPrimary])

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
          {labeledSegments.map((s) => {
            const flowSpec = FLOW[s.flow]
            const hot = !!selected && s.hotIds.includes(selected)
            const dim = !!selected && !hot
            const stroke = s.spine
              ? 'var(--color-uikit-ink-50)'
              : hot ? 'var(--color-uikit-accent)' : flowSpec.color
            const width = s.spine ? 1.6 : hot ? Math.max(flowSpec.width, 2) : flowSpec.width
            const anim = s.flow === 'running' ? 'wf-edge-flow' : s.flow === 'queued' ? 'wf-edge-queued' : undefined
            // Arrowhead by seg direction: along the flow axis, or ±side axis
            // (hub side-face arrivals). Resolved per orientation.
            const dir = s.arrow === 'flow'
              ? (verticalPrimary ? 'down' : 'right')
              : verticalPrimary
                ? (s.arrow === 's+' ? 'right' : 'left')
                : (s.arrow === 's+' ? 'down' : 'up')
            const head =
              dir === 'down' ? `M ${s.to.x - 4} ${s.to.y - 6} L ${s.to.x} ${s.to.y} L ${s.to.x + 4} ${s.to.y - 6}`
              : dir === 'up' ? `M ${s.to.x - 4} ${s.to.y + 6} L ${s.to.x} ${s.to.y} L ${s.to.x + 4} ${s.to.y + 6}`
              : dir === 'right' ? `M ${s.to.x - 6} ${s.to.y - 4} L ${s.to.x} ${s.to.y} L ${s.to.x - 6} ${s.to.y + 4}`
              : `M ${s.to.x + 6} ${s.to.y - 4} L ${s.to.x} ${s.to.y} L ${s.to.x + 6} ${s.to.y + 4}`
            return (
              <g key={s.key} opacity={dim ? 0.25 : 1} style={{ transition: 'opacity 160ms ease' }}>
                <g transform={s.swapped ? 'matrix(0,1,1,0,0,0)' : undefined}>
                  <path
                    d={s.d} fill="none" stroke={stroke} strokeWidth={width}
                    strokeLinecap="round" strokeDasharray={s.spine ? undefined : flowSpec.dash}
                    className={hot || s.spine ? undefined : anim}
                  />
                </g>
                <path d={head} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )
          })}
        </svg>

        {/* stage nodes (hubs) */}
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

        {/* port markers — dots on every member port, name micro-pills for
            custom-named ports (PipelineGraph's port-label pattern; keeps
            port names off the edges, where parallel fans would collide) */}
        {spec.nodes.map((n) => {
          const r = nodeRects[n.id]
          if (!r) return null
          const dim = !!selected && selected !== n.id
          const ins = nodeInputs(n)
          const outs = nodeOutputs(n)
          const marker = (p: { name: string; collect?: boolean }, i: number, count: number, dir: 'in' | 'out') => {
            const a = portAnchor(r, dir, i, count, orientation)
            const named = p.name !== (dir === 'in' ? 'in' : 'out')
            const labelOffset = dir === 'in' ? -11 : 11
            const isCollect = dir === 'in' && p.collect === true
            return (
              <span key={`${n.id}-${dir}-${p.name}-${i}`} style={{ opacity: dim ? 0.3 : 1, transition: 'opacity 160ms ease' }}>
                <span style={{
                  position: 'absolute', left: a.x - 3, top: a.y - 3,
                  width: 6, height: 6, borderRadius: 3,
                  background: 'var(--color-uikit-panel)',
                  border: '1px solid var(--color-uikit-muted)',
                  // collect ports (fan-in) get a second ring
                  boxShadow: isCollect ? '0 0 0 2.5px var(--color-uikit-panel), 0 0 0 3.5px var(--color-uikit-muted)' : undefined,
                  zIndex: 3, pointerEvents: 'none',
                }} />
                {named && (
                  <span style={{
                    position: 'absolute',
                    left: orientation === 'vertical' ? a.x : a.x + labelOffset,
                    top: orientation === 'vertical' ? a.y + labelOffset : a.y,
                    transform: orientation === 'vertical'
                      ? 'translate(-50%, -50%)'
                      : `translate(${dir === 'in' ? '-100%' : '0'}, -50%)`,
                    fontFamily: 'var(--font-uikit-mono)', fontSize: 8.5, lineHeight: 1,
                    padding: '1px 4px', borderRadius: 4,
                    background: 'var(--color-uikit-canvas-bg, var(--color-uikit-panel))',
                    color: 'var(--color-uikit-muted)',
                    whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 3,
                  }}>
                    {p.name}
                  </span>
                )}
              </span>
            )
          }
          return (
            <span key={`ports-${n.id}`}>
              {ins.map((p, i) => marker(p, i, ins.length, 'in'))}
              {outs.map((p, i) => marker(p, i, outs.length, 'out'))}
            </span>
          )
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
        {labeledSegments.map((s) => s.label && s.labelPos && (
          <span
            key={`tag-${s.key}`}
            style={{
              position: 'absolute', left: s.labelPos.x, top: s.labelPos.y,
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
            {s.label}
          </span>
        ))}
      </div>

      {showControls && <Legend />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Legend — draggable glass card: node kinds + edge states.
// ---------------------------------------------------------------------------

const LEGEND_KINDS = ['stage', 'compute', 'uda', 'sampler', 'control'] as const
const LEGEND_FLOWS: EdgeFlow[] = ['running', 'ok', 'queued', 'idle']

function Legend() {
  const [pos, setPos] = useState({ x: 14, y: 12 })
  const drag = useRef<{ sx: number; sy: number; bx: number; by: number } | null>(null)
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation()
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        drag.current = { sx: e.clientX, sy: e.clientY, bx: pos.x, by: pos.y }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        e.stopPropagation()
        setPos({ x: Math.max(0, d.bx + e.clientX - d.sx), y: Math.max(0, d.by + e.clientY - d.sy) })
      }}
      onPointerUp={(e) => {
        drag.current = null
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        // Inline display (not Tailwind's `hidden sm:flex`): host apps can load
        // other scoped Tailwind bundles whose `.hidden` rule would win the
        // cascade and permanently suppress the legend.
        display: 'flex',
        position: 'absolute', left: pos.x, top: pos.y, zIndex: 6,
        background: 'color-mix(in oklab, var(--color-uikit-panel) 88%, transparent)',
        backdropFilter: 'blur(8px) saturate(1.05)',
        WebkitBackdropFilter: 'blur(8px) saturate(1.05)',
        border: '1px solid color-mix(in oklab, var(--color-uikit-faint) 70%, transparent)',
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,.06)',
        fontFamily: 'var(--font-uikit-mono)',
        color: 'var(--color-uikit-muted)',
        cursor: 'grab', userSelect: 'none', touchAction: 'none',
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
