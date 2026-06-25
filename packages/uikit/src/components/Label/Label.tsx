import { type ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export type LabelSize = 'xs' | 'sm' | 'lg' | 'hint'

const SIZE: Record<LabelSize, string> = {
  xs: 'text-uikit-10',
  sm: 'text-uikit-12',
  lg: 'text-uikit-14',
  hint: 'text-uikit-11 text-uikit-muted',
}

export interface LabelProps extends ComponentProps<'label'> {
  size?: LabelSize
}

/**
 * Form label. Ported from the legacy `@vuer-ai/vuer-uikit` Label (Radix Label)
 * as a plain `<label>` — native `htmlFor` already does the association. Same
 * `size` API; restyled to DreamLake type tokens.
 */
export function Label({ className, size = 'sm', ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'font-uikit-ui font-normal leading-none whitespace-nowrap overflow-hidden text-ellipsis text-uikit-ink',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        SIZE[size],
        className,
      )}
      {...props}
    />
  )
}
