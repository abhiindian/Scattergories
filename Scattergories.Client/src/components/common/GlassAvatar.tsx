import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: string;
  badge?: React.ReactNode;
  badgePosition?: 'bottom-right';
}

const sizeClasses = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-10 text-base',
  xl: 'size-14 text-xl',
};

const GlassAvatar = React.forwardRef<HTMLDivElement, GlassAvatarProps>(
  ({ className, src, name, size = 'md', gradient, badge, badgePosition, ...props }, ref) => {
    const gradients = [
      'from-violet-400 to-indigo-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-pink-400 to-rose-500',
      'from-cyan-400 to-blue-500',
      'from-purple-400 to-fuchsia-500',
    ];

    // Generate consistent gradient based on name
    const gradientIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    const defaultGradient = gradient || gradients[gradientIndex];

    const initial = name?.[0]?.toUpperCase() || '?';

    return (
      <div className={cn('relative inline-flex shrink-0', className)} ref={ref} {...props}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center text-white font-bold',
            'bg-gradient-to-br',
            sizeClasses[size],
            src ? '' : defaultGradient,
            !src && 'shadow-lg shadow-black/20'
          )}
        >
          {src ? (
            <img src={src} alt={name} className="size-full rounded-full object-cover" />
          ) : (
            <span className={cn('transition-transform duration-200', size === 'xl' && 'scale-110')}>
              {initial}
            </span>
          )}
        </div>
        {badge && badgePosition === 'bottom-right' && (
          <div className="absolute -bottom-0.5 -right-0.5">
            {badge}
          </div>
        )}
      </div>
    );
  }
);
GlassAvatar.displayName = 'GlassAvatar';

export { GlassAvatar };
