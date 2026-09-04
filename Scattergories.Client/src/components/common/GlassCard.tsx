import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'glass', padding = 'md', children, ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    const variantClasses = {
      glass: 'bg-white/10 backdrop-blur-sm border border-white/10',
      solid: 'bg-white/15 backdrop-blur-md border border-white/15',
      elevated: 'bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl shadow-black/10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          'hover:bg-white/15',
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const GlassCardHeader = React.forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between mb-4',
          className
        )}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-white font-semibold text-base">{title}</h3>
          )}
          {description && (
            <p className="text-white/50 text-sm mt-0.5">{description}</p>
          )}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    );
  }
);
GlassCardHeader.displayName = 'GlassCardHeader';

interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassCardContent = React.forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mt-2', className)} {...props} />
    );
  }
);
GlassCardContent.displayName = 'GlassCardContent';

interface GlassCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassCardFooter = React.forwardRef<HTMLDivElement, GlassCardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between mt-4 pt-4 border-t border-white/10',
          className
        )}
        {...props}
      />
    );
  }
);
GlassCardFooter.displayName = 'GlassCardFooter';

export { GlassCard, GlassCardHeader, GlassCardContent, GlassCardFooter };
