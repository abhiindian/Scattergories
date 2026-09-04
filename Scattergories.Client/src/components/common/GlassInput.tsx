import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, error, helperText, label, icon, iconPosition = 'left', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20',
              'focus:ring-2 focus:ring-amber-400/50 focus:border-transparent outline-none',
              'placeholder-white/30 transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/50 focus:ring-red-400/50',
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              {icon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-300">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-white/40">{helperText}</p>
        )}
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';

export { GlassInput };
