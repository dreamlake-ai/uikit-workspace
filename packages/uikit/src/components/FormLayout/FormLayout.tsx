import {
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
} from 'react'
import { cn } from '../../lib/utils'

export type LayoutType = 'label-left' | 'label-top'

export interface FormLayoutProps {
  align?: 'start' | 'center' | 'end' | 'baseline'
  asChild?: boolean
  className?: string
  orientation?: LayoutType
  /** A [label, control] pair. */
  children: ReactNode
}

const ALIGN: Record<NonNullable<FormLayoutProps['align']>, string> = {
  baseline: 'items-baseline',
  center: 'items-center',
  start: 'items-start',
  end: 'items-end',
}

/**
 * Pairs a label with a control, stacked (`label-top`) or side-by-side
 * (`label-left`). Ported from the legacy `@vuer-ai/vuer-uikit` FormLayout;
 * `asChild` renders the single child element instead of a wrapper `<div>`.
 */
export function FormLayout({
  asChild,
  className,
  align = 'center',
  orientation = 'label-top',
  children,
}: FormLayoutProps) {
  const classes = cn(
    ALIGN[align],
    orientation === 'label-top' && 'flex flex-col items-stretch gap-1',
    orientation === 'label-left' && 'grid grid-cols-[1fr_2fr] gap-1 text-center',
    className,
  )

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      className: cn(classes, child.props.className),
    })
  }

  return <div className={classes}>{children}</div>
}
