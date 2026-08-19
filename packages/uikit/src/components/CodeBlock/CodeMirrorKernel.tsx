import { useEffect, useRef } from 'react'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers as lineNumbersGutter,
} from '@codemirror/view'
import { loadLanguage } from './languages'
import { codeHighlighting, codeTheme } from './theme'

export interface CodeMirrorKernelProps {
  value: string
  onChange?: (value: string) => void
  lang?: string
  filename?: string
  /** Read-only when false — same view, reconfigured, so nothing re-renders. */
  editing: boolean
  lineNumbers: boolean
  wrap: boolean
  dark: boolean
  maxHeight?: number | string
  minHeight?: number | string
  /** Called on Escape. Without one, Escape blurs (the Tab-trap escape hatch). */
  onEscape?: () => void
  /** Focus the editor when it enters the editing state. */
  autoFocus?: boolean
}

/**
 * Extensions that differ between reading and writing.
 *
 * Deliberately not `basic-setup`: that bundles autocompletion, search, bracket
 * matching, fold gutters and more — none of which a UI-kit code block wants by
 * default, and all of which would land in the chunk.
 */
function modeExtensions(editing: boolean): Extension {
  if (!editing) return [EditorState.readOnly.of(true), EditorView.editable.of(false)]
  return [
    history(),
    highlightActiveLine(),
    indentUnit.of('  '),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
  ]
}

/**
 * The CodeMirror half of CodeBlock, reached only through a dynamic import.
 *
 * Read-only and editable are the *same* EditorView with different compartment
 * contents, so toggling between them keeps the DOM, the syntax colors and the
 * scroll position exactly as they were.
 *
 * Default export because `React.lazy` requires one.
 */
export default function CodeMirrorKernel({
  value,
  onChange,
  lang,
  filename,
  editing,
  lineNumbers,
  wrap,
  dark,
  maxHeight,
  minHeight,
  onEscape,
  autoFocus,
}: CodeMirrorKernelProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)

  // Callbacks and the initial doc are read through refs so the view is built
  // once and never torn down by a changing prop identity.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape
  const valueRef = useRef(value)
  valueRef.current = value

  // True while we're pushing a new `value` prop into the document, so the
  // update listener doesn't echo that back out as an onChange.
  const applyingExternal = useRef(false)

  const parts = useRef({
    language: new Compartment(),
    mode: new Compartment(),
    lineNumbers: new Compartment(),
    wrap: new Compartment(),
    theme: new Compartment(),
  }).current

  useEffect(() => {
    const parent = host.current
    if (!parent) return

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        // First wins on key conflicts — Escape must beat the default keymap.
        keymap.of([
          {
            key: 'Escape',
            run: (v) => {
              if (onEscapeRef.current) onEscapeRef.current()
              else v.contentDOM.blur()
              return true
            },
          },
        ]),
        parts.theme.of([]),
        parts.language.of([]),
        parts.lineNumbers.of([]),
        parts.wrap.of([]),
        parts.mode.of([]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || applyingExternal.current) return
          onChangeRef.current?.(update.state.doc.toString())
        }),
      ],
    })

    const instance = new EditorView({ state, parent })
    view.current = instance
    return () => {
      instance.destroy()
      view.current = null
    }
    // Built once; every prop below drives a compartment instead.
  }, [parts])

  // ── Reconfigure on prop changes ───────────────────────────────────────────

  useEffect(() => {
    view.current?.dispatch({
      effects: parts.theme.reconfigure([
        codeTheme({ dark, maxHeight, minHeight }),
        codeHighlighting(dark),
      ]),
    })
  }, [dark, maxHeight, minHeight, parts])

  useEffect(() => {
    let alive = true
    void loadLanguage(lang, filename).then((extension) => {
      if (!alive) return
      view.current?.dispatch({ effects: parts.language.reconfigure(extension ?? []) })
    })
    return () => {
      alive = false
    }
  }, [lang, filename, parts])

  useEffect(() => {
    view.current?.dispatch({
      effects: parts.lineNumbers.reconfigure(lineNumbers ? lineNumbersGutter() : []),
    })
  }, [lineNumbers, parts])

  useEffect(() => {
    view.current?.dispatch({
      effects: parts.wrap.reconfigure(wrap ? EditorView.lineWrapping : []),
    })
  }, [wrap, parts])

  useEffect(() => {
    const instance = view.current
    if (!instance) return
    instance.dispatch({ effects: parts.mode.reconfigure(modeExtensions(editing)) })
    if (editing && autoFocus) instance.focus()
  }, [editing, autoFocus, parts])

  // ── Pull an externally-changed `value` into the document ──────────────────

  useEffect(() => {
    const instance = view.current
    if (!instance) return
    const current = instance.state.doc.toString()
    if (current === value) return
    applyingExternal.current = true
    instance.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    applyingExternal.current = false
  }, [value])

  return <div ref={host} />
}
