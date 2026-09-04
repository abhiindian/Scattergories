import { TriangleAlertIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GlassButton } from './GlassButton';

interface ErrorStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function ErrorState({ message, actionLabel, onAction, icon, className }: ErrorStateProps) {
  return (
    <div className={cn('flex items-center justify-center py-20', className)}>
      <div className="text-center max-w-sm">
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl',
          'bg-red-500/20'
        )}>
          {icon || <TriangleAlertIcon className="size-7 text-red-400" />}
        </div>
        <p className="text-white mb-2 font-medium">{message}</p>
        {actionLabel && onAction && (
          <GlassButton
            variant="default"
            size="sm"
            onClick={onAction}
            className="mt-2"
          >
            {actionLabel}
          </GlassButton>
        )}
      </div>
    </div>
  );
}
