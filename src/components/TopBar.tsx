import { ThemeToggle } from './ThemeToggle'
import { SearchInput } from './SearchPalette'

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="block">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 015.78 0c2.2-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
  </svg>
)

// Branch icon used inside the version chip's SHA segment. The prototype
// drew this with an inline SVG mask; React lets us just render the SVG.
const BranchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-[9px] h-[9px] opacity-80 shrink-0"
  >
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M6 9v6" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
)

// Marker classes (`doc-topbar`, `doc-brand`, `ver`, `slash`, `docs`,
// `doc-topcrumbs`, `doc-search`, `doc-topnav-actions`) are kept so the
// cross-cutting rules in page-styles.css (body.is-merged transitions,
// body.is-pal-open palette stacking) can still target these elements.
// Those rules will move into a `merged:` custom variant in the next PR.

const headerCx =
  'sticky top-0 z-50 grid grid-cols-[240px_minmax(0,1fr)_240px] items-center w-full max-w-none m-0 p-0 bg-bg border-b border-faint [backdrop-filter:saturate(140%)_blur(8px)] [-webkit-backdrop-filter:saturate(140%)_blur(8px)] transition-[background-color,border-color] duration-[250ms] ' +
  // Mobile: collapse to brand + actions only.
  'max-[880px]:grid-cols-[1fr_auto] max-[880px]:p-0 ' +
  // Palette-open: drop the stacking context so the search input can sit
  // above the backdrop. Also strip the bg + border so the topbar isn't
  // a visual chip on top of the dimmed page.
  'pal-open:bg-transparent pal-open:border-b-transparent pal-open:z-auto pal-open:[backdrop-filter:none] pal-open:[-webkit-backdrop-filter:none]'

// Hover collapses these to a thin breadcrumb pinned to the topbar — the
// `merged:` variant fires once the body.is-merged class is set by the
// useMergedHeader scroll hook. Each piece collapses width/padding/margin
// and fades in unison.
const brandFadeCx =
  'transition-[opacity,transform,width,margin,padding] duration-[250ms] ease-[cubic-bezier(.4,.7,.3,1)] ' +
  'merged:opacity-0 merged:-translate-x-1 merged:pointer-events-none merged:w-0 merged:m-0 merged:p-0 merged:overflow-hidden'

const brandCx =
  'flex items-center gap-2.5 font-ui text-sm font-bold tracking-[-0.04em] text-ink no-underline pl-[18px] transition-opacity duration-150 whitespace-nowrap min-w-0 hover:opacity-80 ' +
  'max-[880px]:pl-[14px] ' +
  // Brand fades when the palette is open (gives the input visual focus).
  'pal-open:opacity-0 pal-open:pointer-events-none transition-[opacity] duration-[250ms]'

const verCx =
  'inline-flex items-stretch font-mono text-[10px] font-medium tracking-[0.02em] ml-1.5 border border-faint rounded-[4px] ' +
  brandFadeCx

const verVCx =
  'inline-flex items-center px-1.5 py-0.5 text-ink bg-[color-mix(in_srgb,var(--color-ink)_5%,var(--color-bg))] font-semibold rounded-l-[3px]'

const verShaCx =
  'inline-flex items-center gap-[5px] px-[7px] py-0.5 text-muted border-l border-faint rounded-r-[3px]'

const slashCx = `text-muted font-normal opacity-55 -mx-1 ${brandFadeCx}`
const docsCx = `text-muted font-medium tracking-[-0.01em] ${brandFadeCx}`
const dotCx = 'text-accent font-bold text-[1.4em] leading-none ml-px align-baseline'

// Topcrumbs hidden by default, slide in when body.is-merged (scrolled
// past H1). When palette is open, fade out alongside the rest of the
// chrome so only the search input stays visible.
const topcrumbsCx =
  'col-start-2 row-start-1 self-center justify-self-start ml-[56px] flex items-center gap-1.5 font-mono text-[10px] font-medium text-muted tracking-[0.04em] uppercase pointer-events-none opacity-0 translate-y-[6px] transition-[opacity,transform] duration-[250ms] ease-[cubic-bezier(.4,.7,.3,1)] ' +
  'merged:opacity-100 merged:translate-y-0 merged:pointer-events-auto ' +
  'pal-open:opacity-0! pal-open:pointer-events-none!'

const topnavActionsCx =
  'flex items-center gap-3.5 justify-self-end pr-[22px] max-[880px]:pr-[14px] ' +
  'pal-open:opacity-0 pal-open:pointer-events-none transition-opacity duration-[250ms]'

const topnavLinkCx =
  'font-ui text-[12.5px] font-medium text-muted no-underline inline-flex items-center justify-center leading-none tracking-[-0.005em] transition-colors duration-150 hover:text-ink'

export function TopBar() {
  return (
    <header className={headerCx} style={{ height: 39, padding: '4px 0px', margin: '0px 0px -2px' }}>
      <a className={brandCx} href="/">
        <span className="whitespace-nowrap">
          DreamLake
          <span className={dotCx} aria-hidden="true">
            .
          </span>
        </span>
        <span className={slashCx}>/</span>
        <span className={docsCx}>ros-viz</span>
        <span className={verCx}>
          <span className={verVCx}>v0.3.1</span>
          <span className={verShaCx}>
            <BranchIcon />
            8f2c1ae
          </span>
        </span>
      </a>

      <nav className={topcrumbsCx} aria-label="Breadcrumb" id="top-crumbs">
        <a href="/" className="text-inherit no-underline transition-colors duration-150 hover:text-ink">
          @dreamlake/ros-viz
        </a>
        <span className="sep opacity-50">/</span>
        <span className="here text-ink">Quick start</span>
      </nav>

      {/* Owns its own state + portal logic so it can escape the
          topbar's stacking context when the palette is open. */}
      <SearchInput />

      <div className={topnavActionsCx}>
        <a href="#" className={topnavLinkCx}>
          UI Kit
        </a>
        <a href="#" aria-label="GitHub" title="GitHub" className={topnavLinkCx}>
          <GitHubIcon />
        </a>
        <ThemeToggle />
      </div>
    </header>
  )
}
