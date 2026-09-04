import { cn } from '@/lib/utils';
import type { CategoryDto } from '@/api/types';

interface TimerViewProps {
  letter: string;
  timeLeft: number;
  totalTime: number;
  categories: CategoryDto[];
  isLow: boolean;
}

export function TimerView({ letter, timeLeft, totalTime, categories, isLow }: TimerViewProps) {
  const percentage = timeLeft > 0 ? (timeLeft / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - percentage / 100);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="text-center max-w-sm w-full">
        {/* Letter Display */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className={cn(
              'text-9xl font-bold transition-colors duration-300',
              isLow ? 'text-red-400 animate-pulse' : 'text-white'
            )}>
              {letter || '?'}
            </div>
            <div className="absolute -inset-4 bg-white/5 rounded-full blur-2xl -z-10" />
          </div>
          <p className="text-violet-200/70 text-sm mt-2 font-medium uppercase tracking-wider">
            Find words starting with this letter
          </p>
        </div>

        {/* Timer Circle */}
        <div className="mb-8 relative inline-block">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={isLow ? '#f87171' : '#fbbf24'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'text-5xl font-bold font-mono transition-colors duration-300',
              isLow ? 'text-red-400' : 'text-white'
            )}>
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Categories Preview */}
        {categories.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-6">
              {categories.slice(0, 6).map(cat => (
                <div
                  key={cat.id}
                  className="bg-white/8 backdrop-blur-sm rounded-lg px-2 py-2 text-xs text-white/80 text-center border border-white/10"
                >
                  {cat.name}
                </div>
              ))}
              {categories.length > 6 && (
                <div className="bg-white/5 rounded-lg flex items-center justify-center text-white/40 text-xs border border-white/10">
                  +{categories.length - 6}
                </div>
              )}
            </div>
          </>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
          <div className="size-2 rounded-full bg-emerald-400" />
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}
