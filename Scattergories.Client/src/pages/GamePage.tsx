import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../state/gameStore';
import { hubConnection } from '../api/hubConnection';
import type { GameState, ScoredAnswerDto, CategoryDto } from '../api/types';
import { toast } from 'sonner';

type GamePhase = 'timer' | 'answering' | 'revealing' | 'scored';

/**
 * Game page - redesigned with Carbon Design System.
 * Features: Sticky HUD bar with letter spotlight, circular timer widget,
 * Categories Input Stream with letter prefix, Floating Mobile Interaction Bar.
 */
export function GamePage() {
  const { code } = useParams<{ code: string }>()!;
  const navigate = useNavigate();
  const { playerName, game, roundTimer, roundTimerTotal, isTimerActive, setGame, setRoundTimer, setHubConnected, playerId } = useGameStore();
  const [phase, setPhase] = useState<GamePhase>('timer');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [letter, setLetter] = useState('');
  const [roundCategories, setRoundCategories] = useState<CategoryDto[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch current game state
  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${code}`);
      if (!res.ok) return;
      const data: GameState = await res.json();
      setGame(data);
      updatePhaseFromState(data);
    } catch {
      // Game may have ended or API unreachable
    }
  }, [code, setGame]);

  function updatePhaseFromState(state: GameState) {
    switch (state.gameState) {
      case 'RoundRunning':
        setPhase('timer');
        break;
      case 'Answering':
        setPhase('answering');
        break;
      case 'Revealing':
        setPhase('revealing');
        break;
      case 'Finished':
        navigate(`/scoreboard/${code}`);
        break;
    }
  }

  // Timer countdown for active rounds
  useEffect(() => {
    if (phase === 'timer' && isTimerActive && roundTimer > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimeLeft(roundTimer);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isTimerActive, roundTimer]);

  // Connect to SignalR hub
  useEffect(() => {
    const connect = async () => {
      const token = localStorage.getItem('authToken');
      try {
        await hubConnection.start(code!, playerId ?? undefined, token ?? undefined);
        setHubConnected(true);

        // Initial game state fetch after connection
        if (!hasFetched.current) {
          hasFetched.current = true;
          await fetchGame();
        }

        // Register event handlers
        hubConnection.onGameUpdated((state: GameState) => {
          setGame(state);
          updatePhaseFromState(state);
        });

        hubConnection.onRoundStarted((data: { letter: string; timerSeconds: number; categories: CategoryDto[] }) => {
          setLetter(data.letter);
          setRoundCategories(data.categories);
          setPhase('timer');
          setRoundTimer(data.timerSeconds, data.timerSeconds, true);
          setTimeLeft(data.timerSeconds);
          // Reset answers for new round
          const newAnswers: Record<string, string> = {};
          data.categories.forEach(cat => { newAnswers[cat.id] = ''; });
          setAnswers(newAnswers);
        });

        hubConnection.onTimerTick((data: { remaining: number; total: number }) => {
          setRoundTimer(data.remaining, data.total, data.remaining > 0);
          setTimeLeft(data.remaining);
        });

        hubConnection.onTimeUp(() => {
          setPhase('answering');
        });

        hubConnection.onAnswersRevealed((data: { roundCategories: CategoryDto[]; scoredAnswers: ScoredAnswerDto[] }) => {
          setRoundCategories(data.roundCategories);
          setPhase('revealing');
        });

        hubConnection.onRoundComplete(() => {
          setPhase('scored');
        });

        hubConnection.onError((error: string) => {
          console.error('Hub error:', error);
        });
      } catch (e) {
        console.error('Failed to connect to hub:', e);
      }
    };
    connect();

    return () => {
      hubConnection.stop();
      setHubConnected(false);
    };
  }, [code, playerName, playerId, setGame, setRoundTimer, setHubConnected, fetchGame, navigate]);

  // Poll for game state as backup
  useEffect(() => {
    const interval = setInterval(fetchGame, 5000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  const displayLetter = letter || game?.currentRound?.letter || '';
  const displayCategories = roundCategories.length > 0 ? roundCategories : (game?.currentRound?.categories || []);
  const currentRoundNumber = game?.currentRound?.roundNumber || 1;
  const totalRounds = 9;
  const timerProgress = roundTimerTotal > 0 ? ((roundTimerTotal - timeLeft) / roundTimerTotal) * 100 : 0;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Timer View ---
  if (phase === 'timer') {
    return (
      <div className="max-w-md md:max-w-4xl lg:max-w-[1120px] mx-auto px-4 md:px-8 py-4 pb-28 md:pb-8">
        {/* Sticky Game Heads-Up Bar */}
        <div className="sticky top-0 z-30 pt-2 pb-3 bg-surface/90 backdrop-blur-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-4 flex items-center justify-between gap-3">
            {/* Round Info & Target Letter Spotlight */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center text-on-secondary shadow-sm">
                <span className="font-label-caps text-[10px] opacity-80 uppercase leading-none">Letter</span>
                <span className="font-display-letter text-[28px] leading-none font-bold">{displayLetter}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-semibold">
                    ROUND {currentRoundNumber} OF {totalRounds}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-carbon-teal"></span>
                </div>
                <span className="font-headline-sm text-[14px] text-on-surface">
                  List #{currentRoundNumber} Classic
                </span>
                <span className="font-label-sm text-[12px] text-primary font-medium">
                  All words must start with "{displayLetter}"
                </span>
              </div>
            </div>

            {/* Circular Timer Widget */}
            <div className="relative flex items-center justify-center flex-shrink-0 w-16 h-16 bg-surface-container-low rounded-full shadow-inner">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                <circle className="stroke-surface-container-highest" cx="24" cy="24" fill="transparent" r="20" strokeWidth="4" />
                <circle
                  className="stroke-primary transition-all duration-500"
                  cx="24"
                  cy="24"
                  fill="transparent"
                  r="20"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (timerProgress / 100) * 125.6}
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-headline-sm text-[12px] text-on-surface font-bold tracking-tight">{formatTime(timeLeft)}</span>
                <span className="font-label-caps text-[9px] text-on-surface-variant leading-none">SEC</span>
              </div>
            </div>
          </div>

          {/* Progress Urgency Bar */}
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${timerProgress}%` }}
            />
          </div>
        </div>

        {/* Categories Preview Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
          {displayCategories.slice(0, 3).map((cat, index) => (
            <div key={cat.id} className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[10px]">
                    #{index + 1}
                  </span>
                  <span className="font-headline-sm text-[14px] text-on-surface">{cat.name}</span>
                </div>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center font-headline-sm text-secondary font-bold select-none">
                  {displayLetter}
                </div>
                <input
                  className="w-full h-12 pl-14 pr-4 rounded-lg bg-surface-container-low text-on-surface font-body-lg text-[16px] font-medium focus:outline-none focus:bg-surface-container"
                  placeholder={`Starts with ${displayLetter}...`}
                  type="text"
                  readOnly
                  value=""
                />
              </div>
            </div>
          ))}

          {/* Show more if > 3 categories */}
          {displayCategories.length > 3 && (
            <div className="text-center py-2">
              <span className="font-label-sm text-[12px] text-on-surface-variant">
                +{displayCategories.length - 3} more categories below
              </span>
            </div>
          )}
        </div>

        {/* Floating Mobile Interaction Bar */}
        <div className="fixed md:static bottom-0 left-0 right-0 z-40 px-4 md:px-0 pb-4 md:pb-0 pt-2 md:pt-6 bg-surface/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:shadow-none mt-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-1 md:gap-4 max-w-md md:max-w-none mx-auto">
            {/* Auto-save notification */}
            <div className="flex items-center justify-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] md:text-[20px] text-carbon-green">cloud_done</span>
              <span className="font-label-sm text-[12px] md:text-[14px]">All answers saved in real-time</span>
            </div>
            {/* Action Button */}
            <button
              onClick={() => setPhase('answering')}
              className="w-full md:w-auto h-12 md:h-14 md:px-8 rounded-lg md:rounded-xl bg-primary text-on-primary font-headline-sm text-[14px] md:text-[16px] flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
              type="button"
            >
              <span>Submit Answers Early</span>
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">send</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Answering View ---
  if (phase === 'answering') {
    const handleSubmitAnswers = async () => {
      try {
        const answerList = Object.entries(answers)
          .filter(([, text]) => text.trim())
          .map(([categoryId, text]) => ({ categoryId, text: text.trim() }));

        if (answerList.length > 0) {
          await hubConnection.submitAnswers(code!, answerList);
        }
      } catch (e) {
        console.error('Failed to submit answers:', e);
        toast.error('Failed to submit answers');
      }
    };

    return (
      <div className="max-w-md md:max-w-4xl lg:max-w-[1120px] mx-auto px-4 md:px-8 py-4 pb-28 md:pb-8">
        {/* Sticky Game Heads-Up Bar */}
        <div className="sticky top-0 z-30 pt-2 pb-3 bg-surface/90 backdrop-blur-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-4 flex items-center justify-between gap-3">
            {/* Round Info & Target Letter Spotlight */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center text-on-secondary shadow-sm">
                <span className="font-label-caps text-[10px] opacity-80 uppercase leading-none">Letter</span>
                <span className="font-display-letter text-[28px] leading-none font-bold">{displayLetter}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-semibold">
                    ROUND {currentRoundNumber} OF {totalRounds}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-carbon-teal"></span>
                </div>
                <span className="font-headline-sm text-[14px] text-on-surface">
                  List #{currentRoundNumber} Classic
                </span>
                <span className="font-label-sm text-[12px] text-primary font-medium">
                  All words must start with "{displayLetter}"
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0 px-2.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed">
              <span className="font-label-caps text-[10px] font-semibold">ANSWERING</span>
            </div>
          </div>
        </div>

        {/* Categories Input Stream */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
          {displayCategories.map((cat, index) => {
            const hasAnswer = answers[cat.id]?.trim();
            const isActive = activeCategory === cat.id;

            return (
              <div key={cat.id} className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2 transition-all ${isActive ? 'shadow-md' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full font-label-caps text-[10px] ${
                      isActive ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className={`font-headline-sm text-[14px] ${isActive ? 'text-on-surface font-semibold' : 'text-on-surface'}`}>
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasAnswer && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-carbon-green/10 text-carbon-green">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span className="font-label-caps text-[10px] font-semibold">VALID</span>
                      </div>
                    )}
                    {!hasAnswer && <span className="font-label-caps text-[10px] text-on-surface-variant">0/1 PTS</span>}
                  </div>
                </div>

                <div className="relative flex items-center">
                  <div className={`absolute left-3 w-8 h-8 rounded-lg flex items-center justify-center font-headline-sm font-bold select-none ${
                    isActive ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-secondary/10 text-secondary'
                  }`}>
                    {displayLetter}
                  </div>
                  <input
                    className={`w-full h-12 pl-14 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-lg text-[16px] font-medium focus:outline-none focus:bg-surface-container ${
                      isActive ? 'bg-surface-container-lowest font-semibold shadow-inner' : ''
                    }`}
                    placeholder={`Starts with ${displayLetter}...`}
                    type="text"
                    value={answers[cat.id] || ''}
                    onChange={(e) => {
                      setAnswers(prev => ({ ...prev, [cat.id]: e.target.value }));
                      setActiveCategory(cat.id);
                    }}
                    onFocus={() => setActiveCategory(cat.id)}
                  />
                  {hasAnswer && (
                    <button
                      onClick={() => setAnswers(prev => ({ ...prev, [cat.id]: '' }))}
                      className="absolute right-3 w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Live Quick-Pick Word Suggestions */}
                {isActive && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                    <span className="font-label-caps text-[10px] text-on-surface-variant mr-1 flex-shrink-0">HINTS:</span>
                    {['Example 1', 'Example 2', 'Example 3', 'Example 4'].map((hint) => (
                      <button
                        key={hint}
                        className="px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-[12px] hover:bg-surface-container-high transition-colors flex-shrink-0"
                        type="button"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Mobile Interaction Bar */}
        <div className="fixed md:static bottom-0 left-0 right-0 z-40 px-4 md:px-0 pb-4 md:pb-0 pt-2 md:pt-6 bg-surface/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:shadow-none mt-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-1 md:gap-4 max-w-md md:max-w-none mx-auto">
            {/* Auto-save notification */}
            <div className="flex items-center justify-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] md:text-[20px] text-carbon-green">cloud_done</span>
              <span className="font-label-sm text-[12px] md:text-[14px]">All answers saved in real-time</span>
            </div>
            {/* Action Button */}
            <button
              onClick={handleSubmitAnswers}
              className="w-full md:w-auto h-12 md:h-14 md:px-8 rounded-lg md:rounded-xl bg-primary text-on-primary font-headline-sm text-[14px] md:text-[16px] flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
              type="button"
            >
              <span>Submit Answers</span>
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">send</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Revealing / Scored View ---
  if (phase === 'revealing' || phase === 'scored') {
    const scoredAnswers = game?.currentRound?.answers || [];
    const groupedAnswers: Record<string, Array<{ playerName: string; text: string; points: number | undefined }>> = {};
    scoredAnswers.forEach(a => {
      if (!groupedAnswers[a.categoryId]) groupedAnswers[a.categoryId] = [];
      groupedAnswers[a.categoryId].push({
        playerName: a.playerName,
        text: a.text,
        points: a.points ?? 0,
      });
    });

    const isLastRound = game?.gameState === 'Finished';

    return (
      <div className="max-w-md md:max-w-4xl lg:max-w-[1120px] mx-auto px-4 md:px-8 py-4 pb-28 md:pb-8">
        {/* Sticky Game Heads-Up Bar */}
        <div className="sticky top-0 z-30 pt-2 pb-3 bg-surface/90 backdrop-blur-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary flex flex-col items-center justify-center text-on-secondary shadow-sm">
                <span className="font-label-caps text-[10px] opacity-80 uppercase leading-none">Letter</span>
                <span className="font-display-letter text-[28px] leading-none font-bold">{displayLetter}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-semibold">
                    ROUND {currentRoundNumber} OF {totalRounds}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-carbon-teal"></span>
                </div>
                <span className="font-headline-sm text-[14px] text-on-surface">
                  {phase === 'revealing' ? 'Revealing Answers' : 'Round Complete'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revealing Answers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
          {displayCategories.map((cat, index) => {
            const categoryAnswers = groupedAnswers[cat.id] || [];

            return (
              <div key={cat.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[10px]">
                      #{index + 1}
                    </span>
                    <span className="font-headline-sm text-[14px] text-on-surface">{cat.name}</span>
                  </div>
                </div>

                {/* Player Submissions */}
                {categoryAnswers.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {categoryAnswers.map((answer, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-headline-sm text-[12px] font-bold">
                            {answer.playerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-headline-sm text-[13px] text-on-surface font-medium">{answer.playerName}</span>
                            <span className="font-body-md text-[14px] text-on-surface-variant block">
                              <span className="text-primary font-bold">{displayLetter}</span>{answer.text}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {answer.points && answer.points > 0 ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-carbon-green/10 text-carbon-green">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              <span className="font-label-caps text-[10px] font-semibold">UNIQUE</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-carbon-red/10 text-carbon-red">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              <span className="font-label-caps text-[10px] font-semibold">DUPLICATE</span>
                            </div>
                          )}
                          {answer.points && (
                            <span className="font-headline-sm text-[14px] text-primary font-bold">+{answer.points}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="font-label-sm text-[12px] text-on-surface-variant">No answers submitted</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Next Round / View Scoreboard */}
        {phase === 'scored' && (
          <div className="mt-4 md:mt-6 flex flex-col md:flex-row md:justify-end gap-2.5 md:gap-4">
            {isLastRound ? (
              <button
                onClick={() => navigate(`/scoreboard/${code}`)}
                className="w-full md:w-auto md:px-8 h-12 md:h-14 rounded-lg md:rounded-xl bg-primary text-on-primary font-headline-sm text-[14px] md:text-[16px] font-semibold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,98,254,0.3)] active:scale-[0.98] transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px] md:text-[24px]">emoji_events</span>
                <span>View Final Scoreboard</span>
              </button>
            ) : (
              <button
                onClick={() => {}}
                className="w-full md:w-auto md:px-8 h-12 md:h-14 rounded-lg md:rounded-xl bg-primary-container text-white font-headline-sm text-[14px] md:text-[16px] font-semibold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(15,98,254,0.3)] active:scale-[0.98] transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px] md:text-[24px]">arrow_forward</span>
                <span>Next Category</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
