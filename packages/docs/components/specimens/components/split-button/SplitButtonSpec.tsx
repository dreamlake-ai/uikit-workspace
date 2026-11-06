import { useState } from 'react'
import { MenuItem, SplitButton, type ButtonVariant } from '@dreamlake/uikit'
import { Plus } from 'lucide-react'

export function SplitButtonSpec() {
  const [lastAction, setLastAction] = useState('Choose an action')
  const menu = (
    <>
      <MenuItem label="New note" onClick={() => setLastAction('New note')} />
      <MenuItem label="Add existing" onClick={() => setLastAction('Add existing')} />
      <MenuItem label="New folder" onClick={() => setLastAction('New folder')} />
    </>
  )
  return (
    <div data-split-button-specimen="" className="flex flex-col gap-4">
      {(
        [
          ['secondary', 'Framed'],
          ['primary', 'Filled'],
          ['ghost', 'Ghost'],
          ['action', 'Header action'],
        ] as const
      ).map(([variant, label]) => (
        <div key={variant} className="flex flex-wrap items-center gap-4">
          <span className="w-24 text-sm text-uikit-muted">{label}</span>
          <SplitButton
            variant={variant as ButtonVariant}
            leftIcon={<Plus size={14} />}
            menu={menu}
            menuLabel={`${label}: more add options`}
            onClick={() => setLastAction('New note')}
          >
            New note
          </SplitButton>
          <SplitButton
            variant={variant}
            icon
            aria-label={`${label}: add note`}
            menuLabel={`${label}: icon add options`}
            menu={menu}
            onClick={() => setLastAction('New note')}
          >
            <Plus size={14} />
          </SplitButton>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <SplitButton disabled menu={menu}>
          Disabled
        </SplitButton>
        <SplitButton loading menu={menu}>
          Creating…
        </SplitButton>
      </div>
      <p role="status" className="text-sm text-uikit-muted">
        {lastAction}
      </p>
    </div>
  )
}
