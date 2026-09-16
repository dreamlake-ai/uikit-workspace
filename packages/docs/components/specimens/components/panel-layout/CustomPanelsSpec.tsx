import { PanelLayout, panelLeaf, panelSplit, type LeafNode } from '@dreamlake/uikit'
import { PanelStage } from './PanelStage'

const FILES = ['app.tsx', 'router.ts', 'theme.css', 'README.md']
const CODE = ['export function App() {', '  return <Shell />', '}']

// The layout knows nothing about what a `view` means — these two functions are
// the ONLY place the strings are interpreted.
function renderBody(leaf: LeafNode) {
  switch (leaf.view) {
    case 'files':
      return (
        <ul className="flex-1 min-h-0 overflow-auto py-1.5 m-0 list-none">
          {FILES.map((f) => (
            <li
              key={f}
              className="px-3 py-1 font-uikit-mono text-uikit-11 text-uikit-muted hover:bg-uikit-ink-5 hover:text-uikit-ink cursor-default"
            >
              {f}
            </li>
          ))}
        </ul>
      )
    case 'editor':
      return (
        <div className="flex-1 min-h-0 overflow-auto py-2 font-uikit-mono text-uikit-12 leading-uikit-prose">
          {CODE.map((line, i) => (
            <div key={i} className="flex gap-3.5 px-3.5">
              <span className="w-4 text-right shrink-0 text-uikit-muted opacity-40">{i + 1}</span>
              <span className="text-uikit-muted whitespace-pre">{line}</span>
            </div>
          ))}
        </div>
      )
    case 'terminal':
      return (
        <div className="flex-1 min-h-0 overflow-auto p-3 font-uikit-mono text-uikit-11 text-uikit-muted">
          <div>
            <span className="text-uikit-tone-green">$</span> pnpm build
          </div>
          <div className="opacity-70">✓ built in 517ms</div>
        </div>
      )
    default:
      return null
  }
}

// A custom header replaces the default dot + title, but the drag handle and the
// close button stay — they are chrome the layout always owns.
function renderHeader(leaf: LeafNode) {
  if (!leaf.view) return undefined
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="font-uikit-ui text-uikit-12 font-semibold text-uikit-ink truncate">{leaf.title}</span>
      <span className="font-uikit-mono text-uikit-9 text-uikit-muted px-1.5 py-px rounded-[4px] bg-uikit-chip shrink-0">
        {leaf.view}
      </span>
    </span>
  )
}

const initial = () =>
  panelSplit(
    'row',
    [
      panelLeaf({ view: 'files', title: 'Files' }),
      panelSplit(
        'column',
        [panelLeaf({ view: 'editor', title: 'app.tsx' }), panelLeaf({ view: 'terminal', title: 'Terminal' })],
        [64, 36],
      ),
    ],
    [30, 70],
  )

export const CustomPanelsSpec = () => (
  <PanelStage>
    <PanelLayout
      initial={initial}
      renderBody={renderBody}
      renderHeader={renderHeader}
      primaryView="editor"
      className="p-2"
    />
  </PanelStage>
)
