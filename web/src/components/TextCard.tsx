/**
 * TextCard Component - RE-EXPORT
 * This file is kept for backwards compatibility
 * All functionality has been consolidated into Card.tsx
 * 
 * Use: import { Card as TextCard } from '@/components/ui/Card'
 */

'use client';

// Re-export everything from the unified Card component
export {
  Card as TextCard,
  CardHeader as TextCardHeader,
  CardContent as TextCardContent,
  CardFooter as TextCardFooter,
  cardVariants as textCardVariants,
} from '@/components/ui/Card';

export type { CardProps as TextCardProps } from '@/components/ui/Card';
