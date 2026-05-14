import { ReactNode } from 'react'

export interface MenuSectionProps {
  /** Uppercase mono label rendered above the section's items. */
  label: string
  children: ReactNode
}

export function MenuSection({ label, children }: MenuSectionProps) {
  return (
    <div className="py-1">
      <div
        className={
          'pt-1.5 pb-1 px-3.5 ' +
          'font-uikit-mono text-uikit-9 font-medium leading-uikit-snug ' +
          'text-uikit-muted opacity-55 tracking-uikit-widest uppercase'
        }
      >
        {label}
      </div>
      {children}
    </div>
  )
}
