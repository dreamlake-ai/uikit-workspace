import { Globe, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@dreamlake/uikit'

/**
 * A card title led by its visibility, the way dreamlake-ai draws it.
 *
 * Visibility is an icon, never the word: a lock for private, a globe for
 * public, with what it means in the kit tooltip. Like the app, the mark is
 * kept out of the link's name — it read "private acme / arm-bc-v2". A
 * mono "private" beside the name read as a second name — and it is not a kind,
 * so it does not belong in `tag` either. Same glyphs, size and colour as the
 * app's shared mark: 13px, stroke 2; private muted (the common case), public
 * accent (something left open is worth a second look).
 */
export function VisibilityTitle({
  visibility,
  children,
}: {
  /** 'public' or 'private'; the specimens' data carries it as a string. */
  visibility: string
  children: ReactNode
}) {
  const pub = visibility === 'public'
  const Icon = pub ? Globe : Lock
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <Tooltip side="top">
        <TooltipTrigger asChild>
          <span
            aria-hidden="true"
            className={
              'inline-flex shrink-0 relative z-10 ' +
              (pub ? 'text-uikit-accent opacity-90' : 'text-uikit-muted opacity-65')
            }
          >
            <Icon size={13} strokeWidth={2} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {pub
            ? 'Public — anyone with the link can view'
            : 'Private — only members of this namespace can view'}
        </TooltipContent>
      </Tooltip>
      <span className="min-w-0 truncate">{children}</span>
    </span>
  )
}
