'use client'

import * as React from 'react'

import { cn } from '../../lib/utils/cn'

export type SwitchProps = {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  'aria-labelledby'?: string
  className?: string
}

/** Track 52×28px, 3px inset, 22px thumb → 24px slide. Keeps thumb inside rounded track without clipping. */
const THUMB_PX = 22
const TRACK_W = 52
const TRACK_H = 28
const INSET = 3
const SLIDE_PX = TRACK_W - INSET * 2 - THUMB_PX

const thumbEase = 'cubic-bezier(0.34, 1.2, 0.64, 1)'

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ id, checked, onCheckedChange, disabled, 'aria-labelledby': ariaLabelledBy, className }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        style={{ width: TRACK_W, height: TRACK_H }}
        className={cn(
          'relative shrink-0 cursor-pointer rounded-full p-[3px] antialiased outline-none',
          'transition-[box-shadow,background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/80 focus-visible:ring-offset-2',
          'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
          'border border-slate-400/50 bg-gradient-to-b from-slate-50 to-slate-200 shadow-[inset_0_1px_3px_rgba(15,23,42,0.12)]',
          checked &&
            'border-emerald-600/50 bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[inset_0_1px_2px_rgba(6,78,59,0.25),0_0_0_1px_rgba(16,185,129,0.2),0_2px_8px_rgba(5,150,105,0.35)]',
          className,
        )}
      >
        <span
          aria-hidden
          style={{
            width: THUMB_PX,
            height: THUMB_PX,
            transform: checked ? `translateX(${SLIDE_PX}px)` : 'translateX(0)',
            transition: `transform 320ms ${thumbEase}, box-shadow 320ms ${thumbEase}`,
          }}
          className={cn(
            'pointer-events-none block rounded-full bg-white',
            'ring-1 ring-slate-900/[0.08]',
            checked
              ? 'shadow-[0_1px_2px_rgba(6,78,59,0.15),0_3px_10px_rgba(5,150,105,0.25)]'
              : 'shadow-[0_2px_4px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)]',
          )}
        />
      </button>
    )
  },
)

Switch.displayName = 'Switch'
