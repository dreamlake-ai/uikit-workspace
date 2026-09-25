import { useRef, type RefObject, type KeyboardEventHandler } from 'react'
import { cn } from '../../lib/utils'

export interface ListSearchInputProps {
  query: string
  onQuery: (query: string) => void
  placeholder?: string
  searchRef?: RefObject<HTMLInputElement | null>
  /** Strong underline while the field is active. The input never becomes a badge. */
  strongUnderline?: boolean
  /** Active filter. Omit for the unfiltered state. */
  filter?: { label: string; onRemove: () => void }
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  className?: string
}

export function ListSearchInput({
  query,
  onQuery,
  placeholder = 'search',
  searchRef,
  strongUnderline = false,
  filter,
  onKeyDown,
  className,
}: ListSearchInputProps) {
  const ownRef = useRef<HTMLInputElement>(null)
  const inputRef = searchRef ?? ownRef
  const removeFilter = () => {
    filter?.onRemove()
    inputRef.current?.focus()
  }
  return (
    <div
      className={cn('uikit-list-search', className)}
      data-strong={strongUnderline || undefined}
      data-has-query={query.length > 0 || undefined}
    >
      {filter && (
        <span className="uikit-search-filter">
          {filter.label}
          <button type="button" aria-label={`Remove ${filter.label} filter`}
            onClick={removeFilter} className="uikit-search-filter-remove">
            <span aria-hidden="true">×</span>
          </button>
        </span>
      )}
      <span aria-hidden="true" data-search-separator className="uikit-search-separator">
        /
      </span>
      <input
        ref={inputRef}
        type="search"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        aria-label={placeholder}
        placeholder={placeholder}
        value={query}
        className="uikit-search-input"
        data-has-query={query.length > 0 || undefined}
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || event.nativeEvent.isComposing) return
          if (event.key === 'Backspace' && filter &&
              event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0 &&
              !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault()
            removeFilter()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}
