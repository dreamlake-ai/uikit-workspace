import { useState } from 'react'
import { ResizableLayout } from '@dreamlake/uikit'

function Panel({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div
      data-accent={accent || undefined}
      className="h-full bg-uikit-panel data-[accent]:bg-uikit-rail rounded-[var(--radius)] border border-uikit-faint flex items-center justify-center font-uikit-mono text-uikit-11 text-uikit-muted"
    >
      {label}
    </div>
  )
}

export const ToggleSpec = () => {
  const [leftHidden, setLeftHidden] = useState(false)
  const [rightHidden, setRightHidden] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {[
          { label: 'left',  hidden: leftHidden,  toggle: () => setLeftHidden(v => !v) },
          { label: 'right', hidden: rightHidden, toggle: () => setRightHidden(v => !v) },
        ].map(({ label, hidden, toggle }) => (
          <button
            key={label}
            onClick={toggle}
            className="font-uikit-mono text-uikit-11 font-medium tracking-uikit-snug px-2.5 py-0.5 rounded-[5px] border border-uikit-faint bg-transparent text-uikit-ink cursor-pointer"
          >
            {hidden ? 'show' : 'hide'} {label}
          </button>
        ))}
      </div>
      <div className="relative h-[280px]">
        <ResizableLayout
          showToggle
          leftHidden={leftHidden}
          rightHidden={rightHidden}
          onToggleLeft={() => setLeftHidden(v => !v)}
          onToggleRight={() => setRightHidden(v => !v)}
          left={<Panel label="left" accent />}
          middle={<Panel label="middle" />}
          right={<Panel label="right" accent />}
        />
      </div>
    </div>
  )
}
