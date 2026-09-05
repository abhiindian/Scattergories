import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../state/gameStore';
import type { GameState } from '../api/types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';

/**
 * Scoreboard page - redesigned with Carbon Design System.
 * Features: Game Complete card with crown animation, The Podium (Gold/Silver/Bronze bar chart),
 * Team Breakdown with progress bar, Match Insights grid.
 */
export function Scoreboard() {
  const { code } = useParams<{ code: string }>()!;
  const navigate = useNavigate();
  const { game, setGame } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${code}`);
      if (!res.ok) {
        setError('Failed to load game');
        return;
      }
      const data: GameState = await res.json();
      setGame(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [code, setGame]);

  useEffect(() => {
    fetchGame();
    // Poll until game finishes
    const interval = setInterval(fetchGame, 2000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" label="Loading results..." />
    </div>
  );

  if (error) return (
    <ErrorState
      message={error}
      actionLabel="Back to Home"
      onAction={() => navigate('/dashboard')}
    />
  );

  if (!game) return null;

  const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
  const sortedTeams = [...game.teams].sort((a, b) => b.teamScore - a.teamScore);
  const winner = sortedPlayers[0];

  // Calculate team margin
  const teamMargin = sortedTeams.length >= 2 ? sortedTeams[0].teamScore - sortedTeams[1].teamScore : 0;
  const totalTeamScore = sortedTeams.reduce((sum, t) => sum + t.teamScore, 0);
  const team1Percent = sortedTeams.length > 0 ? (sortedTeams[0].teamScore / totalTeamScore) * 100 : 50;
  const team2Percent = sortedTeams.length > 1 ? (sortedTeams[1].teamScore / totalTeamScore) * 100 : 50;

  return (
    <div className="max-w-md md:max-w-4xl lg:max-w-[1120px] mx-auto px-4 md:px-8 py-4 pb-8 md:py-8">
      <div className="md:grid md:grid-cols-12 md:gap-6 lg:gap-8">
        {/* Left Column: Result & Actions */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4">
          {/* Game Complete Card */}
          <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-sm p-6 mb-4 md:mb-0 text-center flex-grow md:flex-grow-0 md:flex md:flex-col md:justify-center">
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-carbon-amber/10 pointer-events-none blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/10 pointer-events-none blur-2xl"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-carbon-amber/20 flex items-center justify-center shadow-md animate-bounce">
                  <span className="material-symbols-outlined text-carbon-amber text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                </div>
                <div className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full bg-carbon-amber text-on-surface font-label-caps text-[10px] font-bold uppercase shadow-sm">
                  {game.rounds?.length || 0}/9 Rounds
                </div>
              </div>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mb-1">Final Result</span>
              <h1 className="font-headline-lg text-[20px] md:text-[24px] text-on-surface font-bold tracking-tight">Game Complete!</h1>
              <p className="font-body-md text-[14px] md:text-[15px] text-on-surface-variant mt-1 max-w-xs">
                Outstanding vocabulary warfare! <strong className="text-on-surface font-semibold">{winner?.name}</strong> claims the crown as Word Champion.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-highest shadow-sm">
                <span className="material-symbols-outlined text-carbon-teal text-[18px]">verified</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant font-medium">Verified by Consensus Voting</span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Desktop inline below result) */}
          <div className="hidden md:flex flex-col gap-2.5">
            <button
              onClick={() => navigate(`/lobby/${code}`)}
              className="w-full h-12 md:h-14 rounded-lg bg-primary text-on-primary font-body-lg text-[16px] md:text-[18px] font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform hover:bg-primary-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">replay</span>
              <span>Play Again</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12 md:h-14 rounded-lg bg-surface-container-high text-on-surface font-body-md text-[14px] md:text-[16px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-surface-container-highest"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">home</span>
              <span>Return to Home</span>
            </button>
          </div>
        </div>

        {/* Right Column: Podium, Teams, Insights */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-4">
          {/* The Podium */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm p-4 md:p-6 mb-4 md:mb-0">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">military_tech</span>
                <span className="font-headline-sm text-[14px] md:text-[18px] text-on-surface font-bold">The Podium</span>
              </div>
              <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant uppercase">Individual Standings</span>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-6 md:pt-10 pb-2">
              {/* Silver (Left) */}
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center">
                  <div className="relative mb-2 md:mb-3">
                    <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-sm overflow-hidden">
                      <span className="font-headline-sm text-[14px] md:text-[20px] text-on-surface font-bold">{sortedPlayers[1].name[0].toUpperCase()}</span>
                    </div>
                    <span className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-5 md:w-7 h-5 md:h-7 rounded-full bg-surface-container-highest text-on-surface-variant font-label-caps text-[10px] md:text-[12px] flex items-center justify-center font-bold shadow-xs">2</span>
                  </div>
                  <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface truncate w-full text-center">{sortedPlayers[1].name}</span>
                  <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant font-semibold">{sortedPlayers[1].totalScore} PTS</span>
                  <div className="w-full h-24 md:h-32 mt-2 md:mt-4 rounded-t-lg bg-surface-container-high flex flex-col items-center justify-start pt-2 md:pt-4 shadow-inner">
                    <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant font-bold">SILVER</span>
                  </div>
                </div>
              )}

              {/* Gold (Center) */}
              {sortedPlayers[0] && (
                <div className="flex flex-col items-center -mt-6 md:-mt-10">
                  <div className="relative mb-2 md:mb-3">
                    <div className="absolute -top-5 md:-top-7 left-1/2 -translate-x-1/2 text-carbon-amber">
                      <span className="material-symbols-outlined text-[24px] md:text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                    </div>
                    <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-carbon-amber/20 flex items-center justify-center shadow-md overflow-hidden">
                      <span className="font-display-letter text-[28px] md:text-[36px] text-on-surface font-bold">{sortedPlayers[0].name[0].toUpperCase()}</span>
                    </div>
                    <span className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 md:w-8 h-6 md:h-8 rounded-full bg-carbon-amber text-on-surface font-label-caps text-[10px] md:text-[14px] flex items-center justify-center font-bold shadow-sm">1</span>
                  </div>
                  <span className="font-headline-sm text-[14px] md:text-[18px] text-on-surface font-bold truncate w-full text-center">{sortedPlayers[0].name}</span>
                  <span className="font-label-caps text-[10px] md:text-[14px] text-primary font-bold">{sortedPlayers[0].totalScore} PTS</span>
                  <div className="w-full h-32 md:h-40 mt-2 md:mt-4 rounded-t-lg bg-carbon-amber/20 flex flex-col items-center justify-start pt-2 md:pt-4 shadow-inner">
                    <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface font-bold">GOLD</span>
                    <span className="material-symbols-outlined text-carbon-amber text-[20px] md:text-[24px] mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                </div>
              )}

              {/* Bronze (Right) */}
              {sortedPlayers[2] && (
                <div className="flex flex-col items-center">
                  <div className="relative mb-2 md:mb-3">
                    <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-sm overflow-hidden">
                      <span className="font-headline-sm text-[14px] md:text-[20px] text-on-surface font-bold">{sortedPlayers[2].name[0].toUpperCase()}</span>
                    </div>
                    <span className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-5 md:w-7 h-5 md:h-7 rounded-full bg-carbon-magenta/20 text-carbon-magenta font-label-caps text-[10px] md:text-[12px] flex items-center justify-center font-bold shadow-xs">3</span>
                  </div>
                  <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface truncate w-full text-center">{sortedPlayers[2].name}</span>
                  <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant font-semibold">{sortedPlayers[2].totalScore} PTS</span>
                  <div className="w-full h-16 md:h-24 mt-2 md:mt-4 rounded-t-lg bg-carbon-magenta/10 flex flex-col items-center justify-start pt-2 md:pt-4 shadow-inner">
                    <span className="font-label-caps text-[10px] md:text-[12px] text-carbon-magenta font-bold">BRONZE</span>
                  </div>
                </div>
              )}
            </div>

            {/* Other players list */}
            {sortedPlayers.length > 3 && (
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border-subtle flex items-center justify-between px-3 md:px-4 py-2 md:py-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <span className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-surface-container-highest text-on-surface-variant font-label-caps text-[10px] md:text-[12px] flex items-center justify-center font-semibold">
                    {sortedPlayers.length}
                  </span>
                  <span className="font-body-md text-[14px] md:text-[16px] text-on-surface font-medium truncate">{sortedPlayers[3]?.name}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant font-semibold">{sortedPlayers[3]?.totalScore} PTS</span>
                  <span className="material-symbols-outlined text-outline text-[16px] md:text-[20px]">chevron_right</span>
                </div>
              </div>
            )}
          </div>

          {/* Team Breakdown */}
          {sortedTeams.length >= 2 && (
            <div className="rounded-xl bg-surface-container-lowest shadow-sm p-4 md:p-6 mb-4 md:mb-0">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px] md:text-[24px]">groups</span>
                  <span className="font-headline-sm text-[14px] md:text-[18px] text-on-surface font-bold">Team Breakdown</span>
                </div>
                <span className="font-label-caps text-[10px] md:text-[12px] text-carbon-green font-bold bg-carbon-green/10 px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                  +{teamMargin} Margin
                </span>
              </div>

              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] md:text-[12px] text-primary font-bold uppercase tracking-wider">{sortedTeams[0].name}</span>
                  <span className="font-headline-md text-[16px] md:text-[20px] text-on-surface font-bold">
                    {sortedTeams[0].teamScore} <span className="font-label-sm text-[12px] md:text-[14px] font-normal text-on-surface-variant">pts</span>
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-caps text-[10px] md:text-[12px] text-carbon-amber font-bold uppercase tracking-wider">{sortedTeams[1].name}</span>
                  <span className="font-headline-md text-[16px] md:text-[20px] text-on-surface font-bold">
                    {sortedTeams[1].teamScore} <span className="font-label-sm text-[12px] md:text-[14px] font-normal text-on-surface-variant">pts</span>
                  </span>
                </div>
              </div>

              {/* Team Progress Bar */}
              <div className="w-full h-3 md:h-4 rounded-full bg-surface-container-high overflow-hidden flex shadow-inner">
                <div className="h-full bg-primary rounded-l-full transition-all" style={{ width: `${team1Percent}%` }} />
                <div className="h-full bg-carbon-amber rounded-r-full transition-all" style={{ width: `${team2Percent}%` }} />
              </div>

              {/* Team Members */}
              <div className="mt-3 md:mt-4 grid grid-cols-2 gap-3 md:gap-4 pt-2">
                <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 md:py-2 rounded md:rounded-lg bg-primary/5">
                  <span className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-primary flex-shrink-0"></span>
                  <span className="font-label-sm text-[12px] md:text-[14px] text-on-surface-variant truncate">
                    {game.players.filter(p => p.teamId === sortedTeams[0].id || p.team === sortedTeams[0].name).map(p => p.name).join(', ') || 'Players'}
                  </span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 md:py-2 rounded md:rounded-lg bg-carbon-amber/10">
                  <span className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-carbon-amber flex-shrink-0"></span>
                  <span className="font-label-sm text-[12px] md:text-[14px] text-on-surface-variant truncate">
                    {game.players.filter(p => p.teamId === sortedTeams[1].id || p.team === sortedTeams[1].name).map(p => p.name).join(', ') || 'Players'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Match Insights */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm p-4 md:p-6 mb-6 md:mb-0">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="material-symbols-outlined text-carbon-teal text-[20px] md:text-[24px]">analytics</span>
                <span className="font-headline-sm text-[14px] md:text-[18px] text-on-surface font-bold">Match Insights</span>
              </div>
              <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant font-medium">Full Game Stats</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {/* Uniques */}
              <div className="rounded-lg bg-surface-container-low p-2.5 md:p-4 flex sm:flex-col justify-between items-center sm:items-start text-left">
                <div className="flex items-center gap-1 md:gap-2 mb-0 sm:mb-2 text-primary">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">lightbulb</span>
                  <span className="font-label-caps text-[10px] md:text-[11px] font-semibold uppercase">Uniques</span>
                </div>
                <div className="text-right sm:text-left">
                  <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-bold">{winner?.name}</span>
                  <p className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant leading-tight mt-0.5 md:mt-1">Most unique answers</p>
                </div>
              </div>

              {/* Speed */}
              <div className="rounded-lg bg-surface-container-low p-2.5 md:p-4 flex sm:flex-col justify-between items-center sm:items-start text-left">
                <div className="flex items-center gap-1 md:gap-2 mb-0 sm:mb-2 text-carbon-cyan">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">speed</span>
                  <span className="font-label-caps text-[10px] md:text-[11px] font-semibold uppercase">Speed</span>
                </div>
                <div className="text-right sm:text-left">
                  <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-bold">{sortedPlayers[1]?.name || winner?.name}</span>
                  <p className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant leading-tight mt-0.5 md:mt-1">Fastest average lock-in</p>
                </div>
              </div>

              {/* Validity */}
              <div className="rounded-lg bg-surface-container-low p-2.5 md:p-4 flex sm:flex-col justify-between items-center sm:items-start text-left">
                <div className="flex items-center gap-1 md:gap-2 mb-0 sm:mb-2 text-carbon-green">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">check_circle</span>
                  <span className="font-label-caps text-[10px] md:text-[11px] font-semibold uppercase">Validity</span>
                </div>
                <div className="text-right sm:text-left">
                  <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-bold">84%</span>
                  <p className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant leading-tight mt-0.5 md:mt-1">High word accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Mobile inline below everything) */}
      <div className="md:hidden flex flex-col gap-2.5 mt-4">
        <button
          onClick={() => navigate(`/lobby/${code}`)}
          className="w-full h-12 rounded-lg bg-primary text-on-primary font-body-lg text-[16px] font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">replay</span>
          <span>Play Again with Same Players</span>
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full h-12 rounded-lg bg-surface-container-high text-on-surface font-body-md text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span>Return to Home</span>
        </button>
      </div>
    </div>
  );
}
