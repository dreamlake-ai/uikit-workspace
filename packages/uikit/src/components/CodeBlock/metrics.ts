import type { CSSProperties } from 'react'

/**
 * Type metrics shared by the CodeMirror kernel and the plain `<pre>` the shell
 * shows while that kernel is still loading. Both must agree exactly, or the
 * block reflows the moment the editor arrives.
 *
 * This module deliberately imports nothing from CodeMirror. The shell needs the
 * metrics, the kernel needs the metrics, and if they lived alongside the theme
 * extensions the bundler would hoist them into a chunk the shell reaches
 * statically — dragging `@codemirror/view` back into every consumer's graph and
 * defeating the lazy boundary.
 */
export const CODE_METRICS = {
  fontFamily: 'var(--font-uikit-mono)',
  fontSize: '12.5px',
  lineHeight: 1.3,
  paddingBlock: '14px',
  paddingInline: '16px',
} as const

/** The fallback `<pre>`'s inline style, derived from the same metrics. */
export const fallbackPreStyle: CSSProperties = {
  margin: 0,
  fontFamily: CODE_METRICS.fontFamily,
  fontSize: CODE_METRICS.fontSize,
  lineHeight: CODE_METRICS.lineHeight,
  padding: `${CODE_METRICS.paddingBlock} ${CODE_METRICS.paddingInline}`,
  background: 'transparent',
}
