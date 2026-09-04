import { useState } from 'react';
import { SendIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import type { CategoryDto } from '@/api/types';

interface AnsweringViewProps {
  categories: CategoryDto[];
  letter: string;
  currentCategory: string;
  answers: Record<string, string>;
  totalRounds: number;
  currentRound: number;
  onSubmit: (answers: Record<string, string>) => void;
  isSubmitting: boolean;
  onCategoryChange: (categoryId: string) => void;
  onAnswerChange: (categoryId: string, value: string) => void;
}

export function AnsweringView({
  categories,
  letter,
  currentCategory,
  answers,
  totalRounds,
  currentRound,
  onSubmit,
  isSubmitting,
  onAnswerChange,
}: AnsweringViewProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>(answers);

  const answeredCount = Object.values(localAnswers).filter(v => v.trim()).length;
  const progress = categories.length > 0 ? (answeredCount / categories.length) * 100 : 0;

  const handleSubmit = () => {
    onSubmit(localAnswers);
  };

  const handleAnswerChange = (categoryId: string, value: string) => {
    setLocalAnswers(prev => ({ ...prev, [categoryId]: value }));
    onAnswerChange(categoryId, value);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">
            Round {currentRound}/{totalRounds}
          </span>
          <span className="text-white/40">
            {answeredCount}/{categories.length} answered
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Letter Badge */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5">
          <span className="text-amber-400 text-lg font-bold">{letter}</span>
          <span className="text-amber-300/80 text-xs">Start words with this letter</span>
        </div>
      </div>

      {/* Category Inputs */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const isActive = cat.id === currentCategory;
          const hasAnswer = localAnswers[cat.id]?.trim();

          return (
            <div
              key={cat.id}
              className={cn(
                'rounded-xl border transition-all duration-200',
                isActive
                  ? 'bg-white/15 border-amber-400/30 ring-1 ring-amber-400/20'
                  : 'bg-white/10 border-white/10 hover:bg-white/12'
              )}
            >
              <div className="p-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {cat.name}
                </label>
                <GlassInput
                  value={localAnswers[cat.id] || ''}
                  onChange={(e) => handleAnswerChange(cat.id, e.target.value)}
                  placeholder={`Enter a ${cat.name.toLowerCase()}...`}
                  maxLength={30}
                  className="bg-transparent border-white/20"
                />
                {hasAnswer && (
                  <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                    <span className="size-3 rounded-full bg-emerald-400/20 flex items-center justify-center">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Answer provided
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <GlassButton
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={answeredCount === 0}
        className="w-full"
        icon={<SendIcon className="size-4" />}
        iconPosition="right"
      >
        Submit {answeredCount > 0 && `(${answeredCount}/${categories.length})`}
      </GlassButton>
    </div>
  );
}
