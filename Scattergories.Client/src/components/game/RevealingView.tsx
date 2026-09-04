import { cn } from '@/lib/utils';
import { GlassCard, GlassCardHeader } from '../common/GlassCard';
import { GlassBadge } from '../common/GlassBadge';
import type { CategoryDto, ScoredAnswerDto } from '@/api/types';

interface RevealingViewProps {
  roundCategories: CategoryDto[];
  scoredAnswers: ScoredAnswerDto[];
  showScoreboard: boolean;
}

interface AnswerRowProps {
  answer: ScoredAnswerDto;
  playerName: string;
}

function AnswerRow({ answer, playerName }: AnswerRowProps) {
  const isMyAnswer = answer.playerName === playerName;

  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200',
      isMyAnswer ? 'bg-amber-500/10 ring-1 ring-amber-400/20' : 'bg-white/5'
    )}>
      <div className="flex items-center gap-2.5">
        <span className={cn(
          'text-xs font-medium px-1.5 py-0.5 rounded',
          answer.isUnique
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-red-500/20 text-red-300'
        )}>
          {answer.isUnique ? '✓' : '✗'}
        </span>
        <div>
          <span className={cn(
            'text-sm font-medium',
            isMyAnswer ? 'text-amber-300' : 'text-white'
          )}>
            {answer.playerName}
          </span>
          <span className="text-white/40 text-xs ml-2">"{answer.text}"</span>
        </div>
      </div>
      <span className={cn(
        'text-sm font-bold',
        (answer.points ?? 0) > 0 ? 'text-amber-400' : 'text-white/30'
      )}>
        {(answer.points ?? 0) > 0 ? `+${answer.points}` : '0'}
      </span>
    </div>
  );
}

export function RevealingView({
  roundCategories,
  scoredAnswers,
}: RevealingViewProps) {
  // Group answers by category
  const answersByCategory = roundCategories.map(cat => ({
    category: cat,
    answers: scoredAnswers.filter(a => a.categoryId === cat.id),
  }));

  // Calculate team scores
  const teamScores = new Map<string, number>();
  scoredAnswers.forEach(a => {
    const teamName = a.teamName || 'Unknown';
    const current = teamScores.get(teamName) || 0;
    teamScores.set(teamName, current + (a.points ?? 0));
  });

  const sortedTeams = Array.from(teamScores.entries())
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="text-center">
        <h2 className="text-white font-semibold text-lg">Answers Revealed</h2>
        <p className="text-white/40 text-sm mt-1">See how everyone did this round</p>
      </div>

      {/* Category Answers */}
      <div className="space-y-4">
        {answersByCategory.map(({ category, answers }) => (
          <GlassCard key={category.id} variant="glass" padding="md">
            <GlassCardHeader
              title={category.name}
              action={
                <GlassBadge variant="violet" size="sm">
                  {answers.length} answer{answers.length !== 1 ? 's' : ''}
                </GlassBadge>
              }
            />
            <div className="space-y-1.5">
              {answers.length > 0 ? (
                answers.map((answer, i) => (
                  <AnswerRow key={i} answer={answer} playerName="" />
                ))
              ) : (
                <p className="text-white/30 text-sm text-center py-2">No answers for this category</p>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Team Scores */}
      {sortedTeams.length > 0 && (
        <GlassCard variant="glass" padding="md">
          <GlassCardHeader title="Team Scores" />
          <div className="space-y-2">
            {sortedTeams.map(([name, score], index) => (
              <div key={name} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white',
                    index === 0 ? 'bg-amber-500' : 'bg-white/10 text-white/50'
                  )}>
                    {index + 1}
                  </span>
                  <span className="text-white text-sm font-medium">{name}</span>
                </div>
                <span className="text-amber-400 font-bold text-sm">{score} pts</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
