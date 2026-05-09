// Button — the single button atom for @dreamlake/uikit.
//
// Ports `.btn` from staging/dreamlake-design-guide.html (`#lab-button`).
// The design-guide ships exactly two variants:
//
//   ghost    — muted ink + faint hairline border, transparent fill
//   primary  — accent fill (#23aaff = --color-accent) + white ink
//
// Shared chrome, lifted from the source CSS:
//
//   inline-flex · 6px gap · 5px / 10px padding · 6px radius
//   JetBrains Mono · 10.5px · 600 · 0.08em tracking · UPPERCASE
//   1px border · 120ms background ease
//
// `lead` (key combo / glyph rendered before the label) is a sibling
// <span class="lead"> in the source. Here it's the `icon` prop. The
// .65 opacity from the source ports as a 65% alpha utility.
//
// Disabled state collapses to .4 opacity + cursor-not-allowed in the
// source — same here, driven by the native `disabled` attribute via a
// Tailwind variant rather than a marker class.
//
// Intentionally NOT reusing the chrome-button utility from CodeBlock
// (`cbBtnCx` in src/components/prose.tsx) — that styling is for
// hover-revealed code-block chrome with a different size/color
// contract. The Button atom is a structured surface.

import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'ghost' | 'primary'

export type ButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  icon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

// Shared chrome shared by every variant.
const baseCx =
  'inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-md cursor-pointer ' +
  'font-mono text-[10.5px] font-semibold tracking-[0.08em] uppercase ' +
  'border border-transparent bg-transparent ' +
  'transition-[background-color,color,border-color] duration-[120ms] ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed'

// Per-variant paint. Hover rules mirror the source `.btn.<v>.is-hover`.
const variantCx: Record<ButtonVariant, string> = {
  ghost:
    'text-muted border-faint ' +
    'not-disabled:hover:text-ink ' +
    'not-disabled:hover:border-[color-mix(in_oklab,var(--color-ink)_18%,transparent)] ' +
    'not-disabled:hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]',
  primary:
    'text-white bg-accent border-accent ' +
    'not-disabled:hover:bg-[color-mix(in_srgb,var(--color-accent)_88%,var(--color-ink))]',
}

// The leading <span class="lead"> from the source — opacity .65, slightly
// lighter weight. Pure presentation; rendered only when an icon is set.
const iconCx = 'opacity-65 font-medium'

export const Button = ({
  children,
  variant = 'ghost',
  icon,
  className,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const cx = `${baseCx} ${variantCx[variant]}${className ? ` ${className}` : ''}`
  return (
    <button type={type} className={cx} {...rest}>
      {icon != null && <span className={iconCx}>{icon}</span>}
      {children}
    </button>
  )
}
