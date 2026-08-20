import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.96]'
  
  const sizeStyles = {
    xs: 'h-7 px-2.5 text-[11px] rounded-[var(--md-sys-shape-corner-small)] gap-1',
    sm: 'h-8 px-3.5 text-xs rounded-[var(--md-sys-shape-corner-full)] gap-1.5',
    md: 'h-10 px-5 text-xs sm:text-sm rounded-[var(--md-sys-shape-corner-full)] gap-2',
    lg: 'h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base rounded-[var(--md-sys-shape-corner-full)] gap-2.5',
  }

  const variantStyles = {
    filled: 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 shadow-2xs',
    outlined: 'border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10',
    text: 'text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10',
    elevated: 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] shadow-xs',
    tonal: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] hover:opacity-90',
  }

  return (
    <button
      type={props.type || 'button'}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      {children && <span className="truncate">{children}</span>}
    </button>
  )
}

