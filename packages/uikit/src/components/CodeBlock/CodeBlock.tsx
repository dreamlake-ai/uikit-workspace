import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Hash } from 'lucide-react'
import { cn } from '../../lib/utils'
import { fallbackPreStyle } from './metrics'
import { useHtmlTheme, type ResolvedTheme } from './useHtmlTheme'

// The whole point of the lazy boundary: CodeMirror lives behind a dynamic
// import, so `import { Button }` — or a CodeBlock that's never scrolled into
// view — costs nothing. tsup pins `splitting: true` to keep this a real chunk.
const CodeMirrorKernel = lazy(() => import('./CodeMirrorKernel'))

export type CodeBlockEditable = boolean | 'toggle'

export interface CodeBlockProps {
  /** Code to show. Controlled — pair with `onChange`. */
  value?: string
  /** Initial code when uncontrolled. */
  defaultValue?: string
  onChange?: (value: string) => void

  /**
   * Language name, alias, or extension (`'json'`, `'tsx'`, `'yaml'`, `'py'`…).
   * Resolved against the 143-language CodeMirror registry; anything it doesn't
   * recognise renders as plain text instead of throwing. Falls back to
   * `filename`'s extension when omitted.
   */
  lang?: string

  /** `false` read-only · `true` editable · `'toggle'` read-only with an Edit button. */
  editable?: CodeBlockEditable
  /** Controlled editing state for `editable="toggle"`. */
  editing?: boolean
  onEditingChange?: (editing: boolean) => void

  /** Render the header bar. */
  header?: boolean
  filename?: string
  /** Show the language chip in the header. */
  showLang?: boolean
  /** Show the Copy button. */
  copyable?: boolean
  /** Extra header controls, rendered before the built-in buttons. */
  actions?: ReactNode

  lineNumbers?: boolean
  defaultLineNumbers?: boolean
  onLineNumbersChange?: (lineNumbers: boolean) => void

  maxHeight?: number | string
  minHeight?: number | string
  /** Soft-wrap long lines instead of scrolling horizontally. */
  wrap?: boolean

  /** Pin light/dark. Defaults to following `<html data-theme>`. */
  theme?: ResolvedTheme

  className?: string
}

const headerButton = (active: boolean) =>
  cn(
    'inline-flex h-[22px] cursor-pointer items-center gap-1 rounded-[4px] border px-2',
    'font-uikit-mono text-uikit-10 uppercase tracking-uikit-wide',
    'transition-colors duration-100',
    active
      ? 'border-uikit-accent text-uikit-accent'
      : 'border-uikit-faint text-uikit-muted hover:text-uikit-ink'
  )

const sizeStyle = (maxHeight?: number | string, minHeight?: number | string): CSSProperties => ({
  ...(maxHeight === undefined ? null : { maxHeight }),
  ...(minHeight === undefined ? null : { minHeight }),
})

/**
 * A self-contained code surface: syntax-highlighted when read-only, editable
 * when asked. One shell, one engine — read-only and editing are the same
 * CodeMirror view reconfigured, so switching between them doesn't shift the
 * layout or recolor the code.
 */
export function CodeBlock({
  value,
  defaultValue,
  onChange,
  lang,
  editable = false,
  editing,
  onEditingChange,
  header = true,
  filename,
  showLang = true,
  copyable = true,
  actions,
  lineNumbers,
  defaultLineNumbers = false,
  onLineNumbersChange,
  maxHeight,
  minHeight,
  wrap = false,
  theme,
  className,
}: CodeBlockProps) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? '')
  const code = value ?? innerValue

  const [innerEditing, setInnerEditing] = useState(false)
  const isToggle = editable === 'toggle'
  const isEditing = editable === true || (isToggle && (editing ?? innerEditing))

  const [innerLineNumbers, setInnerLineNumbers] = useState(defaultLineNumbers)
  const showLineNumbers = lineNumbers ?? innerLineNumbers
  // A pinned `lineNumbers` with nowhere to report a change means the toggle
  // could never do anything — a control that visibly reads as on but ignores
  // clicks. Consumers who pin it are saying they don't want it toggled, so
  // drop the button rather than render a dead one.
  const canToggleLineNumbers = lineNumbers === undefined || onLineNumbersChange !== undefined

  const [copied, setCopied] = useState(false)
  const dark = useHtmlTheme(theme) === 'dark'

  // The kernel mounts only after hydration. `renderToString` — which Vike and
  // plenty of other SSR setups still use — cannot render a boundary that
  // actually suspends: React aborts the render and de-opts the whole page to
  // client rendering. Gating on mount means the server and the first client
  // render both produce the same plain <pre>, so hydration matches and the
  // lazy chunk is fetched immediately afterwards.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleChange = useCallback(
    (next: string) => {
      if (value === undefined) setInnerValue(next)
      onChange?.(next)
    },
    [value, onChange]
  )

  const setEditing = useCallback(
    (next: boolean) => {
      if (editing === undefined) setInnerEditing(next)
      onEditingChange?.(next)
    },
    [editing, onEditingChange]
  )

  const toggleLineNumbers = useCallback(() => {
    const next = !showLineNumbers
    if (lineNumbers === undefined) setInnerLineNumbers(next)
    onLineNumbersChange?.(next)
  }, [showLineNumbers, lineNumbers, onLineNumbersChange])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      },
      () => {
        /* Clipboard blocked (insecure origin, denied permission) — stay quiet. */
      }
    )
  }, [code])

  // Same font, size, leading and padding as the kernel, so the swap when
  // CodeMirror lands is a recolor rather than a reflow. Being a real <pre> also
  // means the code is present in server-rendered HTML.
  const placeholder = (
    <pre
      style={{
        ...fallbackPreStyle,
        whiteSpace: wrap ? 'pre-wrap' : 'pre',
        ...sizeStyle(maxHeight, minHeight),
        overflow: 'auto',
      }}
    >
      <code>{code}</code>
    </pre>
  )

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-uikit-card)] border border-uikit-faint bg-uikit-code',
        className
      )}
    >
      {header && (
        <div className="flex items-center gap-3 border-b border-uikit-faint bg-uikit-ink-4 px-3 py-1.5">
          {filename && (
            <span className="truncate font-uikit-mono text-uikit-10 font-semibold text-uikit-muted">
              {filename}
            </span>
          )}
          {showLang && lang && (
            <span className="font-uikit-mono text-uikit-10 font-semibold uppercase tracking-uikit-wide text-uikit-muted">
              {lang}
            </span>
          )}
          <span className="flex-1" />
          {actions}
          {canToggleLineNumbers && (
            <button
              type="button"
              aria-pressed={showLineNumbers}
              aria-label={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
              title={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
              onClick={toggleLineNumbers}
              className={headerButton(showLineNumbers)}
            >
              <Hash size={10} />
            </button>
          )}
          {copyable && (
            <button type="button" onClick={copy} className={headerButton(copied)}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {isToggle && (
            <button
              type="button"
              aria-pressed={isEditing}
              onClick={() => setEditing(!isEditing)}
              className={headerButton(isEditing)}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      )}

      <div style={sizeStyle(maxHeight, minHeight)} className="overflow-hidden">
        {mounted ? (
          <Suspense fallback={placeholder}>
            <CodeMirrorKernel
              value={code}
              onChange={handleChange}
              lang={lang}
              filename={filename}
              editing={isEditing}
              lineNumbers={showLineNumbers}
              wrap={wrap}
              dark={dark}
              maxHeight={maxHeight}
              minHeight={minHeight}
              autoFocus={isToggle}
              onEscape={isToggle && isEditing ? () => setEditing(false) : undefined}
            />
          </Suspense>
        ) : (
          placeholder
        )}
      </div>
    </div>
  )
}
