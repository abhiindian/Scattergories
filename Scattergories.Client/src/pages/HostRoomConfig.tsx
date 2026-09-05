import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { toast } from 'sonner';

/**
 * HostRoomConfig page - redesigned with Carbon Design System.
 * Features: Category Deck Selection carousel, Pacing & Duration sliders,
 * Dictionary & Validation Rules toggles, Access & Permissions, Live Summary.
 */
type CategoryDeck = 'Classic Party' | 'Geek & Tech' | 'Pop Culture & 90s' | 'Foodie Table';

interface GameConfig {
  categoryDeck: CategoryDeck;
  totalRounds: number;
  timerPerRound: number;
  pointsPerUnique: number;
  allowPlurals: boolean;
  allowProperNouns: boolean;
  allowProfanity: boolean;
  crossTeamUniqueness: boolean;
  roomVisibility: 'public' | 'private';
}

const defaultConfig: GameConfig = {
  categoryDeck: 'Classic Party',
  totalRounds: 9,
  timerPerRound: 180,
  pointsPerUnique: 10,
  allowPlurals: false,
  allowProperNouns: false,
  allowProfanity: false,
  crossTeamUniqueness: true,
  roomVisibility: 'private',
};

const categoryDecks: { name: CategoryDeck; number: number; description: string; color: string }[] = [
  { name: 'Classic Party', number: 1, description: '12 Categories • Family All-Star', color: 'bg-primary' },
  { name: 'Geek & Tech', number: 2, description: '12 Categories • Sci-Fi & Code', color: 'bg-carbon-teal' },
  { name: 'Pop Culture & 90s', number: 3, description: '12 Categories • Movies & Music', color: 'bg-carbon-magenta' },
  { name: 'Foodie Table', number: 4, description: '12 Categories • Culinary Delights', color: 'bg-carbon-amber' },
];

export function HostRoomConfig() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCode = searchParams.get('edit');
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (editCode) {
      apiClient.getGame(editCode).then(game => {
        setConfig({
          categoryDeck: 'Classic Party',
          totalRounds: game.settings.roundCount,
          timerPerRound: game.settings.timerSeconds,
          pointsPerUnique: game.settings.pointsPerAnswer,
          allowPlurals: game.settings.allowPlurals,
          allowProperNouns: game.settings.allowProperNouns,
          allowProfanity: game.settings.allowOffensiveWords,
          crossTeamUniqueness: true,
          roomVisibility: 'private',
        });
      }).catch(err => {
        console.error('Failed to load game config:', err);
        toast.error('Failed to load game config');
      });
    }
  }, [editCode]);

  // Update summary text
  const summaryText = `${config.totalRounds} Rounds • ${config.timerPerRound}s • ${config.categoryDeck} • Max 8 Players`;
  const estimatedMinutes = Math.round((config.totalRounds * (config.timerPerRound + 20)) / 60);

  const updateConfig = <K extends keyof GameConfig>(key: K, value: GameConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateOrUpdateRoom = async () => {
    setIsCreating(true);
    try {
      const data = {
        roundCount: config.totalRounds,
        timerSeconds: config.timerPerRound,
        pointsPerAnswer: config.pointsPerUnique,
        allowPlurals: config.allowPlurals,
        allowProperNouns: config.allowProperNouns,
        allowOffensiveWords: config.allowProfanity,
      };

      if (editCode) {
        await apiClient.updateGameConfig(editCode, data);
        toast.success('Room updated successfully!');
        navigate(`/lobby/${editCode}`);
      } else {
        const gameCode = await apiClient.createGame(data);
        toast.success('Room created successfully!');
        navigate(`/lobby/${gameCode}`);
      }
    } catch (e) {
      console.error('Failed to create/update room:', e);
      toast.error('Failed to save room config. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(defaultConfig);
  };

  const handleTimerPreset = (seconds: number) => {
    updateConfig('timerPerRound', seconds);
  };

  const formatTimerBadge = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${seconds}s (${m}m ${s < 10 ? '0' : ''}${s}s)`;
  };

  return (
    <div className="max-w-md md:max-w-3xl lg:max-w-[1120px] mx-auto px-4 md:px-8 py-4 md:py-8">
      {/* Top Navigation & Mode Switcher */}
      <div className="flex flex-col gap-3 mb-4 md:mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          {!editCode && (
            <div className="inline-flex p-1 rounded-full bg-surface-container-high shadow-inner hidden md:inline-flex">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 rounded-full font-label-caps text-[12px] text-on-surface-variant hover:text-on-surface transition-all"
                type="button"
              >
                JOIN ROOM
              </button>
              <button
                className="px-6 py-2 rounded-full bg-primary font-label-caps text-[12px] text-on-primary font-semibold shadow-sm transition-all"
                type="button"
              >
                HOST ROOM
              </button>
            </div>
          )}
          <button
            onClick={handleResetDefaults}
            className="px-2 py-1 text-primary font-label-caps text-[10px] md:text-[12px] uppercase tracking-wider hover:opacity-80 transition-opacity"
            type="button"
          >
            RESET
          </button>
        </div>

        {/* Header Banner */}
        <div className="mt-2 flex items-start gap-3 bg-surface-container-low rounded-xl p-4 md:p-6 shadow-sm">
          <div className="w-12 md:w-16 h-12 md:h-16 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[26px] md:text-[32px]">tune</span>
          </div>
          <div className="flex flex-col min-w-0 justify-center h-full">
            <h1 className="font-headline-md text-[16px] md:text-[22px] text-on-surface leading-tight">
              {editCode ? 'Edit Game Rules' : 'Host a New Game'}
            </h1>
            <p className="font-body-md text-[14px] md:text-[16px] text-on-surface-variant mt-0.5 md:mt-1">
              Configure custom rules, list decks, and round timers for your lobby.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-6" onSubmit={(e) => { e.preventDefault(); handleCreateOrUpdateRoom(); }}>
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Category Deck Selection Carousel */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant uppercase">Category Deck Selection</span>
              <span className="font-label-sm text-[12px] md:text-[14px] text-primary font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px] md:text-[18px]">casino</span> 20-Sided Die
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-none">
              {categoryDecks.map(deck => (
                <label
                  key={deck.name}
                  className={`cursor-pointer relative flex-shrink-0 w-44 md:w-48 rounded-xl p-3 md:p-4 flex flex-col justify-between shadow-sm transition-transform active:scale-95 ${
                    config.categoryDeck === deck.name
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <input
                    type="radio"
                    name="categoryDeck"
                    value={deck.name}
                    checked={config.categoryDeck === deck.name}
                    onChange={() => updateConfig('categoryDeck', deck.name)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between mb-2">
                    <span className={`w-7 h-7 rounded-lg ${deck.color} flex items-center justify-center font-label-caps text-[10px] font-bold`}>
                      #{deck.number}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-xs ${
                      config.categoryDeck === deck.name
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-variant text-transparent'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-headline-sm text-[14px] md:text-[15px] font-semibold leading-tight">{deck.name}</div>
                    <div className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant mt-0.5">{deck.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Core Game Settings Card */}
          <div className="bg-surface-container-lowest rounded-xl p-4 md:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-1.5 pb-1">
              <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">speed</span>
              <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-semibold">Pacing & Duration</span>
            </div>

            {/* Round Count Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-body-md text-[14px] md:text-[15px] text-on-surface font-semibold flex items-center gap-1.5" htmlFor="roundRange">
                  Total Rounds
                </label>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-[10px] md:text-[11px] font-bold">
                  {config.totalRounds} Rounds (~{estimatedMinutes}m)
                </span>
              </div>
              <div className="relative flex items-center py-2">
                <input
                  id="roundRange"
                  type="range"
                  min={3}
                  max={12}
                  step={1}
                  value={config.totalRounds}
                  onChange={(e) => updateConfig('totalRounds', parseInt(e.target.value))}
                  className="w-full h-2 md:h-3 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="flex justify-between font-label-sm text-[12px] text-on-surface-variant">
                <span>3 Quick</span>
                <span className="hidden md:inline">6 Standard</span>
                <span className="hidden md:inline">9 Classic</span>
                <span>12 Marathon</span>
              </div>
            </div>

            {/* Timer per Round Slider & Presets */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-body-md text-[14px] md:text-[15px] text-on-surface font-semibold flex items-center gap-1.5" htmlFor="timerRange">
                  Timer per Round
                </label>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-caps text-[10px] md:text-[11px] font-bold">
                  {formatTimerBadge(config.timerPerRound)}
                </span>
              </div>

              {/* Fast Presets Pills */}
              <div className="grid grid-cols-3 gap-2 my-1 md:my-2">
                <button
                  type="button"
                  onClick={() => handleTimerPreset(90)}
                  className={`timer-preset px-2 py-2 md:py-3 rounded-lg font-label-caps text-[10px] md:text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    config.timerPerRound === 90
                      ? 'bg-carbon-red text-white shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">bolt</span> 90s Blitz
                </button>
                <button
                  type="button"
                  onClick={() => handleTimerPreset(180)}
                  className={`timer-preset px-2 py-2 md:py-3 rounded-lg font-label-caps text-[10px] md:text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    config.timerPerRound === 180
                      ? 'bg-secondary text-on-secondary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">timer</span> 180s Classic
                </button>
                <button
                  type="button"
                  onClick={() => handleTimerPreset(240)}
                  className={`timer-preset px-2 py-2 md:py-3 rounded-lg font-label-caps text-[10px] md:text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    config.timerPerRound === 240
                      ? 'bg-carbon-teal text-white shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] md:text-[18px]">coffee</span> 240s Relaxed
                </button>
              </div>

              <div className="relative flex items-center py-2">
                <input
                  id="timerRange"
                  type="range"
                  min={60}
                  max={300}
                  step={15}
                  value={config.timerPerRound}
                  onChange={(e) => updateConfig('timerPerRound', parseInt(e.target.value))}
                  className="w-full h-2 md:h-3 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-secondary"
                />
              </div>
            </div>

            {/* Points per Unique Answer */}
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle mt-2">
              <div>
                <div className="font-body-md text-[14px] md:text-[15px] text-on-surface font-semibold">Points per Unique Answer</div>
                <div className="font-label-sm text-[12px] text-on-surface-variant">Standard tournament points</div>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => updateConfig('pointsPerUnique', Math.max(5, config.pointsPerUnique - 5))}
                  className="w-9 md:w-10 h-9 md:h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">remove</span>
                </button>
                <span className="w-12 text-center font-headline-sm text-[14px] md:text-[16px] font-bold text-primary">{config.pointsPerUnique}</span>
                <button
                  type="button"
                  onClick={() => updateConfig('pointsPerUnique', Math.min(25, config.pointsPerUnique + 5))}
                  className="w-9 md:w-10 h-9 md:h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* Dictionary & Validation Rules */}
          <div className="bg-surface-container-lowest rounded-xl p-4 md:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-1">
              <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">gavel</span>
              <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-semibold">Dictionary & Validation Rules</span>
            </div>

            {/* Allow Plurals */}
            <label className="flex items-center justify-between py-2 cursor-pointer select-none">
              <div className="flex flex-col pr-4">
                <span className="font-body-md text-[14px] md:text-[15px] font-semibold text-on-surface">Allow Plural Forms</span>
                <span className="font-label-sm text-[12px] text-on-surface-variant">Words ending in -s, -es, -ies flagged as duplicate roots if off</span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={config.allowPlurals}
                  onChange={(e) => updateConfig('allowPlurals', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </div>
            </label>

            {/* Allow Proper Nouns */}
            <label className="flex items-center justify-between py-2 cursor-pointer select-none">
              <div className="flex flex-col pr-4">
                <span className="font-body-md text-[14px] md:text-[15px] font-semibold text-on-surface">Allow Proper Nouns</span>
                <span className="font-label-sm text-[12px] text-on-surface-variant">Permit specific celebrity names, commercial trademarks, or brands</span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={config.allowProperNouns}
                  onChange={(e) => updateConfig('allowProperNouns', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </div>
            </label>

            {/* Allow Offensive Words */}
            <label className="flex items-center justify-between py-2 cursor-pointer select-none">
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-body-md text-[14px] md:text-[15px] font-semibold text-on-surface">Allow Offensive Words</span>
                  <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-[10px]">Family Filter</span>
                </div>
                <span className="font-label-sm text-[12px] text-on-surface-variant">Default disabled for kid-friendly and safe family sessions</span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={config.allowProfanity}
                  onChange={(e) => updateConfig('allowProfanity', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </div>
            </label>

            {/* Cross-Team Uniqueness */}
            <label className="flex items-center justify-between py-2 cursor-pointer select-none">
              <div className="flex flex-col pr-4">
                <span className="font-body-md text-[14px] md:text-[15px] font-semibold text-on-surface">Cross-Team Uniqueness</span>
                <span className="font-label-sm text-[12px] text-on-surface-variant">Answers unique inside your sub-team score full points</span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={config.crossTeamUniqueness}
                  onChange={(e) => updateConfig('crossTeamUniqueness', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </div>
            </label>
          </div>

          {/* Room Privacy & Host Assignment */}
          <div className="bg-surface-container-lowest rounded-xl p-4 md:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-1">
              <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">security</span>
              <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-semibold">Access & Permissions</span>
            </div>

            {/* Visibility Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-xl">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="roomVisibility"
                  value="public"
                  checked={config.roomVisibility === 'public'}
                  onChange={() => updateConfig('roomVisibility', 'public')}
                  className="sr-only"
                />
                <div className="h-10 md:h-12 rounded-lg flex items-center justify-center gap-1.5 font-label-caps text-[10px] md:text-[11px] font-semibold text-on-surface-variant peer-checked:bg-surface-container-lowest peer-checked:text-primary peer-checked:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">public</span> Public Room
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="roomVisibility"
                  value="private"
                  checked={config.roomVisibility === 'private'}
                  onChange={() => updateConfig('roomVisibility', 'private')}
                  className="sr-only"
                />
                <div className="h-10 md:h-12 rounded-lg flex items-center justify-center gap-1.5 font-label-caps text-[10px] md:text-[11px] font-semibold text-on-surface-variant peer-checked:bg-surface-container-lowest peer-checked:text-primary peer-checked:shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">lock</span> Private Passcode
                </div>
              </label>
            </div>

            {/* Host Identity Note */}
            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-surface-container-low mt-2">
              <div className="w-9 md:w-10 h-9 md:h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-headline-sm text-[14px] md:text-[16px] font-bold flex-shrink-0">
                A
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-body-md text-[14px] md:text-[15px] font-semibold text-on-surface truncate">Alex Rivera</span>
                  <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed font-label-caps text-[10px] md:text-[11px] font-bold">HOST</span>
                </div>
                <span className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant truncate">Full control over timer skips, vote recalls & deck roll</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action & Live Summary */}
        <div className="mt-2 flex flex-col gap-1.5 md:col-span-2 md:mt-4">
          <div className="p-3 md:p-4 bg-surface-container-high rounded-xl flex items-center justify-between text-on-surface">
            <div className="flex items-center gap-1.5 font-label-sm text-[12px] md:text-[14px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] md:text-[20px] text-primary">info</span>
              <span className="truncate font-semibold">{summaryText}</span>
            </div>
            <span className="font-label-caps text-[10px] md:text-[12px] text-primary uppercase font-bold flex-shrink-0">DTO READY</span>
          </div>

          {/* Main Primary CTA Button */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full h-12 md:h-14 rounded-lg bg-primary-container text-on-primary font-headline-sm text-[14px] md:text-[16px] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <span className="material-symbols-outlined text-[20px] md:text-[24px] animate-spin">progress_activity</span>
                <span>{editCode ? 'Saving Config...' : 'Creating Room...'}</span>
              </>
            ) : (
              <>
                <span>{editCode ? 'Save Config & Return' : 'Create Room & Open Lobby'}</span>
                <span className="material-symbols-outlined text-[22px] md:text-[26px]">{editCode ? 'save' : 'arrow_forward'}</span>
              </>
            )}
          </button>

          {/* Cancel link */}
          <div className="flex justify-center mt-1 md:mt-2">
            <button
              type="button"
              onClick={() => navigate(editCode ? `/lobby/${editCode}` : '/dashboard')}
              className="text-on-surface-variant hover:text-on-surface font-label-sm text-[12px] md:text-[14px] py-2"
            >
              Cancel and return to {editCode ? 'Lobby' : 'Main Menu'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
