# Toast

Transient, non-blocking notifications. Mount `` **once** near the app
root, then call the imperative `toast()` API from anywhere.

```tsx

// at the app root:

// anywhere:
toast('Saved')
toast.success('Published')
toast.error('Upload failed', { description: 'Network error.' })
toast.promise(upload(), { loading: 'Uploading…', success: 'Done', error: 'Failed' })
```

## API

| Call | Description |
| --- | --- |
| `toast(message, opts?)` | Neutral toast. |
| `toast.message(message, opts?)` | Neutral toast — alias for `toast()`. |
| `toast.success / error / info / warning(message, opts?)` | Typed toasts with a colored indicator dot. |
| `toast.loading(message, opts?)` | Sticky toast with a spinner (until dismissed/updated). |
| `toast.promise(p, { loading, success, error })` | Shows loading, then resolves to success/error. |
| `toast.dismiss(id?)` | Dismiss one toast (or all when `id` omitted). |

`opts`: `{ id?, description?, duration?, action? }`. Pass an existing `id` to
reuse and replace that toast in place (a new toast is created when the id is
new). Auto-dismiss defaults to the Toaster's `duration` (4000ms); pass
`duration: Infinity` to keep a toast until dismissed.

`toast.promise` also accepts a function that returns the promise (called
immediately), and its `success` / `error` can be functions — they receive the
resolved value or the error and return the message to show.

## `Toaster` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-right'` | Stack anchor. |
| `duration` | `number` | `4000` | Default auto-dismiss (ms). |
