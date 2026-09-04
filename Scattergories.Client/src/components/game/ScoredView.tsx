import { ArrowRightIcon, TrophyIcon } from 'lucide-react';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';

interface ScoredViewProps {
  showScoreboard: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
  onViewScoreboard: () => void;
}

export function ScoredView({
  isLastRound,
  onNextRound,
  onViewScoreboard,
}: ScoredViewProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <div className="text-center max-w-sm w-full space-y-6">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center ring-4 ring-emerald-500/10">
              <TrophyIcon className="size-10 text-emerald-400" />
            </div>
            <div className="absolute -inset-2 bg-emerald-500/10 rounded-full blur-xl -z-10" />
          </div>
        </div>

        {/* Message */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isLastRound ? 'Game Complete!' : 'Round Complete!'}
          </h2>
          <p className="text-white/50 text-sm">
            {isLastRound
              ? 'Great game! Check the final standings.'
              : 'Get ready for the next round...'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isLastRound ? (
            <GlassButton
              onClick={onViewScoreboard}
              className="w-full"
              icon={<ArrowRightIcon className="size-4" />}
              iconPosition="right"
            >
              View Final Scoreboard
            </GlassButton>
          ) : (
            <>
              <GlassButton
                onClick={onNextRound}
                className="w-full"
                icon={<ArrowRightIcon className="size-4" />}
                iconPosition="right"
              >
                Next Round Starting...
              </GlassButton>
              <GlassButton
                onClick={onViewScoreboard}
                variant="ghost"
                className="w-full"
              >
                View Scoreboard
              </GlassButton>
            </>
          )}
        </div>

        {/* Glass Card Decoration */}
        <GlassCard variant="glass" padding="md" className="mt-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-white/40 text-xs">Rounds</p>
              <p className="text-white font-bold text-lg">{isLastRound ? '9/9' : '8/9'}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-white/40 text-xs">Status</p>
              <p className="text-emerald-400 font-bold text-sm">Complete</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
