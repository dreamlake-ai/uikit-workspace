import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { documentTabStyles } from './documentTabStyles'

/** A single panel heading with document-tab chrome. Its contents retain their
 * native link/control semantics; there is no selectable tab for a lone view. */
export function DocumentTabHeading({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <style>{documentTabStyles}</style>
      <div
        {...props}
        data-active=""
        className={cn('uikit-document-tab flex min-w-0 items-center', className)}
      >
        <div className="uikit-document-tab-label flex min-w-0 items-center overflow-hidden">
          {children}
        </div>
      </div>
    </>
  )
}
