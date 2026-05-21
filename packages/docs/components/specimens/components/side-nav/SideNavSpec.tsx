import { useState } from 'react'
import { Database, Hash, Check, Loader, Plus } from 'lucide-react'
import { SideNav, SideNavGroup } from '@dreamlake/uikit'

const DATASETS = [
  { id: 'd-incoming',     name: 'incoming',              meta: '312f' },
  { id: 'd-droid',        name: 'droid-2024',            meta: '76.2k ep' },
  { id: 'd-ego4d',        name: 'ego4d-kitchen-subset',  meta: '9.6k ep' },
  { id: 'd-mujoco',       name: 'mujoco-unrolls',        meta: '4.5k ep' },
  { id: 'd-imagenet',     name: 'imagenet-1M',           meta: '1.3M f' },
  { id: 'd-imagenet-14m', name: 'imagenet-14M',          meta: '14.2M f' },
]

const BINDRS = [
  { id: 'b-imagenet', name: 'imagenet' },
  { id: 'b-droid',    name: 'droid-2024' },
  { id: 'b-ego4d',    name: 'ego4d' },
  { id: 'b-mujoco',   name: 'mujoco-unrolls' },
  { id: 'b-q2',       name: 'q2-curated' },
  { id: 'b-success',  name: 'success' },
  { id: 'b-failure',  name: 'failure' },
  { id: 'b-review',   name: 'needs-review' },
]

type Upload = { id: string; name: string; size: string; status: 'uploading' | 'processing' | 'done'; progress: number }
const UPLOADS: Upload[] = [
  { id: 'u1', name: 'ge_coffee_demo_2026-11-20.tar',   size: '64 GB',  status: 'uploading',  progress: 0.34 },
  { id: 'u2', name: 'widowx_pickplace_session_42.zip', size: '62 GB',  status: 'processing', progress: 1.0 },
  { id: 'u3', name: 'droid_session_2026-04-23.tar',    size: '4.2 GB', status: 'done',       progress: 1.0 },
]

function NavRow({
  icon, label, meta, active, accent, onClick,
}: {
  icon?: React.ReactNode; label: string; meta?: string;
  active?: boolean; accent?: boolean; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      data-active={active || undefined}
      data-accent={accent || undefined}
      className="group flex items-center gap-2 px-2 py-[5px] -mx-[3px] font-uikit-ui text-[12.5px] font-medium data-[active]:font-semibold text-uikit-ink leading-uikit-snug tracking-uikit-snug rounded-[var(--radius)] bg-transparent cursor-pointer transition-[background] duration-[120ms] select-none"
    >
      {icon && (
        <span
          data-accent={accent || undefined}
          className="opacity-45 group-data-[active]:opacity-80 shrink-0 flex data-[accent]:text-uikit-accent"
        >
          {icon}
        </span>
      )}
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
      {meta && (
        <span className="font-uikit-mono text-[9px] font-medium opacity-40 tracking-uikit-wide">
          {meta}
        </span>
      )}
    </div>
  )
}

function UploadRow({ name, size, status, progress }: Upload) {
  const statusIcon = status === 'done'
    ? <Check size={10} strokeWidth={2.5} className="text-[#1f8f4a]" />
    : status === 'processing'
    ? <Loader size={10} strokeWidth={2} className="text-[#c0922e]" />
    : null
  return (
    <div
      data-done={status === 'done' || undefined}
      className="px-2 py-1.5 rounded-[var(--radius)] bg-uikit-chip data-[done]:bg-transparent data-[done]:opacity-55 mb-0.5"
    >
      <div className="font-uikit-mono text-uikit-11 font-medium text-uikit-ink leading-uikit-snug whitespace-nowrap overflow-hidden text-ellipsis">
        {name}
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="font-uikit-mono text-[9px] font-medium text-uikit-muted opacity-60 tracking-uikit-wide">
          {size}
        </span>
        <span className="flex-1" />
        {statusIcon}
        <span className="font-uikit-mono text-[9px] font-medium text-uikit-muted opacity-70 tracking-uikit-wide">
          {status === 'uploading' ? `${Math.round(progress * 100)}%` : status}
        </span>
      </div>
      {status === 'uploading' && (
        <div className="mt-1.5 h-0.5 rounded-full bg-uikit-faint">
          <div
            className="h-full rounded-full bg-uikit-accent"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

function PlusBtn() {
  return (
    <span className="flex items-center justify-center size-[18px] rounded-[5px] text-uikit-muted bg-transparent hover:bg-uikit-ink-8 opacity-45 hover:opacity-90 cursor-pointer transition-[background,opacity] duration-[120ms]">
      <Plus size={11} strokeWidth={2} />
    </span>
  )
}

function DLHeader() {
  return (
    <div className="pl-[18px] pr-3.5 pt-[18px]">
      <div className="font-uikit-ui text-uikit-12 font-medium text-uikit-muted opacity-75 leading-[16px] tracking-uikit-snug mb-1.5">
        workspace
      </div>
      <div className="font-uikit-ui text-uikit-22 font-semibold tracking-uikit-tightest text-uikit-ink leading-none">
        dream<span className="text-uikit-accent">.</span>lake
      </div>
      <div className="h-[18px]" />
    </div>
  )
}

function DLFooter() {
  const active = UPLOADS.filter(u => u.status !== 'done').length
  return (
    <div>
      <div className="mb-3.5">
        <div className="flex items-center font-uikit-mono text-[9.5px] font-medium tracking-uikit-widest uppercase text-uikit-muted opacity-55 mb-2 pl-1">
          <span>uploads</span>
          <span className="flex-1" />
          <span className="opacity-80">{active} active</span>
        </div>
        {UPLOADS.map(u => <UploadRow key={u.id} {...u} />)}
      </div>
      <span className="font-uikit-mono text-[9.5px] font-medium text-uikit-muted opacity-45 pl-1 tracking-uikit-wider">
        ⌘K  quick find
      </span>
    </div>
  )
}

export const SideNavSpec = () => {
  const [active, setActive] = useState('d-droid')
  return (
    <div className="relative h-[560px] w-[220px]">
      <SideNav header={<DLHeader />} footer={<DLFooter />}>
        <SideNavGroup title="datasets" action={<PlusBtn />}>
          {DATASETS.map(d => (
            <NavRow
              key={d.id}
              icon={<Database size={12} />}
              label={d.name}
              meta={d.meta}
              active={d.id === active}
              accent
              onClick={() => setActive(d.id)}
            />
          ))}
        </SideNavGroup>

        <SideNavGroup title="bindrs" action={<PlusBtn />}>
          {BINDRS.map(b => (
            <NavRow
              key={b.id}
              icon={<Hash size={12} />}
              label={b.name}
            />
          ))}
        </SideNavGroup>
      </SideNav>
    </div>
  )
}
