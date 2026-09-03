import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../state/gameStore';
import { hubConnection } from '../api/hubConnection';
import type { GameState, ScoredAnswerDto, CategoryDto } from '../api/types';

type GamePhase = 'timer' | 'answering' | 'revealing' | 'scored';

export function GamePage() {
  const { code } = useParams<{ code: string }>()!;
  const navigate = useNavigate();
  const { playerName, game, roundTimer, roundTimerTotal, isTimerActive, setGame, setRoundTimer, setHubConnected, playerId } = useGameStore();
  const [phase, setPhase] = useState<GamePhase>('timer');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [letter, setLetter] = useState('');
  const [roundCategories, setRoundCategories] = useState<CategoryDto[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
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
        await hubConnection.start(code!, playerName ?? '', playerId ?? undefined, token ?? undefined);
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
          setShowScoreboard(true);
        });

        hubConnection.onRoundComplete(() => {
          setPhase('scored');
          setShowScoreboard(true);
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

  // --- Timer View ---
  if (phase === 'timer') {
    const percentage = timeLeft > 0 ? (timeLeft / roundTimerTotal) * 100 : 0;
    const isLow = timeLeft <= 10 && timeLeft > 0;

    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center max-w-sm w-full">
          {/* Letter Display */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className={`text-9xl font-bold ${
                isLow ? 'text-red-400 animate-pulse' : 'text-white'
              }`}>
                {displayLetter || '?'}
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
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={isLow ? '#f87171' : '#fbbf24'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-5xl font-bold font-mono ${isLow ? 'text-red-400' : 'text-white'}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Categories Preview */}
          {displayCategories.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-6">
              {displayCategories.slice(0, 6).map(cat => (
                <div key={cat.id} className="bg-white/8 backdrop-blur-sm rounded-lg px-2 py-2 text-xs text-white/80 text-center border border-white/10">
                  {cat.name}
                </div>
              ))}
              {displayCategories.length > 6 && (
                <div className="bg-white/5 rounded-lg flex items-center justify-center text-white/40 text-xs border border-white/10">
                  +{displayCategories.length - 6}
                </div>
              )}
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
            <div className={`w-2 h-2 rounded-full ${game?.gameState === 'RoundRunning' ? 'bg-green-400' : 'bg-amber-400'}`} />
            {game?.gameState === 'RoundRunning' ? 'Round in progress' : 'Waiting...'}
          </div>
        </div>
      </div>
    );
  }

  // --- Answering View ---
  if (phase === 'answering') {
    const handleAnswerChange = (categoryId: string, value: string) => {
      setAnswers(prev => ({ ...prev, [categoryId]: value }));
    };

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
      }
    };

    const filledCount = Object.values(answers).filter(v => v.trim()).length;
    const totalCount = displayCategories.length || 1;

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white text-4xl font-bold mb-2">
            {displayLetter}
          </div>
          <p className="text-violet-200/70 text-sm font-medium">
            Fill in the categories below
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${(filledCount / totalCount) * 100}%` }}
            />
          </div>
          <span>{filledCount}/{totalCount}</span>
        </div>

        {/* Answer Form */}
        <div className="space-y-3">
          {displayCategories.map((cat, idx) => (
            <div key={cat.id} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <label className="text-amber-400 font-semibold text-sm w-24 shrink-0">{cat.name}</label>
              <input
                type="text"
                value={answers[cat.id] || ''}
                onChange={(e) => handleAnswerChange(cat.id, e.target.value)}
                placeholder={`Starts with ${displayLetter}`}
                className="flex-1 px-3 py-2 bg-white/10 text-white placeholder-white/30 rounded-lg border border-white/10 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                maxLength={30}
                autoFocus={idx === 0}
              />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitAnswers}
          disabled={filledCount === 0}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-amber-500/30"
        >
          Submit Answers ({filledCount})
        </button>

        {/* Scoreboard Toggle */}
        {showScoreboard && (
          <button
            onClick={() => setShowScoreboard(false)}
            className="w-full py-2 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            Hide Scores
          </button>
        )}
      </div>
    );
  }

  // --- Revealing / Scored View ---
  if (phase === 'revealing' || phase === 'scored') {
    const scoredAnswers = game?.currentRound?.answers || [];
    const groupedAnswers: Record<string, Array<{ playerName: string; text: string; points: number }>> = {};
    scoredAnswers.forEach(a => {
      if (!groupedAnswers[a.categoryId]) groupedAnswers[a.categoryId] = [];
      groupedAnswers[a.categoryId].push({
        playerName: a.playerName,
        text: a.text,
        points: a.points ?? 0,
      });
    });

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Round Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-white text-3xl font-bold mb-2">
            {displayLetter}
          </div>
          <p className="text-white/60 text-sm font-medium">
            {phase === 'scored' ? 'Round Complete' : 'Round Results'}
          </p>
        </div>

        {/* Answers by Category */}
        <div className="space-y-3">
          {displayCategories.map(cat => {
            const catAnswers = groupedAnswers[cat.id] || [];
            return (
              <div key={cat.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 bg-white/5 border-b border-white/5">
                  <h3 className="text-amber-400 font-semibold text-sm">{cat.name}</h3>
                </div>
                {catAnswers.length === 0 ? (
                  <p className="text-white/30 text-sm px-4 py-3 italic">No valid answers</p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {catAnswers.map((a, i) => (
                      <li key={i} className="px-4 py-2.5 flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                            {a.playerName[0].toUpperCase()}
                          </div>
                          <span className="text-white/50 text-xs">{a.playerName}:</span>
                          <span className={a.points > 0 ? 'text-white font-medium' : 'text-red-400 line-through text-sm'}>
                            {a.text}
                          </span>
                        </div>
                        <span className={`font-bold text-xs ml-2 shrink-0 ${
                          a.points > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {a.points} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Team Totals */}
        {game?.teams && game.teams.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Team Scores</h3>
            <div className="space-y-1.5">
              {game.teams.map(t => (
                <div key={t.id} className="flex justify-between text-white text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-amber-400 font-bold">{t.teamScore} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Totals */}
        {game?.players && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2">Player Standings</h3>
            <div className="space-y-1.5">
              {[...game.players]
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((p, i) => (
                  <div key={p.id} className="flex justify-between text-white text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? 'bg-amber-500 text-white' :
                        i === 1 ? 'bg-gray-400 text-white' :
                        i === 2 ? 'bg-amber-700 text-white' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-white/70">
                        {p.name}
                        {p.name === playerName && <span className="text-amber-300 text-xs ml-1">(You)</span>}
                      </span>
                    </div>
                    <span className="font-bold text-amber-400">{p.totalScore} pts</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {phase === 'scored' && (
          <div className="text-center py-4">
            {game?.gameState === 'Finished' ? (
              <button
                onClick={() => navigate(`/scoreboard/${code}`)}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/30"
              >
                View Final Scoreboard
              </button>
            ) : (
              <p className="text-white/40 text-sm">Next round starting...</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
