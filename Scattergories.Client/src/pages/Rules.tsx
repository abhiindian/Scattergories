import { Link } from 'react-router-dom';

/**
 * Rules page - How to play Scattergories.
 */
export function Rules() {
  return (
    <div className="mx-auto max-w-md md:max-w-4xl lg:max-w-[1120px] px-4 md:px-8 pt-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.history.back()}
          className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center hover:bg-surface-container-low transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="font-headline-sm text-[24px] md:text-[28px] text-text-primary font-bold">How to Play</h1>
      </div>

      <div className="rounded-xl bg-surface-container-lowest p-4 md:p-6 shadow-sm space-y-6">
        {/* Overview */}
        <div>
          <h2 className="font-headline-sm text-[18px] md:text-[20px] text-text-primary font-bold mb-2">Overview</h2>
          <p className="font-body-md text-[14px] md:text-[16px] text-text-secondary leading-relaxed">
            Scattergories is a quick-thinking multiplayer party game. Players race against the clock to fill in categories that start with a random letter. Unique answers score more points!
          </p>
        </div>

        {/* Setup */}
        <div>
          <h2 className="font-headline-sm text-[18px] md:text-[20px] text-text-primary font-bold mb-2">Setup</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">1</span>
              <span className="font-body-md text-[14px] md:text-[16px] text-text-secondary">A host creates a game room and shares the 5-character code with friends</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">2</span>
              <span className="font-body-md text-[14px] md:text-[16px] text-text-secondary">Players join using the code and their nickname</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">3</span>
              <span className="font-body-md text-[14px] md:text-[16px] text-text-secondary">The host selects game settings: rounds, timer duration, and answer rules</span>
            </li>
          </ul>
        </div>

        {/* Gameplay */}
        <div>
          <h2 className="font-headline-sm text-[18px] md:text-[20px] text-text-primary font-bold mb-2">Gameplay</h2>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-surface-container">
              <h3 className="font-label-caps text-[11px] md:text-[12px] text-primary font-bold mb-1">ROUND START</h3>
              <p className="font-body-md text-[13px] md:text-[14px] text-text-secondary">
                A random letter (A-Z) is selected. Players see 12 categories (Name, Place, Animal, Thing, Food, City, Color, Brand, Occupation, etc.) and must type answers starting with that letter.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container">
              <h3 className="font-label-caps text-[11px] md:text-[12px] text-primary font-bold mb-1">TIMED ANSWERING</h3>
              <p className="font-body-md text-[13px] md:text-[14px] text-text-secondary">
                A countdown timer (default: 120 seconds) ticks down. Type your answers in the input fields. Submit when ready — you can submit multiple times before time runs out.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container">
              <h3 className="font-label-caps text-[11px] md:text-[12px] text-primary font-bold mb-1">REVEAL & SCORE</h3>
              <p className="font-body-md text-[13px] md:text-[14px] text-text-secondary">
                When time is up, all answers are revealed. Scoring:
              </p>
              <ul className="font-body-md text-[13px] md:text-[14px] text-text-secondary mt-2 space-y-1">
                <li>• <strong className="text-carbon-green">Unique answer:</strong> 10 points</li>
                <li>• <strong className="text-text-secondary">Duplicate (another player had it):</strong> 0 points</li>
                <li>• <strong className="text-text-secondary">Invalid answer:</strong> 0 points (doesn't start with letter, empty, etc.)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scoring Rules */}
        <div>
          <h2 className="font-headline-sm text-[18px] md:text-[20px] text-text-primary font-bold mb-2">Scoring Rules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-carbon-green/10 border border-carbon-green/20">
              <span className="font-label-caps text-[10px] text-carbon-green font-bold">+10 POINTS</span>
              <p className="font-body-sm text-[12px] text-text-secondary mt-1">Your answer is unique — no other player submitted it</p>
            </div>
            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
              <span className="font-label-caps text-[10px] text-error font-bold">0 POINTS</span>
              <p className="font-body-sm text-[12px] text-text-secondary mt-1">Someone else also submitted the same answer (duplicate)</p>
            </div>
          </div>
          <p className="font-body-sm text-[12px] md:text-[13px] text-text-secondary mt-3">
            <strong className="text-text-primary">Pro tip:</strong> Unique answers benefit both teams! If you and a teammate both have unique answers, you both score.
          </p>
        </div>

        {/* Game Settings */}
        <div>
          <h2 className="font-headline-sm text-[18px] md:text-[20px] text-text-primary font-bold mb-2">Game Settings</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded bg-surface-container">
              <span className="font-body-md text-[13px] text-text-secondary">Classic Mode</span>
              <span className="font-label-sm text-[12px] text-text-primary font-semibold">6 Rounds • 120s each</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-surface-container">
              <span className="font-body-md text-[13px] text-text-secondary">Speed Mode</span>
              <span className="font-label-sm text-[12px] text-text-primary font-semibold">4 Rounds • 60s each</span>
            </div>
          </div>
        </div>

        {/* Answer Validation */}
        <div>
          <h2 className="font-headline-sm text-[18px] md:text-[20px] text-text-primary font-bold mb-2">Answer Validation</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-carbon-green mt-0.5">✓</span>
              <span className="font-body-md text-[13px] text-text-secondary">Must start with the round letter</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-carbon-green mt-0.5">✓</span>
              <span className="font-body-md text-[13px] text-text-secondary">Cannot be empty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span className="font-body-md text-[13px] text-text-secondary">Plurals (if enabled in settings)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span className="font-body-md text-[13px] text-text-secondary">Proper nouns (if enabled in settings)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-error mt-0.5">✗</span>
              <span className="font-body-md text-[13px] text-text-secondary">Profanity (always filtered)</span>
            </li>
          </ul>
        </div>

        {/* Winning */}
        <div>
          <h2 className="font-headline-sm text-[18px] md:text-[20px] text-text-primary font-bold mb-2">Winning</h2>
          <p className="font-body-md text-[14px] md:text-[16px] text-text-secondary leading-relaxed">
            After all rounds, the player with the highest total score wins! Team games sum all player scores. The final scoreboard shows rankings, best answers, and stats.
          </p>
        </div>
      </div>
    </div>
  );
}
