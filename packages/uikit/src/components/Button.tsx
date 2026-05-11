import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const VARIANT_CLS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-doc-template-accent text-white border-transparent hover:brightness-105',
  secondary:
    'bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700',
  ghost:
    'bg-transparent border-transparent text-inherit hover:bg-zinc-100 dark:hover:bg-zinc-800',
}

const SIZE_CLS: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-[11px] px-2 py-1',
  md: 'text-[13px] px-3 py-1.5',
  lg: 'text-[15px] px-4 py-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    'inline-flex items-center justify-center rounded-md border font-medium cursor-pointer transition-[background,filter,color]',
    VARIANT_CLS[variant],
    SIZE_CLS[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
