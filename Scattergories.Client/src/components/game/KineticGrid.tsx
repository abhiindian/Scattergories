import { useState } from 'react';

/**
 * KineticGrid — Dynamic category input grid for active gameplay.
 * Features: Circular timer, letter spotlight, category input fields,
 * progress urgency bar, and submission handling.
 */

interface Category {
  id: number;
  text: string;
  userAnswer: string;
  score?: number;
  status?: 'valid' | 'duplicate' | 'invalid' | null;
}

interface KineticGridProps {
  letter: string;
  timerSeconds: number;
  timerTotal: number;
  categories: Category[];
  gameState: 'roundRunning' | 'answering' | 'revealing' | 'scoringDone';
  onSubmit: () => void;
  onAnswerChange: (categoryId: number, answer: string) => void;
}

export function KineticGrid({
  letter,
  timerSeconds,
  timerTotal,
  categories,
  gameState,
  onSubmit,
  onAnswerChange,
}: KineticGridProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const percentage = (timerSeconds / timerTotal) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Timer color urgency
  const timerColor =
    timerSeconds <= 10 ? 'text-carbon-red' :
    timerSeconds <= 30 ? 'text-carbon-amber' :
    'text-carbon-cyan';

  // Progress bar color
  const progressColor =
    timerSeconds <= 10 ? 'bg-carbon-red' :
    timerSeconds <= 30 ? 'bg-carbon-amber' :
    'bg-carbon-cyan';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Sticky HUD — Circular Timer + Letter Spotlight */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl rounded-xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-border-subtle">
        <div className="flex items-center justify-between">
          {/* Circular Timer SVG */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e4e2e2"
                strokeWidth="6"
              />
              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={timerSeconds <= 10 ? '#da1e28' : timerSeconds <= 30 ? '#f1c21b' : '#1192e8'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            {/* Timer text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-bold ${timerColor} leading-none`} style={{ fontSize: '20px' }}>
                {formatTime(timerSeconds)}
              </span>
            </div>
          </div>

          {/* Letter Spotlight */}
          <div className="flex-1 flex items-center justify-center mx-3">
            <div className="relative">
              <span
                className="font-bold text-primary leading-none"
                style={{ fontSize: '56px', letterSpacing: '-0.02em' }}
              >
                {letter}
              </span>
              {/* Glow effect */}
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
            </div>
          </div>

          {/* Round Progress */}
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Round 1 of 9</span>
            <div className="w-16 h-1.5 rounded-full bg-surface-container mt-1">
              <div className="h-full rounded-full bg-primary" style={{ width: '11%' }} />
            </div>
          </div>
        </div>

        {/* Progress Urgency Bar */}
        <div className="mt-3 w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Categories Input Stream */}
      <div className="flex flex-col gap-2">
        {categories.map((category) => (
          <CategoryInputCard
            key={category.id}
            index={category.id}
            text={category.text}
            letter={letter}
            value={category.userAnswer}
            status={category.status}
            isActive={activeCategory === category.id}
            isRevealing={gameState === 'revealing'}
            onFocus={() => setActiveCategory(category.id)}
            onBlur={() => setActiveCategory(null)}
            onChange={(answer) => onAnswerChange(category.id, answer)}
          />
        ))}
      </div>

      {/* Submit Button — Sticky Bottom */}
      {gameState === 'roundRunning' && (
        <div className="sticky bottom-0 z-30 bg-surface/90 backdrop-blur-xl pt-3 pb-3 border-t border-border-subtle">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-[14px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
            type="button"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Answers</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/** Individual category input card */
function CategoryInputCard({
  index,
  text,
  letter,
  value,
  status,
  isActive,
  isRevealing,
  onFocus,
  onBlur,
  onChange,
}: {
  index: number;
  text: string;
  letter: string;
  value: string;
  status?: 'valid' | 'duplicate' | 'invalid' | null;
  isActive: boolean;
  isRevealing: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`p-3 rounded-xl transition-all ${
        isActive
          ? 'bg-surface-container-lowest shadow-[0_4px_16px_rgba(15,98,254,0.12)] ring-2 ring-primary'
          : 'bg-surface-container-lowest shadow-sm'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Category Number */}
        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-caps text-[10px] font-bold flex-shrink-0">
          #{index}
        </span>

        {/* Letter Prefix */}
        <span className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold flex-shrink-0" style={{ fontSize: '18px' }}>
          {letter}
        </span>

        {/* Input Field */}
        <div className="flex-1 min-w-0">
          <label className="font-body-md text-[14px] text-on-surface-variant block mb-1 truncate">
            {text}
          </label>
          {isRevealing && status ? (
            /* Revealing State — Show Answer with Status Badge */
            <div className="flex items-center gap-2">
              <span className="font-body-md text-[14px] font-medium text-on-surface">{value || '—'}</span>
              <StatusBadge status={status} />
            </div>
          ) : (
            /* Input State */
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="Type your answer..."
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-all"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Status badge for revealing/scoring phase */
function StatusBadge({ status }: { status: 'valid' | 'duplicate' | 'invalid' }) {
  const config = {
    valid: {
      bg: 'bg-carbon-green/10',
      text: 'text-carbon-green',
      icon: 'check_circle',
      label: 'VALID',
    },
    duplicate: {
      bg: 'bg-carbon-amber/10',
      text: 'text-carbon-amber',
      icon: 'warning',
      label: 'DUPLICATE',
    },
    invalid: {
      bg: 'bg-carbon-red/10',
      text: 'text-carbon-red',
      icon: 'cancel',
      label: 'INVALID',
    },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} ${c.text} font-label-caps text-[10px] font-bold flex-shrink-0`}>
      <span className="material-symbols-outlined text-[14px]">{c.icon}</span>
      {c.label}
    </span>
  );
}
