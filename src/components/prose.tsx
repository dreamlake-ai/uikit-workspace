import { useRef, useState, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

// ── Inline elements ──────────────────────────────────────────────

export const In = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    className="text-accent no-underline border-b border-accent/35 transition-[border-color] duration-150 hover:border-b-accent"
  >
    {children}
  </a>
)

// ── Block: breadcrumb above the H1 ───────────────────────────────

// Inline breadcrumb under the H1. Fades out when the H1 scrolls behind
// the topbar (body.is-merged is set by useMergedHeader; the topbar's own
// merged: variant fades the topcrumbs in at the same time).
const crumbsCx =
  'flex items-center gap-1.5 font-mono text-[10px] font-medium text-muted tracking-[0.04em] uppercase h-9 mt-2 mb-0 transition-[opacity,transform] duration-[250ms] ease-[cubic-bezier(.4,.7,.3,1)] ' +
  'merged:opacity-0 merged:-translate-y-1.5 merged:pointer-events-none'

export const Crumbs = ({
  trail,
  here,
}: {
  trail: { href: string; label: string }[]
  here: string
}) => (
  <nav className={crumbsCx} aria-label="Breadcrumb">
    {trail.map((c, i) => (
      <span key={c.href + i} style={{ display: 'contents' }}>
        <a href={c.href} className="text-inherit no-underline transition-colors duration-150 hover:text-ink">
          {c.label}
        </a>
        <span className="opacity-50">/</span>
      </span>
    ))}
    <span className="text-ink">{here}</span>
  </nav>
)

// ── Block: introductory lede paragraph under H1 ──────────────────

const ledeCx =
  'font-ui text-base font-normal leading-[1.6] text-muted m-0 mb-7 [text-wrap:pretty] max-w-[620px]'

export const Lede = ({
  children,
  style,
}: {
  children: ReactNode
  style?: React.CSSProperties
}) => (
  <p className={ledeCx} style={style}>
    {children}
  </p>
)

// ── Block: anchored H2 with hover-revealed link icon ─────────────

const AnchorIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-3.5 h-3.5 block"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const h2Cx =
  'sticky top-[38px] z-[3] font-ui text-[22px] font-semibold tracking-[-0.018em] mt-12 mb-3 -mx-14 px-14 pt-3 pb-2 text-ink [scroll-margin-top:64px] leading-tight flex items-center gap-2 bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] [backdrop-filter:saturate(140%)_blur(8px)] [-webkit-backdrop-filter:saturate(140%)_blur(8px)] group/h2'

const anchorCx =
  'inline-flex items-center justify-center w-[18px] h-[18px] text-muted no-underline rounded-[4px] opacity-0 transition-[opacity,background-color,color] duration-150 group-hover/h2:opacity-70 hover:opacity-100! hover:text-ink! hover:bg-chip!'

export const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className={h2Cx}>
    {children}{' '}
    <a className={anchorCx} href={`#${id}`} aria-label={`Link to ${flatten(children)}`}>
      <AnchorIcon />
    </a>
  </h2>
)

function flatten(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flatten).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    // @ts-expect-error — children may be ReactNode
    return flatten(node.props.children)
  }
  return ''
}

// ── Block: callout (info / warn) ─────────────────────────────────

const InfoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-[18px] h-[18px] mt-0.5 text-accent"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

const WarnIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-[18px] h-[18px] mt-0.5 text-[oklch(58%_.16_60)]"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)

const calloutBaseCx =
  'grid grid-cols-[18px_1fr] gap-3 px-3.5 py-3 rounded-md border border-faint [margin:18px_0_22px]'
const calloutInfoCx = 'bg-[color-mix(in_srgb,var(--color-accent)_5%,var(--color-bg))]'
const calloutWarnCx = 'bg-[color-mix(in_oklab,oklch(75%_.16_80)_10%,var(--color-bg))]'

const calloutBodyCx = 'font-ui text-[13.5px] leading-[1.55] text-ink [&>strong]:block [&>strong]:font-semibold [&>strong]:text-xs [&>strong]:text-ink [&>strong]:tracking-[-0.005em] [&>strong]:mb-0.5'

export const Callout = ({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warn'
  children: ReactNode
}) => (
  <div className={`${calloutBaseCx} ${type === 'warn' ? calloutWarnCx : calloutInfoCx}`}>
    {type === 'warn' ? <WarnIcon /> : <InfoIcon />}
    <div className={calloutBodyCx}>{children}</div>
  </div>
)

// ── Block: code block with chrome + working copy button ──────────
//
// CodeBlock just wraps a syntax-highlighted <pre> from rehype-shiki
// with the head bar (lang label, file label, copy + line-numbers
// toggle buttons). The chrome buttons appear only on hover via the
// Tailwind `group` modifier — see `cbBtnCx` below.
//
// The line-numbers toggle is persisted globally via useLocalStorage
// at `dl:line-numbers`. All CodeBlocks subscribe to the same key, so
// toggling one updates every other code block on the page.

const cbWrapperCx =
  // `group` enables `group-hover:` on chrome buttons.
  // Line-numbers state lives on `data-line-numbers="on|off"`; CSS in
  // theme.css renders the leading `<span class="line">::before`
  // counter when the attribute is "on".
  'group relative border border-faint rounded-md [margin:18px_0_22px] overflow-hidden [&_pre.shiki]:m-0 [&_pre.shiki]:px-4 [&_pre.shiki]:py-3.5 [&_pre.shiki]:overflow-x-auto [&_pre.shiki]:text-[12.5px] [&_pre.shiki]:leading-[1.62] [&_pre.shiki_code]:font-mono'

const cbHeadCx =
  'flex items-center gap-2.5 px-3 py-2 border-b border-faint bg-[color-mix(in_srgb,var(--color-ink)_3%,var(--color-code-bg))]'

const cbLangCx = 'font-mono text-[10px] font-semibold text-muted tracking-[0.14em] uppercase'
const cbFileCx = 'font-mono text-[10.5px] font-medium text-muted opacity-85 -ml-0.5'

// Shared chrome-button styling: hidden until the user hovers the
// codeblock (or focuses the button itself for keyboard a11y), then
// fades in. Both Copy and the line-numbers toggle share this.
const cbBtnCx =
  'appearance-none border border-faint bg-transparent text-muted font-mono text-[10px] font-medium tracking-[0.08em] uppercase py-[3px] px-2 rounded-[5px] cursor-pointer transition-[color,border-color,opacity] duration-150 hover:text-ink hover:border-ink/[0.22] ' +
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'

// Shared "active" state for chrome buttons (Copy → "Copied", line-num
// toggle → "on"). Same accent paint for both.
const cbBtnActiveCx = 'text-accent! border-accent/50!'

const HashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="w-3 h-3"
  >
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
)

export const CodeBlock = ({
  lang,
  file,
  children,
}: {
  lang: string
  file?: string
  children: ReactNode
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [showLines, setShowLines] = useLocalStorage<boolean>('line-numbers', false)

  const onCopy = () => {
    const pre = wrapperRef.current?.querySelector('pre')
    const text = pre?.innerText ?? ''
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div
      ref={wrapperRef}
      className={cbWrapperCx}
      data-lang={lang}
      data-line-numbers={showLines ? 'on' : 'off'}
    >
      <div className={cbHeadCx}>
        <span className={cbLangCx}>{lang}</span>
        {file && <span className={cbFileCx}>{file}</span>}
        <span className="flex-1" />
        <button
          type="button"
          aria-pressed={showLines}
          aria-label={showLines ? 'Hide line numbers' : 'Show line numbers'}
          title={showLines ? 'Hide line numbers' : 'Show line numbers'}
          className={`${cbBtnCx} flex items-center gap-1 ${showLines ? cbBtnActiveCx : ''}`}
          onClick={() => setShowLines(!showLines)}
        >
          <HashIcon />
          <span>:set {showLines ? 'nonu' : 'nu'}</span>
        </button>
        <button
          type="button"
          className={`${cbBtnCx} ${copied ? cbBtnActiveCx : ''}`}
          onClick={onCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {children}
    </div>
  )
}
