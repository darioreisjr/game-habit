import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-quick',
  {
    variants: {
      variant: {
        default: 'bg-text-primary text-white',
        secondary: 'bg-background-light text-text-primary border border-border',
        success: 'bg-mario-green/10 text-mario-green border border-mario-green/20',
        warning: 'bg-mario-yellow/10 text-yellow-700 border border-mario-yellow/20',
        danger: 'bg-mario-red/10 text-mario-red border border-mario-red/20',
        blue: 'bg-mario-blue/10 text-mario-blue border border-mario-blue/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
