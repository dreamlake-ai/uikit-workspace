import { ProfileCard } from '@dreamlake/uikit'
import { Pencil, Trash2 } from 'lucide-react'

// Small square icon button mirroring the dreamlake-ai `ProfIconBtn` shape —
// scoped here so the spec is self-contained and doesn't depend on app-side
// atoms. Real callers will plug in their own action button.
function IconBtn({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className={
        'appearance-none border-0 p-0 m-0 w-6 h-6 rounded-md ' +
        'inline-flex items-center justify-center cursor-pointer ' +
        'opacity-65 hover:opacity-100 bg-transparent ' +
        'hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)] ' +
        'transition-[background-color,opacity,color] duration-[120ms] ' +
        (danger ? 'hover:text-[oklch(58%_0.14_27)]' : '')
      }
    >
      {icon}
    </button>
  )
}

// Small ACL-style chip for the `footerRight` slot (member handle / team).
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 font-uikit-mono text-uikit-11 text-uikit-ink opacity-75">
      <span className="opacity-55">@</span>
      <span>{children}</span>
    </span>
  )
}

export const TopRightActionsSpec = () => (
  <div className="w-full max-w-xl">
    <ProfileCard
      title={
        <span>
          <span className="opacity-55 font-medium">acme</span>
          <span className="opacity-40 font-medium px-0.5">/</span>
          arm-bc-v2
        </span>
      }
      tag="private"
      titleRight="2h ago"
      description="Behavioral cloning v2 — ResNet encoder, ego-teleop dataset."
      footer="3b · 1ds · 2pl · 1 active"
      footerRight={
        <>
          <Chip>geyang</Chip>
          <Chip>ada</Chip>
          <span className="font-uikit-mono text-uikit-11 text-uikit-muted opacity-55">+3</span>
        </>
      }
      topRightActions={
        <>
          <IconBtn icon={<Pencil size={14} />} label="Edit project" />
          <IconBtn icon={<Trash2 size={14} />} label="Delete project" danger />
        </>
      }
      onClick={() => {}}
    />
  </div>
)
