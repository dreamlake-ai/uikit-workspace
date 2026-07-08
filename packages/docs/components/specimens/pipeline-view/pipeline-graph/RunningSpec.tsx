import { useEffect, useMemo, useState } from 'react'
import { PipelineGraph, Button, type StatusOverlay, type NodeStatus, type PipelineGraphData } from '@dreamlake/uikit'
import { CAMERA_POSE } from './sample-graph'

// A realistic in-browser "runner". Each node, when it finishes, settles to a
// RANDOM outcome — mostly `ok`, occasionally `stale` or `error`. A node only
// starts once all its upstreams have settled AND none of them errored, so a
// failure BLOCKS everything downstream — those nodes never run and stay idle,
// exactly like a real pipeline. (The source never fails, else nothing would
// run.) Nothing real executes; it only drives the `statusById` overlay.
type Outcome = 'ok' | 'stale' | 'error'
function roll(): Outcome {
  const r = Math.random()
  if (r < 0.08) return 'error'
  if (r < 0.22) return 'stale'
  return 'ok'
}

type SimState = { settled: Record<string, Outcome>; running: Record<string, number> }
const EMPTY: SimState = { settled: {}, running: {} }

function predecessors(graph: PipelineGraphData): Record<string, string[]> {
  const preds: Record<string, string[]> = {}
  for (const id of Object.keys(graph.nodes)) preds[id] = []
  for (const e of graph.edges) if (!preds[e.to].includes(e.from)) preds[e.to].push(e.from)
  return preds
}

export const RunningSpec = () => {
  const graph = CAMERA_POSE
  const preds = useMemo(() => predecessors(graph), [graph])
  const [sim, setSim] = useState<SimState>(EMPTY)
  const [playing, setPlaying] = useState(false)

  const runnable = (id: string, settled: Record<string, Outcome>) => {
    const ps = preds[id]
    return ps.every(p => settled[p] != null) && !ps.some(p => settled[p] === 'error')
  }

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setSim(prev => {
        const settled = { ...prev.settled }
        const running: Record<string, number> = { ...prev.running }
        // advance in-flight nodes; a finished one settles to a random outcome
        for (const id of Object.keys(running)) {
          running[id] += 0.12
          if (running[id] >= 1) {
            delete running[id]
            settled[id] = graph.nodes[id].kind === 'source' ? 'ok' : roll()
          }
        }
        // start nodes whose upstreams have all settled and none errored
        let started = false
        for (const id of Object.keys(graph.nodes)) {
          if (settled[id] == null && running[id] == null && runnable(id, settled)) {
            running[id] = 0
            started = true
          }
        }
        // done when nothing is running and nothing more can start (rest is blocked)
        if (Object.keys(running).length === 0 && !started) {
          const more = Object.keys(graph.nodes).some(
            id => settled[id] == null && running[id] == null && runnable(id, settled),
          )
          if (!more) window.setTimeout(() => setPlaying(false), 0)
        }
        return { settled, running }
      })
    }, 150)
    return () => window.clearInterval(timer)
  }, [playing, graph, preds])

  const statusById: StatusOverlay = useMemo(() => {
    const s: StatusOverlay = {}
    for (const [id, o] of Object.entries(sim.settled)) s[id] = { status: o as NodeStatus }
    for (const [id, p] of Object.entries(sim.running)) s[id] = { status: 'running', progress: p }
    return s
  }, [sim])

  const total = Object.keys(graph.nodes).length
  const ok = Object.values(sim.settled).filter(o => o === 'ok').length
  const failed = Object.values(sim.settled).filter(o => o === 'error').length
  const blocked = total - Object.keys(sim.settled).length - Object.keys(sim.running).length
  const finished = !playing && Object.keys(sim.settled).length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 440, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--color-uikit-faint)' }}>
        <Button size="sm" variant="secondary" onClick={() => { if (finished) setSim(EMPTY); setPlaying(p => !p) }}>
          {playing ? '⏸ Pause' : finished ? '↻ Run again' : '▶ Run'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setPlaying(false); setSim(EMPTY) }}>
          Reset
        </Button>
        <span style={{ fontFamily: 'var(--font-uikit-mono)', fontSize: 10.5, color: 'var(--color-uikit-muted)', opacity: 0.85 }}>
          random outcomes — a failure blocks everything downstream
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-uikit-mono)', fontSize: 11, color: 'var(--color-uikit-muted)' }}>
          {ok} ok · {failed} failed · {blocked} blocked
        </span>
      </div>
      <div style={{ position: 'relative', flex: '1 1 0', minHeight: 0 }}>
        <PipelineGraph graph={graph} statusById={statusById} />
      </div>
    </div>
  )
}
