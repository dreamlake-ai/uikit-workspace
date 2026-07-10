/**
 * PipelineSource — the read-only source inspector that pairs with
 * <PipelineGraph>. Tabs between the whole pipeline `.py` and the selected
 * node's source. Pure and presentational; drive `selectedNodeId` from the same
 * state that drives the graph to keep the two in sync.
 *
 * The top tab bar matches the design's DLTabBar: UI-font text tabs (active ink,
 * inactive muted) over a hairline rule, with a sliding underline on the active
 * tab.
 */
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import type { PipelineGraphData } from './types'

export interface PipelineSourceProps {
  graph: PipelineGraphData
  selectedNodeId?: string | null
  onSelectNode?: (id: string | null) => void
  className?: string
}

type Tab = 'pipeline' | 'node'

export function PipelineSource({ graph, selectedNodeId, onSelectNode, className }: PipelineSourceProps) {
  const node = selectedNodeId ? graph.nodes[selectedNodeId] : null
  const hasNodeCode = !!node && !!node.code
  const [tab, setTab] = useState<Tab>('pipeline')

  // Follow the selection: picking a node with source jumps to its tab.
  useEffect(() => { setTab(hasNodeCode ? 'node' : 'pipeline') }, [selectedNodeId, hasNodeCode])

  const code = tab === 'node' && node?.code ? node.code : graph.code

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pipeline', label: `${graph.id}.py` },
    ...(hasNodeCode ? [{ key: 'node' as Tab, label: node!.title }] : []),
  ]

  // Sliding underline — measured from the active tab (design's DLTabBar).
  const wrapRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [bar, setBar] = useState({ left: 0, width: 0 })
  useEffect(() => {
    const el = tabRefs.current[tab]
    if (!el) return
    setBar({ left: el.offsetLeft, width: el.offsetWidth })
  }, [tab, hasNodeCode, graph.id])

  const pick = (t: Tab) => {
    setTab(t)
    if (t === 'pipeline') onSelectNode?.(null)
  }

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      <div className="shrink-0 px-3 pt-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <div
          ref={wrapRef}
          className="relative inline-flex items-end gap-[18px] border-b border-uikit-faint"
          style={{ fontFamily: 'var(--font-uikit-ui)' }}
        >
          {tabs.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                ref={(n) => { tabRefs.current[t.key] = n }}
                type="button"
                onClick={() => pick(t.key)}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = 'var(--color-uikit-ink)'; e.currentTarget.style.opacity = '1' } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = 'var(--color-uikit-muted)'; e.currentTarget.style.opacity = '0.75' } }}
                className="cursor-pointer border-0 bg-transparent whitespace-nowrap"
                style={{
                  height: 27, fontSize: 12, padding: '4px 0', fontWeight: 400, letterSpacing: '-.005em',
                  color: active ? 'var(--color-uikit-ink)' : 'var(--color-uikit-muted)',
                  opacity: active ? 1 : 0.75,
                  transition: 'color 160ms ease, opacity 160ms ease',
                }}
              >
                {t.label}
              </button>
            )
          })}
          <span
            aria-hidden
            style={{
              position: 'absolute', left: bar.left, width: bar.width, bottom: -1, height: 2,
              background: 'var(--color-uikit-ink)', pointerEvents: 'none',
              transition: 'left 280ms cubic-bezier(.2,.7,.2,1), width 280ms cubic-bezier(.2,.7,.2,1)',
            }}
          />
        </div>
      </div>
      <pre
        className="flex-1 min-h-0 overflow-auto m-0 px-3 py-2.5 text-[11px] leading-[1.55] text-uikit-ink"
        style={{ fontFamily: 'var(--font-uikit-mono)' }}
        aria-label={tab === 'node' && node ? `${node.title}.py` : `${graph.id}.py`}
      >
        {code}
      </pre>
    </div>
  )
}
