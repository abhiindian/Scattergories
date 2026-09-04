import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glassBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all',
  {
    variants: {
      variant: {
        default: 'bg-amber-500 text-white',
        host: 'bg-amber-500 text-white',
        secondary: 'bg-white/10 text-white/80 border border-white/10',
        success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
        destructive: 'bg-red-500/20 text-red-300 border border-red-500/20',
        outline: 'bg-transparent text-white/60 border border-white/20',
        violet: 'bg-violet-500/20 text-violet-300 border border-violet-500/20',
        gold: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm',
        silver: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 shadow-sm',
        bronze: 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-sm',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        default: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface GlassBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof glassBadgeVariants> {}

const GlassBadge = React.forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(glassBadgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
GlassBadge.displayName = 'GlassBadge';

export { GlassBadge, glassBadgeVariants };
