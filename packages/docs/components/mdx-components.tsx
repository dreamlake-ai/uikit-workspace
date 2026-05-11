import {
  createContext,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
} from 'react'
import { CodeBlock } from './CodeBlock'
import { Callout } from './Callout'
import { Preview } from './Preview'

/** Set true inside <PreWrapper>; <Code> reads it to skip the inline chip
 *  styling on the <code> element nested inside <pre>. Needed because
 *  @shikijs/rehype puts the language className on the <pre>, leaving the
 *  inner <code> classNameless — we can't detect "block code" from props
 *  alone, so we use a context flag. */
const InsidePreContext = createContext(false)

const ChainIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ width: 14, height: 14, display: 'block' }}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.71 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ width: 14, height: 14, display: 'block' }}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/**
 * Hover-revealed chain icon next to a heading. Clicking it copies the
 * absolute deep-link URL (origin + pathname + #id) to the clipboard,
 * flashes a checkmark + accent color for ~1.2 s, **and** lets the
 * browser navigate to the anchor so the URL hash updates and the
 * page scrolls. Both behaviors at once is intentional — readers who
 * click expect both "go there" and "give me the link" — and reduces
 * the chance someone shares the URL bar's stale (non-anchored) form.
 *
 * Wired to H1, H2, H3 below; the parent heading carries the `group`
 * class so this stays hidden until hover (or this anchor itself is
 * focused, for keyboard a11y).
 */
function HeadingAnchor({ id, label }: { id?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  if (!id) return null

  const onClick = () => {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const base =
    'inline-flex items-center justify-center no-underline rounded transition-[opacity,background-color,color] duration-150'
  const idle =
    'text-doc-template-muted opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:text-doc-template-ink hover:bg-doc-template-chip focus-visible:opacity-100'
  // While the just-clicked state is showing, pin opacity to 1 and
  // paint with the accent color so the success affordance reads
  // unambiguously even after the pointer leaves the heading.
  const active = 'text-doc-template-accent !opacity-100'

  return (
    <a
      href={`#${id}`}
      onClick={onClick}
      aria-label={
        copied
          ? 'Link copied to clipboard'
          : label
            ? `Copy link to ${label}`
            : 'Copy link to this section'
      }
      title={copied ? 'Copied!' : 'Copy link to this section'}
      className={`${base} ${copied ? active : idle}`}
      style={{ width: 18, height: 18 }}
    >
      {copied ? <CheckIcon /> : <ChainIcon />}
    </a>
  )
}

/** Flatten a heading's children into a plain string for accessible
 *  labels — children may include JSX (`<code>`, `<em>`, links), but
 *  the aria-label / tooltip wants the readable text. */
function flatten(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flatten).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: React.ReactNode } }).props
    return props ? flatten(props.children) : ''
  }
  return ''
}

/**
 * MDX <pre> wrapper. Pulls language from the inner <code> className
 * (e.g., `language-tsx`) and renders our CodeBlock chrome around it.
 */
function PreWrapper(props: ComponentPropsWithoutRef<'pre'>) {
  // rehype-shiki + our transformers hoist `language="…"` (from the
  // fenced-block language) and `file="…"` (from the meta string) onto
  // the <pre>. Pull both off so they don't double up on the rendered
  // <pre>, and pass them as props to CodeBlock.
  const { children, file, language, ...rest } = props as ComponentPropsWithoutRef<'pre'> & {
    file?: string
    language?: string
  }
  return (
    <CodeBlock
      lang={typeof language === 'string' ? language : undefined}
      filename={typeof file === 'string' ? file : undefined}
    >
      <InsidePreContext.Provider value={true}>
        <pre
          {...rest}
          style={{
            margin: 0,
            padding: '14px 16px',
            fontFamily: 'var(--font-doc-template-mono)',
            fontSize: 12.5,
            lineHeight: 1.62,
            overflowX: 'auto',
            background: 'transparent',
            ...rest.style,
          }}
        >
          {children}
        </pre>
      </InsidePreContext.Provider>
    </CodeBlock>
  )
}

const H2: React.FC<ComponentPropsWithoutRef<'h2'>> = ({ id, children, style, ...rest }) => (
  <>
    {/* Non-sticky scroll anchor. The visible h2 below is `position:
        sticky` and both `getBoundingClientRect().top` and `offsetTop`
        on a stuck sticky element return the *painted* position (~40
        when stuck) rather than the natural layout position. That
        breaks any JS-driven scroll target calculation — the browser
        thinks the heading is "already here" and stops short. Putting
        the id on a zero-height non-sticky span just above the h2
        sidesteps the issue: the span's natural position is reliable.
        Margin choreography: move the h2's `marginTop: 48` onto the
        span so margin collapsing with the previous block stays the
        same. The span then sits where the h2's margin-top would have
        started, and the h2 follows with margin-top: 0 — visually
        identical to the old single-element layout. */}
    {id && (
      <span
        id={id}
        aria-hidden
        data-toc-anchor
        data-toc-level="2"
        style={{
          display: 'block',
          height: 0,
          marginTop: 48,
          scrollMarginTop: 64,
        }}
      />
    )}
    <h2
      {...rest}
      // Horizontal -margin / padding must match the active main padding so
      // the sticky bar extends edge-to-edge (18 px below lg, 56 px ≥ lg).
      // Vertical margin/padding kept in inline style.
      className="flex items-center text-doc-template-ink group -mx-[18px] px-[18px] lg:-mx-[56px] lg:px-[56px]"
      style={{
        position: 'sticky',
        top: 40,
        zIndex: 3,
        fontFamily: 'var(--font-doc-template-ui)',
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: '-0.018em',
        marginBottom: 12,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
        lineHeight: 1.2,
        backgroundColor: 'color-mix(in srgb, var(--color-doc-template-bg) 92%, transparent)',
        backdropFilter: 'saturate(140%) blur(8px)',
        WebkitBackdropFilter: 'saturate(140%) blur(8px)',
        ...style,
      }}
    >
      {children}
      <HeadingAnchor id={id} label={flatten(children)} />
    </h2>
  </>
)

const H3: React.FC<ComponentPropsWithoutRef<'h3'>> = ({ id, children, style, ...rest }) => (
  <h3
    id={id}
    {...rest}
    className="flex items-center text-doc-template-ink group"
    style={{
      fontFamily: 'var(--font-doc-template-ui)',
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: '-0.005em',
      margin: '28px 0 8px',
      gap: 8,
      scrollMarginTop: 124,
      ...style,
    }}
  >
    {children}
    <HeadingAnchor id={id} label={flatten(children)} />
  </h3>
)

// rehype-slug doesn't put an `id` on h1 by default, but the MDX
// pipeline does — every authored `# Title` lands here with an id.
// We pass it through so the clipboard-copy anchor has something to
// link to. The `group` class on the <h1> makes the hover-reveal work.
const H1: React.FC<ComponentPropsWithoutRef<'h1'>> = ({ id, children, style, ...rest }) => (
  <h1
    id={id}
    {...rest}
    className="flex items-center text-doc-template-ink group"
    style={{
      fontFamily: 'var(--font-doc-template-ui)',
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: '-0.025em',
      margin: '18px 0 10px',
      lineHeight: 1.1,
      gap: 8,
      ...style,
    }}
  >
    {children}
    <HeadingAnchor id={id} label={flatten(children)} />
  </h1>
)

// Body-copy size for paragraphs and lists. Matches dreamlake's
// [&>p]:text-[14.5px] [&>p]:leading-[1.65] — without this, browsers
// fall back to 16px / ~1.5 and the page reads chunkier than the design.
const BODY_FONT_SIZE = 14.5
const BODY_LINE_HEIGHT = 1.65

const P: React.FC<ComponentPropsWithoutRef<'p'>> = ({ children, style, ...rest }) => (
  <p
    {...rest}
    style={{
      margin: '0 0 14px',
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      textWrap: 'pretty',
      ...style,
    }}
  >
    {children}
  </p>
)

const UL: React.FC<ComponentPropsWithoutRef<'ul'>> = ({ children, style, ...rest }) => (
  <ul
    {...rest}
    style={{
      margin: '0 0 14px',
      paddingLeft: 22,
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      // Tailwind's preflight zeroes list-style on ul/ol; restore the
      // default disc/decimal markers (muted color is set via ::marker
      // in app.css, since pseudo-elements can't be styled inline).
      listStyleType: 'disc',
      listStylePosition: 'outside',
      ...style,
    }}
  >
    {children}
  </ul>
)

const OL: React.FC<ComponentPropsWithoutRef<'ol'>> = ({ children, style, ...rest }) => (
  <ol
    {...rest}
    style={{
      margin: '0 0 14px',
      paddingLeft: 22,
      fontSize: BODY_FONT_SIZE,
      lineHeight: BODY_LINE_HEIGHT,
      listStyleType: 'decimal',
      listStylePosition: 'outside',
      ...style,
    }}
  >
    {children}
  </ol>
)

const LI: React.FC<ComponentPropsWithoutRef<'li'>> = ({ children, style, ...rest }) => (
  <li {...rest} style={{ marginBottom: 4, ...style }}>
    {children}
  </li>
)

const Blockquote: React.FC<ComponentPropsWithoutRef<'blockquote'>> = ({ children, style, ...rest }) => (
  <blockquote
    {...rest}
    className="text-doc-template-muted bg-doc-template-accent-soft"
    style={{
      borderLeft: '2px solid var(--color-doc-template-accent)',
      padding: '4px 14px',
      margin: '14px 0',
      borderRadius: '0 var(--radius-doc-template-sm) var(--radius-doc-template-sm) 0',
      ...style,
    }}
  >
    {children}
  </blockquote>
)

const A: React.FC<ComponentPropsWithoutRef<'a'>> = ({ children, style, ...rest }) => (
  <a
    {...rest}
    className="text-doc-template-accent hover:[border-bottom-color:var(--color-doc-template-accent)]"
    style={{
      borderBottom: '1px solid color-mix(in srgb, var(--color-doc-template-accent) 35%, transparent)',
      textDecoration: 'none',
      ...style,
    }}
  >
    {children}
  </a>
)

const Table: React.FC<ComponentPropsWithoutRef<'table'>> = ({ children, style, ...rest }) => (
  <table {...rest} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '0 0 14px', ...style }}>
    {children}
  </table>
)

const Th: React.FC<ComponentPropsWithoutRef<'th'>> = ({ children, style, ...rest }) => (
  <th
    {...rest}
    className="text-doc-template-muted uppercase border-b border-doc-template-faint"
    style={{
      fontFamily: 'var(--font-doc-template-mono)',
      fontSize: 10,
      letterSpacing: '0.12em',
      textAlign: 'left',
      fontWeight: 600,
      background: 'color-mix(in srgb, var(--color-doc-template-ink) 2%, transparent)',
      padding: '9px 10px',
      ...style,
    }}
  >
    {children}
  </th>
)

const Td: React.FC<ComponentPropsWithoutRef<'td'>> = ({ children, style, ...rest }) => (
  <td
    {...rest}
    className="border-b border-doc-template-faint"
    style={{ padding: '9px 10px', verticalAlign: 'top', ...style }}
  >
    {children}
  </td>
)

const Code: React.FC<ComponentPropsWithoutRef<'code'>> = ({ className, children, style, ...rest }) => {
  // Block code is detected two ways: either Shiki's <code> sits inside our
  // <PreWrapper> (InsidePreContext is true — the common path with @shikijs/
  // rehype, which puts the language class on <pre> and leaves <code>
  // classNameless), or the className itself looks language-tagged.
  const insidePre = useContext(InsidePreContext)
  const isBlock = insidePre || (!!className && /(?:shiki|language-|hljs)/.test(className))
  if (isBlock) {
    return (
      <code className={className} {...rest} style={style}>
        {children}
      </code>
    )
  }
  return (
    <code
      {...rest}
      className={className}
      style={{
        fontFamily: 'var(--font-doc-template-mono)',
        fontSize: '0.88em',
        letterSpacing: '-0.005em',
        background: 'var(--color-doc-template-chip)',
        border: '1px solid var(--color-doc-template-faint)',
        padding: '1px 5px',
        borderRadius: 4,
        ...style,
      }}
    >
      {children}
    </code>
  )
}

export const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: UL,
  ol: OL,
  li: LI,
  a: A,
  blockquote: Blockquote,
  table: Table,
  th: Th,
  td: Td,
  code: Code,
  pre: PreWrapper,
  Callout,
  Preview,
}
