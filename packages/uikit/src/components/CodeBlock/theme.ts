import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { CODE_METRICS } from './metrics'

/**
 * Token colors. Stock CodeMirror styles in both themes — `defaultHighlightStyle`
 * ships inside `@codemirror/language`, and one-dark contributes only its
 * *highlight style*, not its full theme, so it can't paint its own `#282c34`
 * background over our surface token.
 */
export function codeHighlighting(dark: boolean): Extension {
  return syntaxHighlighting(dark ? oneDarkHighlightStyle : defaultHighlightStyle, {
    fallback: true,
  })
}

export interface CodeThemeOptions {
  dark: boolean
  maxHeight?: number | string
  minHeight?: number | string
}

/**
 * Chrome-level styling: everything CodeMirror paints that isn't a syntax token
 * points at a uikit token, so the editor tracks the app's theme instead of
 * carrying its own palette. The surface itself stays transparent — the shell
 * owns the background (`bg-uikit-code`).
 */
export function codeTheme({ dark, maxHeight, minHeight }: CodeThemeOptions): Extension {
  return EditorView.theme(
    {
      '&': {
        backgroundColor: 'transparent',
        color: 'var(--color-uikit-ink)',
        fontFamily: CODE_METRICS.fontFamily,
        fontSize: CODE_METRICS.fontSize,
        ...(maxHeight === undefined
          ? null
          : { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
        ...(minHeight === undefined
          ? null
          : { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }),
      },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': {
        fontFamily: 'inherit',
        lineHeight: String(CODE_METRICS.lineHeight),
        overflow: 'auto',
      },
      // Vertical padding on the content, horizontal on each line — the split
      // keeps the gutter flush left while text still clears the border.
      '.cm-content': {
        padding: `${CODE_METRICS.paddingBlock} 0`,
        caretColor: 'var(--color-uikit-accent)',
      },
      '.cm-line': { padding: `0 ${CODE_METRICS.paddingInline}` },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        color: 'var(--color-uikit-muted)',
        border: 'none',
        borderRight: '1px solid var(--color-uikit-faint)',
      },
      '.cm-gutterElement': {
        padding: '0 0.6em 0 1em',
        fontVariantNumeric: 'tabular-nums',
      },
      '.cm-activeLine': { backgroundColor: 'var(--color-uikit-ink-4)' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-uikit-accent)' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--color-uikit-selected)',
      },
    },
    { dark }
  )
}
