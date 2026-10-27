import { useState } from 'react'
import { Dialog } from '@dreamlake/uikit'

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

// The eyebrow names the thing the dialog acts on, which can be any length. It
// takes only the room the title leaves and ellipsizes there; the title keeps
// its words.
export const LongEyebrowSpec = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)}>Move a long-named note</TriggerButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Move Note"
        eyebrow="Pick-and-place teleop session 14 — gripper calibration sweep and failure notes"
        width={520}
      >
        <p className="m-0 font-uikit-ui text-[13.5px] leading-uikit-prose tracking-uikit-snug text-uikit-ink opacity-85">
          Choose a destination workspace for this note.
        </p>
      </Dialog>
    </>
  )
}
