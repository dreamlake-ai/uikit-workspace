// Icons specimen: a curated walk through six lucide.dev categories
// (navigation · files & data · actions · layout & views · status · domain).
// Every glyph here is a direct named export from lucide-react — no
// hand-rolled SVGs, no wrapper component. The point is that the path
// data is byte-for-byte upstream and the spec rule "render via lucide"
// becomes auditable from a `grep '<svg' dist/`.
//
// MigrationBacklog renders the tabular hit-list of legacy custom SVGs
// (mostly in dreamlake-pipelines `wireframe-shared.jsx`) that should be
// retired in favor of the canonical lucide name.
//
// TODO(click-to-copy): kebab-case names rendered below would be useful
// to copy on click — the source design guide does this with a tiny
// flash on copy. Skipped for the first landing; trivial to add with a
// `navigator.clipboard.writeText` on the card button.

import {
  // navigation
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  // files & data
  Folder,
  FolderOpen,
  File,
  FileText,
  Database,
  Hash,
  BookMarked,
  // actions
  Plus,
  Trash2,
  Pencil,
  Copy,
  Check,
  X,
  MoreHorizontal,
  // layout & views
  List,
  ListTree,
  Columns3,
  LayoutGrid,
  Rows3,
  // status
  Circle,
  CircleCheck,
  CircleX,
  CircleAlert,
  Clock,
  Loader,
  // domain
  Route,
  GitBranch,
  History,
  Tag,
  Merge,
  type LucideIcon,
} from 'lucide-react'

type Entry = { name: string; Icon: LucideIcon }
type Category = { id: string; label: string; entries: Entry[] }

const categories: Category[] = [
  {
    id: 'navigation',
    label: 'navigation',
    entries: [
      { name: 'arrow-up', Icon: ArrowUp },
      { name: 'arrow-down', Icon: ArrowDown },
      { name: 'arrow-left', Icon: ArrowLeft },
      { name: 'arrow-right', Icon: ArrowRight },
      { name: 'chevron-down', Icon: ChevronDown },
      { name: 'chevron-right', Icon: ChevronRight },
      { name: 'panel-left-close', Icon: PanelLeftClose },
      { name: 'panel-left-open', Icon: PanelLeftOpen },
    ],
  },
  {
    id: 'files',
    label: 'files & data',
    entries: [
      { name: 'folder', Icon: Folder },
      { name: 'folder-open', Icon: FolderOpen },
      { name: 'file', Icon: File },
      { name: 'file-text', Icon: FileText },
      { name: 'database', Icon: Database },
      { name: 'hash', Icon: Hash },
      { name: 'book-marked', Icon: BookMarked },
    ],
  },
  {
    id: 'actions',
    label: 'actions',
    entries: [
      { name: 'plus', Icon: Plus },
      { name: 'trash-2', Icon: Trash2 },
      { name: 'pencil', Icon: Pencil },
      { name: 'copy', Icon: Copy },
      { name: 'check', Icon: Check },
      { name: 'x', Icon: X },
      { name: 'more-horizontal', Icon: MoreHorizontal },
    ],
  },
  {
    id: 'layout',
    label: 'layout & views',
    entries: [
      { name: 'list', Icon: List },
      { name: 'list-tree', Icon: ListTree },
      { name: 'columns-3', Icon: Columns3 },
      { name: 'layout-grid', Icon: LayoutGrid },
      { name: 'rows-3', Icon: Rows3 },
    ],
  },
  {
    id: 'status',
    label: 'status',
    entries: [
      { name: 'circle', Icon: Circle },
      { name: 'circle-check', Icon: CircleCheck },
      { name: 'circle-x', Icon: CircleX },
      { name: 'circle-alert', Icon: CircleAlert },
      { name: 'clock', Icon: Clock },
      { name: 'loader', Icon: Loader },
    ],
  },
  {
    id: 'domain',
    label: 'domain',
    entries: [
      { name: 'route', Icon: Route },
      { name: 'git-branch', Icon: GitBranch },
      { name: 'history', Icon: History },
      { name: 'tag', Icon: Tag },
      { name: 'merge', Icon: Merge },
    ],
  },
]

const groupCx = 'mt-6 first:mt-2'
const headCx =
  'font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted mb-2.5'
const gridCx =
  'grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2'
const cardCx =
  'flex flex-col items-center justify-center gap-1.5 px-2 py-3 border border-faint rounded-md bg-panel text-ink'
const glyphCx = 'flex items-center justify-center h-7'
const nameCx = 'font-mono text-[10.5px] text-muted leading-none'

export const IconCatalog = () => (
  <div className="my-6">
    {categories.map((cat) => (
      <div key={cat.id} className={groupCx}>
        <div className={headCx}>{cat.label}</div>
        <div className={gridCx}>
          {cat.entries.map(({ name, Icon }) => (
            <div key={name} className={cardCx} title={name}>
              <span className={glyphCx} aria-hidden="true">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <span className={nameCx}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

// ── Migration backlog ────────────────────────────────────────────
// Verbatim from staging/dreamlake-design-guide.html lines 2792-2806.
// Three columns: where (file/component), custom kind, lucide replacement.

type MigrationRow = {
  where: string
  custom: string
  // Replacement may be a single name or include an "or domain glyph"
  // qualifier — we render it as raw ReactNode to preserve the original
  // phrasing of the source spec (specifically the "bindr" row).
  replacement: React.ReactNode
}

const migration: MigrationRow[] = [
  { where: 'WireIcon', custom: 'panel-hide', replacement: <code>panel-left-close</code> },
  { where: 'WireIcon', custom: 'panel-show', replacement: <code>panel-left-open</code> },
  { where: 'WireIcon', custom: 'tree-view', replacement: <code>list-tree</code> },
  { where: 'WireIcon', custom: 'col-view', replacement: <code>columns-3</code> },
  { where: 'WireIcon', custom: 'grid-view', replacement: <code>layout-grid</code> },
  { where: 'WireIcon', custom: 'note', replacement: <code>file-text</code> },
  { where: 'WireIcon', custom: 'project', replacement: <code>folder</code> },
  {
    where: 'WireIcon',
    custom: 'bindr',
    replacement: (
      <>
        <code>book-marked</code> (or domain glyph <code>hash</code>)
      </>
    ),
  },
  {
    where: 'pipelines-view',
    custom: 'inline pipeline SVG',
    replacement: <code>route</code>,
  },
  {
    where: 'timetravel-view',
    custom: 'inline history SVG',
    replacement: <code>history</code>,
  },
]

const tableCx =
  'w-full my-5 border-collapse font-ui text-[12.5px] text-ink'
const thCx =
  'text-left font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted py-2 pr-4 border-b border-faint'
const tdCx = 'py-2 pr-4 border-b border-faint last:border-b-0 align-middle'
const arrowCx = 'font-mono text-muted px-1'

export const MigrationBacklog = () => (
  <div className="my-5 border border-faint rounded-md bg-panel px-4 py-2">
    <table className={tableCx}>
      <thead>
        <tr>
          <th className={thCx}>where</th>
          <th className={thCx}>custom kind</th>
          <th className={thCx}>lucide replacement</th>
        </tr>
      </thead>
      <tbody>
        {migration.map((row) => (
          <tr key={`${row.where}-${row.custom}`}>
            <td className={`${tdCx} font-mono text-muted`}>{row.where}</td>
            <td className={tdCx}>
              <code>{row.custom}</code>
            </td>
            <td className={tdCx}>
              <span className={arrowCx} aria-hidden="true">
                →
              </span>
              {row.replacement}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
