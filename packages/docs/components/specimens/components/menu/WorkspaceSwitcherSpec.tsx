import { useState } from 'react'
import { User, Users, Plus, LogOut } from 'lucide-react'
import { Menu, MenuSection, MenuItem, MenuDivider, Avatar } from '@dreamlake/uikit'

type Account = { id: string; kind: 'user' | 'org'; name: string; handle: string }

const ACCOUNTS: Account[] = [
  { id: 'u-geyang',    kind: 'user', name: 'Ge Yang',   handle: 'geyang' },
  { id: 'o-mit-csail', kind: 'org',  name: 'MIT CSAIL', handle: 'mit-csail' },
  { id: 'o-vuer-ai',   kind: 'org',  name: 'Vuer AI',   handle: 'vuer-ai' },
]

function AccountRow({
  account, active, onClick,
}: { account: Account; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-3.5 py-[7px] cursor-pointer bg-transparent hover:bg-uikit-ink-4 transition-[background] duration-[120ms]"
    >
      <Avatar name={account.name} size={22} />
      <div className="flex flex-col gap-px min-w-0 flex-1">
        <span
          data-active={active || undefined}
          className="font-uikit-ui text-[12.5px] leading-uikit-snug font-medium data-[active]:font-semibold text-uikit-ink tracking-uikit-snug whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {account.name}
        </span>
        <span className="font-uikit-mono text-uikit-10 leading-uikit-snug text-uikit-muted opacity-65 tracking-uikit-snug">
          @{account.handle}
        </span>
      </div>
      {active && (
        <span className="font-uikit-mono text-[9px] leading-uikit-snug text-uikit-muted opacity-80 tracking-uikit-wider uppercase">
          current
        </span>
      )}
    </div>
  )
}

export const WorkspaceSwitcherSpec = () => {
  const [currentId, setCurrentId] = useState('u-geyang')
  const current = ACCOUNTS.find(a => a.id === currentId)!
  const personals = ACCOUNTS.filter(a => a.kind === 'user')
  const orgs = ACCOUNTS.filter(a => a.kind === 'org')
  const isOrg = current.kind === 'org'
  const possessive = isOrg ? current.name : `${current.name}'s`

  return (
    <Menu
      align="left"
      width={280}
      trigger={(open) => (
        <div className="text-left">
          <div className="font-uikit-ui text-uikit-12 font-medium leading-uikit-snug text-uikit-muted opacity-75 tracking-uikit-snug mb-1.5 inline-flex items-center gap-1">
            <span>{possessive}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              data-open={open || undefined}
              className="opacity-70 shrink-0 rotate-0 data-[open]:rotate-180 transition-transform duration-[180ms]"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="font-uikit-ui text-uikit-22 font-semibold text-uikit-ink tracking-uikit-tightest leading-none">
            dream<span className="text-uikit-accent font-black text-[1.25em] inline-block leading-none align-baseline ml-px">.</span>lake
          </div>
        </div>
      )}
    >
      <MenuSection label="personal">
        {personals.map(a => (
          <AccountRow
            key={a.id}
            account={a}
            active={a.id === currentId}
            onClick={() => setCurrentId(a.id)}
          />
        ))}
      </MenuSection>

      <MenuSection label="organizations">
        {orgs.map(a => (
          <AccountRow
            key={a.id}
            account={a}
            active={a.id === currentId}
            onClick={() => setCurrentId(a.id)}
          />
        ))}
      </MenuSection>

      <MenuDivider />

      <MenuItem icon={<User size={14} />}  label="Account settings" onClick={() => {}} />
      <MenuItem icon={<Users size={14} />} label="Manage members"   disabled={!isOrg} onClick={() => {}} />
      <MenuItem icon={<Plus size={14} />}  label="New organization" onClick={() => {}} />

      <MenuDivider />

      <MenuItem icon={<LogOut size={14} />} label="Sign out" danger onClick={() => {}} />
    </Menu>
  )
}
