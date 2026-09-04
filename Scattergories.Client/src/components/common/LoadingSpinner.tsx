import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'size-5 border-2',
  md: 'size-8 border-3',
  lg: 'size-12 border-4',
};

export function LoadingSpinner({ size = 'md', label, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn(
        'rounded-full border-amber-400/30 border-amber-400 animate-spin',
        sizeClasses[size]
      )} />
      {label && (
        <p className="text-white/70 text-sm">{label}</p>
      )}
    </div>
  );
}
