import { type ReactNode } from 'react'

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading'

export interface ToastAction {
  label: ReactNode
  onClick: () => void
}

export interface ToastOptions {
  /** Reuse/replace an existing toast by id. */
  id?: string | number
  /** Secondary line under the title. */
  description?: ReactNode
  /** Auto-dismiss after N ms. `Infinity` keeps it until dismissed. */
  duration?: number
  /** A single action button. */
  action?: ToastAction
}

export interface ToastItem extends ToastOptions {
  id: string | number
  type: ToastType
  title?: ReactNode
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
let counter = 0

function emit() {
  for (const l of listeners) l(toasts)
}

/** Internal store consumed by <Toaster>. */
export const toastStore = {
  subscribe(l: Listener) {
    listeners.add(l)
    l(toasts)
    return () => {
      listeners.delete(l)
    }
  },
  add(t: ToastItem) {
    // Replace if an id collides (used by promise() to swap loading → result).
    toasts = [...toasts.filter((x) => x.id !== t.id), t]
    emit()
  },
  update(id: string | number, patch: Partial<ToastItem>) {
    toasts = toasts.map((x) => (x.id === id ? { ...x, ...patch } : x))
    emit()
  },
  dismiss(id?: string | number) {
    toasts = id == null ? [] : toasts.filter((x) => x.id !== id)
    emit()
  },
}

function create(type: ToastType, message: ReactNode, opts: ToastOptions = {}) {
  const id = opts.id ?? ++counter
  toastStore.add({
    id,
    type,
    title: message,
    description: opts.description,
    duration: opts.duration,
    action: opts.action,
  })
  return id
}

export interface ToastPromiseMessages<T> {
  loading: ReactNode
  success: ReactNode | ((data: T) => ReactNode)
  error: ReactNode | ((err: unknown) => ReactNode)
}

/**
 * Imperative toast API. Drop-in subset of sonner's `toast` (which the legacy
 * `@vuer-ai/vuer-uikit` re-exported): callable plus `.success/.error/.info/
 * .warning/.message/.loading/.dismiss/.promise`. Render a single `<Toaster />`
 * at the app root.
 */
export const toast = Object.assign(
  (message: ReactNode, opts?: ToastOptions) => create('default', message, opts),
  {
    success: (message: ReactNode, opts?: ToastOptions) => create('success', message, opts),
    error: (message: ReactNode, opts?: ToastOptions) => create('error', message, opts),
    info: (message: ReactNode, opts?: ToastOptions) => create('info', message, opts),
    warning: (message: ReactNode, opts?: ToastOptions) => create('warning', message, opts),
    message: (message: ReactNode, opts?: ToastOptions) => create('default', message, opts),
    loading: (message: ReactNode, opts?: ToastOptions) =>
      create('loading', message, { duration: Infinity, ...opts }),
    dismiss: (id?: string | number) => toastStore.dismiss(id),
    promise: <T,>(promise: Promise<T> | (() => Promise<T>), msgs: ToastPromiseMessages<T>) => {
      const id = create('loading', msgs.loading, { duration: Infinity })
      const p = typeof promise === 'function' ? promise() : promise
      Promise.resolve(p).then(
        (data) =>
          toastStore.update(id, {
            type: 'success',
            title: typeof msgs.success === 'function' ? msgs.success(data) : msgs.success,
            duration: 4000,
          }),
        (err) =>
          toastStore.update(id, {
            type: 'error',
            title: typeof msgs.error === 'function' ? msgs.error(err) : msgs.error,
            duration: 4000,
          }),
      )
      return id
    },
  },
)
