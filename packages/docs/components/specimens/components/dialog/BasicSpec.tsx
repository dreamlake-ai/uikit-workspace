import { useState } from 'react'
import { Dialog } from '@dreamlake/uikit'

function CancelLink({ onClick }: { onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      className="font-uikit-mono text-[11.5px] leading-uikit-snug tracking-uikit-snug text-uikit-muted opacity-80 hover:opacity-100 cursor-pointer transition-opacity duration-[120ms]"
    >
      cancel
    </span>
  )
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <span
      onClick={onClick}
      className="font-uikit-mono text-uikit-11 font-medium leading-uikit-snug tracking-uikit-snug text-uikit-bg bg-uikit-ink hover:bg-[color-mix(in_oklab,_var(--ink)_88%,_var(--accent))] px-2.5 py-[5px] rounded-md cursor-pointer transition-[background] duration-[120ms]"
    >
      {children}
    </span>
  )
}

function TriggerButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-uikit-mono text-uikit-12 font-medium leading-uikit-snug tracking-uikit-snug text-uikit-ink bg-transparent hover:bg-uikit-ink-5 border border-uikit-faint px-3 py-1.5 rounded-md cursor-pointer transition-[background] duration-[120ms]"
    >
      {children}
    </button>
  )
}

export const BasicSpec = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)}>Open dialog</TriggerButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Discard changes?"
        eyebrow="unsaved edits"
        footer={
          <>
            <CancelLink onClick={() => setOpen(false)} />
            <PrimaryButton onClick={() => setOpen(false)}>discard</PrimaryButton>
          </>
        }
      >
        <p className="m-0 font-uikit-ui text-[13.5px] leading-uikit-prose tracking-uikit-snug text-uikit-ink opacity-85">
          Your draft has unsaved edits. If you continue, the current contents will
          be lost. This action cannot be undone.
        </p>
      </Dialog>
    </>
  )
}
