import { useState } from 'react';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassBadge } from '../common/GlassBadge';

interface GameCodeBannerProps {
  code: string;
  onCopy?: () => void;
}

export function GameCodeBanner({ code, onCopy }: GameCodeBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <GlassCard variant="elevated" className="text-center">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-white/80 text-sm font-medium">Game Code</h1>
        <GlassBadge variant="violet" size="sm">Lobby</GlassBadge>
      </div>
      <button
        onClick={handleCopy}
        className="text-4xl font-bold text-white font-mono tracking-[0.3em] hover:text-amber-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 rounded-lg px-2 -mx-2"
        aria-label={`Game code: ${code}. Click to copy.`}
      >
        {code}
      </button>
      <div className="flex items-center justify-center gap-2 mt-2">
        <p className="text-white/40 text-xs">
          {copied ? 'Copied!' : 'Click to copy'}
        </p>
        {copied ? (
          <CheckIcon className="size-3 text-emerald-400" />
        ) : (
          <CopyIcon className="size-3 text-white/30" />
        )}
      </div>
    </GlassCard>
  );
}
