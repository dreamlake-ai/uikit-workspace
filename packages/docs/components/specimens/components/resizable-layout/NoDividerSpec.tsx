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

export const NoDividerSpec = () => (
  <div className="relative h-[280px]">
    <ResizableLayout
      showDivider={false}
      left={<Panel label="left" accent />}
      middle={<Panel label="middle" />}
      right={<Panel label="right" accent />}
    />
  </div>
)
