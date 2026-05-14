import { useState } from 'react'
import { FilterBar } from '@dreamlake/uikit'

export const SearchOnlySpec = () => {
  const [query, setQuery] = useState('')
  return (
    <FilterBar
      query={query}
      onQueryChange={setQuery}
      placeholder="search datasets…"
    />
  )
}
