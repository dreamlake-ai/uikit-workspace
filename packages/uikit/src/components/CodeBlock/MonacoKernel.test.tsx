// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import MonacoKernel, { type MonacoKernelProps } from './MonacoKernel'

const mocks = vi.hoisted(() => {
  let value = ''
  let change = () => {}
  let key = (_: any) => {}
  const subscriptions: { dispose: ReturnType<typeof vi.fn> }[] = []
  const subscribe = () => {
    const s = { dispose: vi.fn() }
    subscriptions.push(s)
    return s
  }
  const model = {
    getValue: () => value,
    getFullModelRange: () => ({}),
    dispose: vi.fn(),
    pushEditOperations: vi.fn((_: unknown, edits: { text: string }[]) => {
      value = edits[0].text
      change()
    }),
  }
  const editor = {
    getModel: () => model,
    getContentHeight: () => 60,
    layout: vi.fn(),
    focus: vi.fn(),
    updateOptions: vi.fn(),
    dispose: vi.fn(),
    onDidChangeModelContent: vi.fn((fn: () => void) => {
      change = fn
      return subscribe()
    }),
    onDidContentSizeChange: vi.fn(subscribe),
    onKeyDown: vi.fn((fn: (event: any) => void) => {
      key = fn
      return subscribe()
    }),
    executeEdits: vi.fn((_: string, edits: { text: string }[]) => {
      value = edits[0].text
      change()
    }),
  }
  return {
    model,
    editor,
    subscriptions,
    key: (event: any) => key(event),
    type: (next: string) => {
      value = next
      change()
    },
    createModel: vi.fn((text: string) => {
      value = text
      return model
    }),
    create: vi.fn(() => editor),
    setModelLanguage: vi.fn(),
  }
})
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: mocks.create,
    createModel: mocks.createModel,
    setModelLanguage: mocks.setModelLanguage,
  },
  languages: {
    getLanguages: () => [{ id: 'plaintext' }, { id: 'typescript', extensions: ['.ts'] }],
  },
  KeyCode: { Escape: 9 },
}))
vi.mock('monaco-editor/esm/vs/basic-languages/monaco.contribution', () => ({}))
let root: Root
let host: HTMLDivElement
const base: MonacoKernelProps = {
  value: 'first',
  editing: false,
  lineNumbers: false,
  wrap: false,
  dark: false,
}
beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  vi.clearAllMocks()
  mocks.subscriptions.length = 0
  host = document.body.appendChild(document.createElement('div'))
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})
const render = (props: Partial<MonacoKernelProps> = {}) =>
  act(() => root.render(<MonacoKernel {...base} {...props} />))

it('retains its model across mode, theme, wrap, filename and controlled-value updates', () => {
  const onChange = vi.fn()
  render({ onChange })
  render({
    onChange,
    editing: true,
    autoFocus: true,
    filename: 'file.ts',
    dark: true,
    wrap: true,
    value: 'remote',
  })
  expect(mocks.create).toHaveBeenCalledTimes(1)
  expect(mocks.createModel).toHaveBeenCalledTimes(1)
  expect(mocks.model.getValue()).toBe('remote')
  expect(onChange).not.toHaveBeenCalled()
  expect(mocks.setModelLanguage).toHaveBeenLastCalledWith(mocks.model, 'typescript')
  expect(mocks.editor.updateOptions).toHaveBeenLastCalledWith(
    expect.objectContaining({ readOnly: false, wordWrap: 'on' })
  )
  act(() => mocks.type('local'))
  expect(onChange).toHaveBeenLastCalledWith('local')
})
it('focuses when editing starts, without stealing focus on theme or layout changes', () => {
  render({ editing: true, autoFocus: true })
  expect(mocks.editor.focus).toHaveBeenCalledTimes(1)
  render({ editing: true, autoFocus: true, dark: true, lineNumbers: true, wrap: true })
  expect(mocks.editor.focus).toHaveBeenCalledTimes(1)
})
it('uses current callbacks and disposes every subscription, editor and model', () => {
  const old = vi.fn(),
    next = vi.fn(),
    escape = vi.fn()
  render({ onChange: old })
  render({ onChange: next, onEscape: escape })
  act(() => mocks.type('second'))
  expect(old).not.toHaveBeenCalled()
  expect(next).toHaveBeenCalledWith('second')
  const event = { keyCode: 9, preventDefault: vi.fn(), stopPropagation: vi.fn() }
  act(() => mocks.key(event))
  expect(escape).toHaveBeenCalledOnce()
  expect(event.preventDefault).toHaveBeenCalledOnce()
  act(() => root.render(null))
  expect(mocks.editor.dispose).toHaveBeenCalledOnce()
  expect(mocks.model.dispose).toHaveBeenCalledOnce()
  for (const s of mocks.subscriptions) expect(s.dispose).toHaveBeenCalledOnce()
})
