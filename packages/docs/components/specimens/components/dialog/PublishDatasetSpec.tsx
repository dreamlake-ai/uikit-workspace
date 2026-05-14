import { useState } from 'react'
import { Dialog } from '@dreamlake/uikit'

const BINDRS = [
  { id: 'b-droid',   name: 'droid-2024' },
  { id: 'b-ego4d',   name: 'ego4d' },
  { id: 'b-mujoco',  name: 'mujoco-unrolls' },
  { id: 'b-q2',      name: 'q2-curated' },
  { id: 'b-success', name: 'success' },
  { id: 'b-failure', name: 'failure' },
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-uikit-mono text-[9px] leading-uikit-snug tracking-uikit-widest uppercase text-uikit-muted opacity-60">
      {children}
    </span>
  )
}

export const PublishDatasetSpec = () => {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(BINDRS[0].id)
  const [name, setName] = useState('')
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="font-uikit-mono text-uikit-12 font-medium text-uikit-ink bg-transparent border border-uikit-faint px-3 py-1.5 rounded-md cursor-pointer"
      >
        + publish dataset
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="publish dataset"
        eyebrow="freeze a bindr → vN"
        footer={
          <>
            <span
              onClick={() => setOpen(false)}
              className="font-uikit-mono text-[11.5px] leading-uikit-snug text-uikit-muted cursor-pointer"
            >
              cancel
            </span>
            <span
              onClick={() => setOpen(false)}
              className="font-uikit-mono text-uikit-11 font-medium text-uikit-bg bg-uikit-ink px-2.5 py-[5px] rounded-md cursor-pointer"
            >
              publish v1
            </span>
          </>
        }
      >
        <label className="flex flex-col gap-1.5">
          <FieldLabel>family name</FieldLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. droid-q3-curated"
            className="font-uikit-mono text-uikit-13 leading-uikit-snug tracking-uikit-snug text-uikit-ink bg-transparent border-0 border-b border-uikit-faint outline-none appearance-none py-1.5 px-0"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>source bindr</FieldLabel>
          <div className="flex flex-col gap-0.5">
            {BINDRS.map((b) => {
              const active = picked === b.id
              return (
                <label
                  key={b.id}
                  onClick={() => setPicked(b.id)}
                  data-active={active || undefined}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer font-uikit-mono text-uikit-12 leading-[15.5px] tracking-uikit-snug text-uikit-ink opacity-75 data-[active]:opacity-100"
                >
                  <span
                    className="size-2.5 rounded-full shrink-0 data-[active]:bg-uikit-accent bg-uikit-bg shadow-[inset_0_0_0_1px_color-mix(in_oklab,_var(--ink)_35%,_transparent)] data-[active]:shadow-none"
                    data-active={active || undefined}
                  />
                  <span>{b.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      </Dialog>
    </>
  )
}
