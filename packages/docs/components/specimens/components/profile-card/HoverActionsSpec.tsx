import { ProfileCard } from '@dreamlake/uikit'

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer opacity-80 hover:opacity-100 bg-transparent hover:bg-[color-mix(in_srgb,_currentColor_5%,_transparent)] transition-[background-color,opacity] duration-[120ms]"
    >
      {children}
    </span>
  )
}

export const HoverActionsSpec = () => (
  <div className="w-full max-w-xl">
    <ProfileCard
      title="vision-model"
      tag="public"
      titleRight="2 days ago"
      description="A deep learning model for real-time object detection using YOLOv8 with custom dataset support."
      footer="24b · 3ds · 2pl · 1 active"
      hoverActions={
        <GhostBtn onClick={() => {}}>fork ▾</GhostBtn>
      }
      onClick={() => {}}
    />
  </div>
)
