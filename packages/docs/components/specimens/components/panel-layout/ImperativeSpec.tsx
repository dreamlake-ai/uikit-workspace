import { useRef, useState } from 'react'
import {
  PanelLayout,
  panelLeaf,
  type PanelLayoutHandle,
  type PanelNode,
} from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

/** One-line shape of the tree, so the readout stays legible as it changes. */
function outline(node: PanelNode): string {
  if (node.kind === 'leaf') return node.title ?? node.view ?? `panel ${node.n}`
  if (node.kind === 'group') return `tabs(${node.children.map(outline).join(' | ')})`
  return `${node.dir === 'row' ? 'row' : 'col'}(${node.children.map(outline).join(', ')})`
}

const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className="font-uikit-ui text-uikit-11 font-semibold px-2.5 py-1 rounded-[6px] border border-uikit-faint bg-uikit-panel text-uikit-ink hover:bg-uikit-ink-5 cursor-pointer"
  >
    {children}
  </button>
)

export const ImperativeSpec = () => {
  const ref = useRef<PanelLayoutHandle>(null)
  const [shape, setShape] = useState('…')

  // `onChange` fires on every tree mutation — split, close, resize, dock, reset.
  // This is the hook a host uses to persist the layout.
  const sync = (root: PanelNode) => setShape(outline(root))

  const openBeside = (view: string, title: string) => {
    const root = ref.current?.getRoot()
    if (!root) return
    // Split whichever panel currently has focus, seeding the new one with a view.
    ref.current?.splitWith(ref.current.inspect()[0]?.id ?? root.id, 'row', view, title)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={() => openBeside('diff', 'Diff')}>splitWith(“Diff”)</Btn>
        <Btn onClick={() => openBeside('terminal', 'Terminal')}>splitWith(“Terminal”)</Btn>
        <Btn
          onClick={() => {
            const leaves = ref.current?.inspect() ?? []
            const last = leaves.at(-1)
            if (leaves.length > 1 && last) ref.current?.closeLeaf(last.id)
          }}
        >
          closeLeaf(last)
        </Btn>
        <Btn onClick={() => ref.current?.replaceRoot(panelLeaf({ view: 'chat', title: 'Chat' }))}>replaceRoot</Btn>
      </div>

      <PanelStage height={320}>
        <PanelLayout
          ref={ref}
          initial={() => panelLeaf({ view: 'chat', title: 'Chat' })}
          onChange={sync}
          primaryView="chat"
          className="p-2"
        />
      </PanelStage>

      <div className="font-uikit-mono text-uikit-10 text-uikit-muted truncate">
        onChange → <span className="text-uikit-ink">{shape}</span>
      </div>
    </div>
  )
}
