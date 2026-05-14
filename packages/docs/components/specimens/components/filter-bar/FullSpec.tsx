import { useState } from 'react'
import { FilterBar } from '@dreamlake/uikit'

const FILTERS = [
  { value: 'all',     label: 'all',     count: 24 },
  { value: 'running', label: 'running', count: 3, accent: '#1f9d55' },
  { value: 'failed',  label: 'failed',  count: 2, accent: '#e3342f' },
  { value: 'queued',  label: 'queued',  count: 5 },
  { value: 'done',    label: 'done',    count: 14 },
]

const SORT_OPTIONS = [
  { value: 'recent',  label: 'recent' },
  { value: 'oldest',  label: 'oldest' },
  { value: 'name-az', label: 'name a–z' },
  { value: 'name-za', label: 'name z–a' },
]

export const FullSpec = () => {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  return (
    <FilterBar
      filters={FILTERS}
      filterValue={filter}
      onFilterChange={setFilter}
      query={query}
      onQueryChange={setQuery}
      placeholder="search experiments…"
      sortValue={sort}
      onSortChange={setSort}
      sortOptions={SORT_OPTIONS}
    />
  )
}
