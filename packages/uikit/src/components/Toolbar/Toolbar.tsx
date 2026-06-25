import { type ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export type ToolbarVariant = 'default' | 'floating'
export type ToolbarSize = 'sm' | 'md' | 'lg'

export interface ToolbarProps extends ComponentProps<'div'> {
  variant?: ToolbarVariant
  size?: ToolbarSize
}

const PAD: Record<ToolbarSize, string> = { sm: 'p-1.5', md: 'p-1.5', lg: 'p-2' }
const RADIUS: Record<ToolbarSize, string> = {
  sm: 'rounded-[10px]',
  md: 'rounded-[12px]',
  lg: 'rounded-[14px]',
}

/**
 * Horizontal container for grouped actions. Ported from the legacy
 * `@vuer-ai/vuer-uikit` Toolbar; restyled to DreamLake panel tokens. `floating`
 * adds a soft shadow for overlay toolbars.
 */
export function Toolbar({ className, variant = 'default', size = 'md', ...props }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn(
        'flex items-center gap-2 bg-uikit-panel border border-uikit-faint',
        PAD[size],
        RADIUS[size],
        variant === 'floating' && 'shadow-uikit-soft',
        className,
      )}
      {...props}
    />
  )
}

export function ToolbarGroup({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-1', className)} {...props} />
}

export function ToolbarSeparator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn('mx-2 h-3.5 w-px shrink-0 rounded-full bg-uikit-faint', className)}
      {...props}
    />
  )
}
