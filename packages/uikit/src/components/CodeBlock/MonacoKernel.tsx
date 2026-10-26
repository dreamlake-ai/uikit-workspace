import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/basic-languages/monaco.contribution'
import { CODE_METRICS } from './metrics'
import { codeLanguage } from './languages'

export interface MonacoKernelProps {
  value: string
  onChange?: (value: string) => void
  lang?: string
  filename?: string
  editing: boolean
  lineNumbers: boolean
  wrap: boolean
  dark: boolean
  maxHeight?: number | string
  minHeight?: number | string
  onEscape?: () => void
  autoFocus?: boolean
}

/** One retained model and editor across reading, editing and prop changes. */
export default function MonacoKernel(props: MonacoKernelProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const current = useRef(props)
  current.current = props
  const applyingExternal = useRef(false)
  useEffect(() => {
    const element = host.current
    if (!element) return
    const initial = current.current
    const model = monaco.editor.createModel(
      initial.value,
      codeLanguage(monaco.languages.getLanguages(), initial.lang, initial.filename)
    )
    const fontFamily =
      getComputedStyle(element).getPropertyValue('--font-uikit-mono').trim() ||
      'ui-monospace, monospace'
    const instance = monaco.editor.create(element, {
      model,
      ariaLabel: initial.filename ? `Code: ${initial.filename}` : 'Code',
      fontFamily,
      fontSize: parseFloat(CODE_METRICS.fontSize),
      lineHeight: Math.round(parseFloat(CODE_METRICS.fontSize) * CODE_METRICS.lineHeight),
      padding: { top: 14, bottom: 14 },
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      folding: false,
      guides: { indentation: false, highlightActiveIndentation: false },
      glyphMargin: false,
      lineDecorationsWidth: 16,
      lineNumbersMinChars: 3,
      overviewRulerLanes: 0,
      renderLineHighlight: 'none',
      wordBasedSuggestions: 'off',
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      contextmenu: false,
      readOnly: !initial.editing,
      lineNumbers: initial.lineNumbers ? 'on' : 'off',
      wordWrap: initial.wrap ? 'on' : 'off',
      theme: initial.dark ? 'vs-dark' : 'vs',
    })
    view.current = instance
    const resize = () => {
      const height = `${instance.getContentHeight()}px`
      if (element.style.height !== height) {
        element.style.height = height
        instance.layout()
      }
    }
    const subscriptions = [
      instance.onDidChangeModelContent(() => {
        if (!applyingExternal.current) current.current.onChange?.(model.getValue())
      }),
      instance.onDidContentSizeChange(resize),
      instance.onKeyDown((event) => {
        if (event.keyCode !== monaco.KeyCode.Escape) return
        event.preventDefault()
        event.stopPropagation()
        if (current.current.onEscape) current.current.onEscape()
        else (element.querySelector('textarea') as HTMLTextAreaElement | null)?.blur()
      }),
    ]
    resize()
    element.dataset.monacoReady = 'true'
    return () => {
      delete element.dataset.monacoReady
      subscriptions.forEach((subscription) => subscription.dispose())
      instance.dispose()
      model.dispose()
      view.current = null
    }
  }, [])
  useEffect(() => {
    const instance = view.current
    if (!instance) return
    instance.updateOptions({
      readOnly: !props.editing,
      lineNumbers: props.lineNumbers ? 'on' : 'off',
      wordWrap: props.wrap ? 'on' : 'off',
      theme: props.dark ? 'vs-dark' : 'vs',
      ariaLabel: props.filename ? `Code: ${props.filename}` : 'Code',
    })
  }, [props.editing, props.lineNumbers, props.wrap, props.dark, props.filename])
  useEffect(() => {
    if (props.editing && props.autoFocus) view.current?.focus()
  }, [props.editing, props.autoFocus])
  useEffect(() => {
    const model = view.current?.getModel()
    if (model)
      monaco.editor.setModelLanguage(
        model,
        codeLanguage(monaco.languages.getLanguages(), props.lang, props.filename)
      )
  }, [props.lang, props.filename])
  useEffect(() => {
    const instance = view.current,
      model = instance?.getModel()
    if (!instance || !model || model.getValue() === props.value) return
    applyingExternal.current = true
    try {
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: props.value }],
        () => null
      )
    } finally {
      applyingExternal.current = false
    }
  }, [props.value])
  return (
    <div
      ref={host}
      data-uikit-code-editor
      style={{
        height: Math.max(1, props.value.split('\n').length) * 16 + 28,
        maxHeight: props.maxHeight,
        minHeight: props.minHeight,
        overflow: 'hidden',
      }}
    />
  )
}
