import { useTocRail } from '../hooks/useTocRail'

export type TocItem = { id: string; label: string; level: 2 | 3 }

// Marker classes (`doc-toc-rail`, `rail-base`, `rail-active`, `rail-end`,
// `rail-dot`) are kept so useTocRail can target them imperatively to set
// SVG path / stroke-dasharray attributes, and the SVG-rail CSS in
// page-styles.css can hold its stroke colors. Layout / typography is
// expressed as Tailwind utilities here.

const asideCx =
  'sticky top-10 h-[calc(100vh-40px)] overflow-y-auto pt-8 pr-[22px] pb-8 pl-[18px] ' +
  'max-[1100px]:hidden ' +
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-[3px] hover:[&::-webkit-scrollbar-thumb]:bg-faint'

const titleCx =
  'font-mono text-[9px] font-semibold text-muted opacity-70 tracking-[0.14em] uppercase pb-2.5 mb-1.5 border-b border-faint'

const listCx = 'list-none p-0 m-0 ml-3.5 flex flex-col gap-px'

const linkBaseCx =
  'block py-[5px] pr-2.5 pl-2 font-ui text-[12.5px] font-medium text-muted no-underline leading-[1.35] tracking-[-0.005em] transition-colors duration-150 hover:text-ink [&.is-active]:text-accent [&.is-active]:font-semibold'

const linkLvl3Cx =
  'font-mono! text-[10.5px]! lowercase tracking-[0.005em]'

const tocFootCx = 'mt-[18px] pt-[14px] border-t border-faint flex flex-col gap-1.5'

const tocFootLinkCx =
  'py-1 pr-2.5 pl-3 font-mono text-[10px] font-medium text-muted no-underline border-l-2 border-transparent -ml-0.5 tracking-[0.04em] uppercase transition-colors duration-150 hover:text-ink'

export function RightTOC({ items }: { items: TocItem[] }) {
  useTocRail(items)
  // Routes without entries in tocByRoute opt out of the right rail
  // entirely — no empty "On this page" card.
  if (items.length === 0) return null
  return (
    <aside className={asideCx} aria-label="On this page">
      <div className={titleCx}>On this page</div>
      <div className="doc-toc-body relative">
        <svg className="doc-toc-rail" id="toc-rail" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <linearGradient id="toc-rail-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0" />
              <stop offset="0.08" stopColor="white" stopOpacity="1" />
              <stop offset="1" stopColor="white" stopOpacity="1" />
            </linearGradient>
            <mask id="toc-rail-mask" maskUnits="userSpaceOnUse">
              <rect id="toc-rail-mask-rect" x="0" y="0" width="100%" height="100%" fill="url(#toc-rail-fade)" />
            </mask>
          </defs>
          <g mask="url(#toc-rail-mask)">
            <path className="rail-base" d="" />
            <path className="rail-active" d="" />
            <rect className="rail-end" width="6" height="6" x="0" y="0" />
          </g>
          <circle className="rail-dot" r="3.5" cx="0" cy="0" />
        </svg>
        <ul id="toc-list" className={listCx}>
          {items.map((it) => (
            <li
              key={it.id}
              className={`lvl-${it.level} ${it.level === 3 ? 'pl-3' : ''}`}
            >
              <a
                href={`#${it.id}`}
                className={`${linkBaseCx} ${it.level === 3 ? linkLvl3Cx : ''}`}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className={tocFootCx}>
        <a href="#" className={tocFootLinkCx}>Edit this page</a>
        <a href="#" className={tocFootLinkCx}>Report an issue</a>
      </div>
    </aside>
  )
}
