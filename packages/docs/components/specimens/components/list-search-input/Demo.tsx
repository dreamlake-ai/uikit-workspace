import { useState } from 'react'
import { FilterBar, ListSearchInput } from '@dreamlake/uikit'

export function Demo() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('yours')
  return (
    <FilterBar
      filters={['all', 'yours', 'shared'].map((value) => ({ value, label: value }))}
      filterValue={category}
      onFilterChange={setCategory}
      query={query}
      onQueryChange={setQuery}
      placeholder="search notes"
    />
  )
}

export function AlwaysOpen() {
  const [query, setQuery] = useState('')
  return <ListSearchInput query={query} onQuery={setQuery} placeholder="search entries" />
}

export function MultipleFilters() {
  const [query, setQuery] = useState('')
  const [labels, setLabels] = useState(['Public', 'Owned by me'])
  return (
    <ListSearchInput
      query={query}
      onQuery={setQuery}
      placeholder="search memos"
      filters={labels.map((label) => ({
        label,
        onRemove: () => setLabels((current) => current.filter((value) => value !== label)),
      }))}
    />
  )
}
