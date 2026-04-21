/**
 * Plant Doctor - Button Component
 * Clean, accessible, with multiple variants
 */

'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { transitions } from '@/theme/animations';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
  {
    variants: {
      variant: {
        // Primary - main actions
        primary:
          'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500',

        // Secondary - alternative actions
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',

        // Outline - non-destructive secondary
        outline:
          'border-2 border-gray-300 text-gray-900 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-900',

        // Ghost - minimal, text-like
        ghost:
          'text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',

        // Danger - destructive actions
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',

        // Success - positive actions
        success:
          'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500',

        // Warning - cautionary actions
        warning:
          'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus-visible:ring-amber-500',

        // Link - text button
        link: 'text-green-600 underline hover:text-green-700 dark:text-green-400 dark:hover:text-green-500',
      },

      size: {
        xs: 'px-2.5 py-1.5 text-xs h-7',
        sm: 'px-3 py-2 text-sm h-8',
        base: 'px-4 py-2.5 text-base h-10',
        lg: 'px-6 py-3 text-lg h-12',
        xl: 'px-8 py-3.5 text-lg h-14',
      },

      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },

      loading: {
        true: 'cursor-wait',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'base',
      fullWidth: false,
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      icon,
      iconRight,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        style={{ transitionDuration: '200ms' }}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {loading && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
        {iconRight && <span className="ml-2">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
