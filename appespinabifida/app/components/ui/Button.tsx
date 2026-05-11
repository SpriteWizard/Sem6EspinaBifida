'use client'

import * as React from 'react'

import { cn } from '../../lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-red-800 text-white hover:bg-red-400 active:bg-slate-900 shadow-sm',
  secondary:
    'bg-slate-700 text-white hover:bg-slate-600 active:bg-slate-900 shadow-sm',
  tertiary:
    'bg-slate-700 text-white hover:bg-slate-800 active:bg-slate-900 shadow-sm',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'secondary', size = 'md', leftIcon, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70 disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
