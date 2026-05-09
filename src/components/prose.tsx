import { useRef, useState, type ReactNode } from 'react'

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
  'grid grid-cols-[18px_1fr] gap-3 px-3.5 py-3 rounded-md border border-faint my-[18px_0_22px]'
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

const cbWrapperCx =
  'relative bg-code-bg border border-faint rounded-md my-[18px_0_22px] overflow-hidden'

const cbHeadCx =
  'flex items-center gap-2.5 px-3 py-2 border-b border-faint bg-[color-mix(in_srgb,var(--color-ink)_3%,var(--color-code-bg))]'

const cbLangCx = 'font-mono text-[10px] font-semibold text-muted tracking-[0.14em] uppercase'
const cbFileCx = 'font-mono text-[10.5px] font-medium text-muted opacity-85 -ml-0.5'

const cbCopyBaseCx =
  'appearance-none border border-faint bg-transparent text-muted font-mono text-[10px] font-medium tracking-[0.08em] uppercase py-[3px] px-2 rounded-[5px] cursor-pointer transition-[color,border-color] duration-150 hover:text-ink hover:border-ink/[0.22]'
const cbCopyDoneCx = 'text-accent! border-accent/50!'

const cbPreCx = 'm-0 px-4 py-3.5 overflow-x-auto font-mono text-[12.5px] leading-[1.62] text-ink [&>code]:font-[inherit] [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0'

export const CodeBlock = ({
  lang,
  file,
  children,
}: {
  lang: string
  file?: string
  children: ReactNode
}) => {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    const text = preRef.current?.innerText ?? ''
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className={cbWrapperCx} data-lang={lang}>
      <div className={cbHeadCx}>
        <span className={cbLangCx}>{lang}</span>
        {file && <span className={cbFileCx}>{file}</span>}
        <span className="flex-1" />
        <button
          type="button"
          className={`${cbCopyBaseCx} ${copied ? cbCopyDoneCx : ''}`}
          onClick={onCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre ref={preRef} className={cbPreCx}>
        <code>{children}</code>
      </pre>
    </div>
  )
}

// ── Inline syntax-highlight spans for inside CodeBlock ───────────
// TODO(shiki): replace with build-time syntax highlighting (rehype-shiki)
// once we move prose to MDX. The hand-applied spans here paint over the
// @theme code-token colors (--color-kw / --color-str / etc.).

export const Kw = ({ children }: { children: ReactNode }) => (
  <span className="text-kw font-semibold">{children}</span>
)
export const Str = ({ children }: { children: ReactNode }) => (
  <span className="text-str">{children}</span>
)
export const Num = ({ children }: { children: ReactNode }) => (
  <span className="text-num">{children}</span>
)
export const Com = ({ children }: { children: ReactNode }) => (
  <span className="text-com italic">{children}</span>
)
export const Fn = ({ children }: { children: ReactNode }) => (
  <span className="text-fn font-medium">{children}</span>
)
export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="text-tag">{children}</span>
)
