import { useState } from 'react'
import { FilterBar, ListSearchInput } from '@dreamlake/uikit'

export function Demo() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('yours')
  return <FilterBar
    filters={['all', 'yours', 'shared'].map(value => ({ value, label: value }))}
    filterValue={category} onFilterChange={setCategory}
    query={query} onQueryChange={setQuery} placeholder="search notes"
  />
}

export function AlwaysOpen() {
  const [query, setQuery] = useState('')
  return <ListSearchInput query={query} onQuery={setQuery} placeholder="search entries" />
}
