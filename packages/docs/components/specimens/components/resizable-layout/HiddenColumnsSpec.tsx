import { useState } from 'react'
import { ResizableLayout } from '@dreamlake/uikit'

function Panel({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div
      data-accent={accent || undefined}
      className="h-full bg-uikit-panel data-[accent]:bg-uikit-rail rounded-[var(--radius)] border border-uikit-faint flex items-center justify-center font-uikit-mono text-uikit-11 text-uikit-muted tracking-uikit-snug select-none"
    >
      {label}
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active || undefined}
      className="font-uikit-mono text-uikit-11 tracking-uikit-snug px-2.5 py-1 rounded-md border border-uikit-faint bg-uikit-panel text-uikit-muted hover:text-uikit-ink data-[active]:bg-uikit-ink data-[active]:text-uikit-bg data-[active]:border-uikit-ink cursor-pointer transition-colors"
    >
      {children}
    </button>
  )
}

export const HiddenColumnsSpec = () => {
  const [leftHidden, setLeftHidden] = useState(false)
  const [middleHidden, setMiddleHidden] = useState(false)
  const [rightHidden, setRightHidden] = useState(false)

  const fullscreenRight = leftHidden && middleHidden && !rightHidden
  const toggleFullscreenRight = () => {
    if (fullscreenRight) {
      setLeftHidden(false)
      setMiddleHidden(false)
    } else {
      setLeftHidden(true)
      setMiddleHidden(true)
      setRightHidden(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton active={leftHidden} onClick={() => setLeftHidden((v) => !v)}>
          leftHidden
        </ToolbarButton>
        <ToolbarButton active={middleHidden} onClick={() => setMiddleHidden((v) => !v)}>
          middleHidden
        </ToolbarButton>
        <ToolbarButton active={rightHidden} onClick={() => setRightHidden((v) => !v)}>
          rightHidden
        </ToolbarButton>
        <span className="font-uikit-mono text-uikit-11 text-uikit-muted opacity-55 px-1">·</span>
        <ToolbarButton active={fullscreenRight} onClick={toggleFullscreenRight}>
          fullscreen right
        </ToolbarButton>
      </div>
      <div className="relative h-[280px]">
        <ResizableLayout
          leftHidden={leftHidden}
          middleHidden={middleHidden}
          rightHidden={rightHidden}
          left={<Panel label="left" accent />}
          middle={<Panel label="middle" />}
          right={<Panel label="right" accent />}
        />
      </div>
    </div>
  )
}
