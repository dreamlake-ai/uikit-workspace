import { useState } from 'react'
import { List, Menu } from 'lucide-react'
import { Button, TabRow } from '@dreamlake/uikit'

export function IconTabsSpec() {
  const [value, setValue] = useState('content')
  const [navigation, setNavigation] = useState(false)
  return <div className="max-w-sm">
    <TabRow
      value={value}
      onValueChange={setValue}
      aria-label="Workspace panels"
      leading={<Button variant="ghost" icon size="sm" className="size-6 text-uikit-muted"
        aria-label="Menu" aria-expanded={navigation} onClick={() => setNavigation(!navigation)}>
        <Menu size={14} />
      </Button>}
      tabs={[
        { value: 'list', label: 'List', icon: <List size={14} />, iconOnly: true },
        { value: 'content', label: 'Content' },
      ]}
    />
    <p className="mt-3 text-sm text-uikit-muted">
      {navigation ? 'Navigation is open.' : value === 'list' ? 'Select an item from the list.' : 'Selected item content.'}
    </p>
  </div>
}
