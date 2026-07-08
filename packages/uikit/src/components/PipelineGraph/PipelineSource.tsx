/**
 * PipelineSource — the read-only source inspector that pairs with
 * <PipelineGraph>. Tabs between the whole pipeline `.py` and the selected
 * node's source. Pure and presentational; drive `selectedNodeId` from the same
 * state that drives the graph to keep the two in sync.
 */
import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import type { PipelineGraphData } from './types'

export interface PipelineSourceProps {
  graph: PipelineGraphData
  selectedNodeId?: string | null
  onSelectNode?: (id: string | null) => void
  className?: string
}

export function PipelineSource({ graph, selectedNodeId, onSelectNode, className }: PipelineSourceProps) {
  const node = selectedNodeId ? graph.nodes[selectedNodeId] : null
  const hasNodeCode = !!node && !!node.code
  const [tab, setTab] = useState<'pipeline' | 'node'>('pipeline')

  // Follow the selection: picking a node with source jumps to its tab.
  useEffect(() => { setTab(hasNodeCode ? 'node' : 'pipeline') }, [selectedNodeId, hasNodeCode])

  const code = tab === 'node' && node?.code ? node.code : graph.code

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)} style={{ fontFamily: 'var(--font-uikit-mono)' }}>
      <div className="shrink-0 flex items-center gap-1 px-2 py-1 border-b border-uikit-faint">
        <SourceTab active={tab === 'pipeline'} onClick={() => { setTab('pipeline'); onSelectNode?.(null) }}>
          {graph.id}.py
        </SourceTab>
        {hasNodeCode && (
          <SourceTab active={tab === 'node'} onClick={() => setTab('node')}>
            {node!.title}
          </SourceTab>
        )}
      </div>
      <pre
        className="flex-1 min-h-0 overflow-auto m-0 px-3 py-2.5 text-[11px] leading-[1.55] text-uikit-ink"
        aria-label={tab === 'node' && node ? `${node.title}.py` : `${graph.id}.py`}
      >
        {code}
      </pre>
    </div>
  )
}

function SourceTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'font-mono text-[10px] px-2 h-[18px] rounded border transition-colors cursor-pointer',
        active
          ? 'text-uikit-ink border-uikit-faint bg-uikit-ink-5'
          : 'text-uikit-muted border-transparent hover:bg-uikit-ink-5',
      )}
    >
      {children}
    </button>
  )
}
