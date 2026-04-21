/**
 * Plant Doctor - Unified Card Component
 * Consolidates old Card.tsx and TextCard.tsx into one clean system
 * Features: 11 variants, dark mode, glassmorphism, full accessibility
 */

'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva('relative rounded-xl overflow-hidden transition-all duration-300 ease-out', {
  variants: {
    variant: {
      // Default/Clean - Minimal white card with soft shadow
      default:
        'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-800',

      // Soft - Glassmorphism effect
      soft: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-gray-900 dark:text-gray-50 shadow-lg border border-white/20 dark:border-gray-700/20 hover:bg-white/90 dark:hover:bg-gray-900/90',

      // Gradient - Subtle gradient background
      gradient:
        'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-50 shadow-md border border-gray-100 dark:border-gray-800',

      // Accent - Colored variant (green)
      accent:
        'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 text-emerald-900 dark:text-emerald-50 shadow-md border border-emerald-200 dark:border-emerald-800 hover:shadow-lg',

      // Success - Green variant
      success:
        'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 text-green-900 dark:text-green-50 shadow-md border border-green-200 dark:border-green-800 hover:shadow-lg',

      // Warning - Amber variant
      warning:
        'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 text-amber-900 dark:text-amber-50 shadow-md border border-amber-200 dark:border-amber-800 hover:shadow-lg',

      // Error - Red variant
      error:
        'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 text-red-900 dark:text-red-50 shadow-md border border-red-200 dark:border-red-800 hover:shadow-lg',

      // Info - Blue variant
      info: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 text-blue-900 dark:text-blue-50 shadow-md border border-blue-200 dark:border-blue-800 hover:shadow-lg',

      // Elevated - Deep shadow, premium feel
      elevated:
        'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-xl hover:shadow-2xl border border-gray-100 dark:border-gray-800',

      // Subtle - Minimal styling
      subtle:
        'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-none border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700',

      // Outlined - Border focused
      outlined:
        'bg-transparent text-gray-900 dark:text-gray-50 shadow-none border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',

      // Ghost - Transparent base
      ghost: 'bg-transparent text-gray-900 dark:text-gray-50 shadow-none border border-transparent',
    },

    padding: {
      none: 'p-0',
      xs: 'p-2',
      sm: 'p-3',
      base: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    },

    interactive: {
      true: 'cursor-pointer hover:scale-[1.02] active:scale-[0.99]',
      false: '',
    },

    hoverable: {
      true: 'hover:-translate-y-1',
      false: '',
    },
  },

  defaultVariants: {
    variant: 'default',
    padding: 'md',
    interactive: false,
    hoverable: false,
  },
});

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, hoverable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive, hoverable }), className)}
      {...props}
    />
  )
);

Card.displayName = 'Card';

// Card header
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4 flex items-start justify-between', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// Card title
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-2xl font-bold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// Card description
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props} />
  )
);

CardDescription.displayName = 'CardDescription';

// Card content
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-4', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// Card footer
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center space-x-2 border-t border-gray-200 pt-4 dark:border-gray-700', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
export type { CardProps };
