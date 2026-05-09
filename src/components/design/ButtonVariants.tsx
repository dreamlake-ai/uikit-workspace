// Variants gallery — one row per variant from staging/dreamlake-design-guide.html
// `#lab-button`. The source ships two: ghost and primary.
//
// Each row shows the variant name + role + a live <Button /> at rest,
// using the same padding / typographic chrome the design-guide previewed.

import { Button } from '../Button'

type VariantRow = {
  name: string
  role: string
  demo: React.ReactNode
}

const rows: VariantRow[] = [
  {
    name: 'ghost',
    role: 'Default action surface — muted ink, faint hairline border, transparent fill. Use for inline / secondary actions.',
    demo: <Button icon="⌥⌘K">send to chat</Button>,
  },
  {
    name: 'primary',
    role: 'Single primary CTA per surface — accent fill (#23aaff = --color-accent), white ink. Use sparingly.',
    demo: <Button variant="primary">commit run</Button>,
  },
]

const rowCx =
  'grid grid-cols-[120px_minmax(0,1fr)_220px] gap-4 items-center py-3.5 ' +
  'border-b border-faint last:border-b-0 ' +
  'max-[880px]:grid-cols-1 max-[880px]:gap-2 max-[880px]:py-3'

const nameCx =
  'font-mono text-[10px] font-semibold text-muted tracking-[0.12em] uppercase opacity-85'

const roleCx =
  'font-ui text-[12px] leading-[1.5] text-muted [text-wrap:pretty]'

export const ButtonVariants = () => (
  <div className="my-6 border border-faint rounded-md bg-panel px-5 py-1">
    {rows.map((r) => (
      <div key={r.name} className={rowCx}>
        <div className={nameCx}>{r.name}</div>
        <div className="min-w-0 flex items-center">{r.demo}</div>
        <div className={roleCx}>{r.role}</div>
      </div>
    ))}
  </div>
)
