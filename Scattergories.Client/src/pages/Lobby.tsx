import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useGameStore } from '../state/gameStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { toast } from 'sonner';
import type { PlayerDto, TeamDto } from '../api/types';

/**
 * Lobby page - redesigned with Carbon Design System.
 * Features: Room Invitation Banner, Player Roster, Match Rules Summary,
 * Sticky Bottom Action Dock.
 */
export function Lobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { playerName, game, joinGame, setGame } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const fetchGame = useCallback(async () => {
    try {
      const data = await apiClient.getGame(code!);
      setGame(data);
      joinGame(code!, playerName);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [code, playerName, setGame, joinGame]);

  useEffect(() => {
    fetchGame();
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchGame, 3000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await apiClient.startGame(code!);
      navigate(`/game/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start game');
      setStarting(false);
    }
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success('Game code copied!');
    }
  };

  const handleShareInvite = async () => {
    const shareData = {
      title: 'Join my Scattergories Lobby!',
      text: `Hop in and play Scattergories with code: ${code}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const isHost = game?.players[0]?.name === playerName;
  const playerCount = game?.players.length || 0;
  const maxSlots = 8;

  const getTeamForPlayer = (player: PlayerDto): TeamDto | undefined => {
    return game?.teams.find(t => t.id === player.teamId || t.name === player.team);
  };

  const getTeamColor = (team?: TeamDto): string => {
    if (!team) return 'bg-primary-fixed text-on-primary-fixed';
    const teamName = team.name?.toLowerCase() || '';
    if (teamName.includes('blue') || teamName.includes('a')) return 'bg-primary-fixed text-on-primary-fixed';
    if (teamName.includes('orange') || teamName.includes('b')) return 'bg-secondary-fixed text-on-secondary-fixed';
    return 'bg-tertiary-fixed text-on-tertiary-fixed';
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" label="Loading lobby..." />
    </div>
  );

  if (error) return (
    <ErrorState
      message={error}
      actionLabel="Back to Home"
      onAction={() => navigate('/')}
    />
  );

  return (
    <div className="max-w-md md:max-w-4xl lg:max-w-[1120px] mx-auto px-4 py-4 md:py-8 pb-28 md:pb-8">
      <div className="md:grid md:grid-cols-12 md:gap-8 lg:gap-12">
        {/* Left Column: Room Banner & Players */}
        <div className="md:col-span-7 lg:col-span-7 flex flex-col gap-4">
          {/* Game Room Invitation Banner */}
          <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] mb-4 md:mb-0">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-primary/5 pointer-events-none blur-xl"></div>
            
            {/* Live Room Status */}
            <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-carbon-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-carbon-green"></span>
                </span>
                <span className="font-label-caps text-[10px] md:text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Live Room</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] md:text-[20px]">groups</span>
                <span className="font-label-caps text-[10px] md:text-[12px] font-semibold">{playerCount} / {maxSlots} SLOTS</span>
              </div>
            </div>

            {/* Room Passcode */}
            <div className="flex flex-col items-center justify-center py-2 md:py-4 px-3 rounded-lg bg-surface-container-low mb-3 md:mb-5">
              <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant uppercase tracking-widest mb-0.5 md:mb-1">Room Passcode</span>
              <span className="font-display-letter text-[32px] md:text-[42px] font-bold tracking-widest text-primary leading-none select-all" id="room-code-display">
                {code}
              </span>
            </div>

            {/* Code Interaction Actions */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                onClick={handleCopyCode}
                className="min-h-[48px] md:min-h-[52px] rounded-lg bg-primary-fixed text-on-primary-fixed font-headline-sm text-[14px] md:text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm hover:bg-primary-fixed-dim"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[22px]">content_copy</span>
                <span className="font-label-caps text-[10px] md:text-[12px] font-bold uppercase">Copy Code</span>
              </button>
              <button
                onClick={handleShareInvite}
                className="min-h-[48px] md:min-h-[52px] rounded-lg bg-surface-container-highest text-on-surface-variant font-headline-sm text-[14px] md:text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-surface-container-high"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[22px]">share</span>
                <span className="font-label-caps text-[10px] md:text-[12px] font-bold uppercase">Share Invite</span>
              </button>
            </div>
          </div>

          {/* Host Metadata & Status */}
          <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-surface-container-lowest shadow-sm mb-4 md:mb-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex items-center justify-center w-10 md:w-12 h-10 md:h-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px] md:text-[26px]">workspace_premium</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface truncate">{playerName} (You)</span>
                  <span className="px-1.5 py-0.5 rounded bg-carbon-amber text-on-surface font-label-caps text-[10px] uppercase font-bold">HOST</span>
                </div>
                <span className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant truncate">Waiting for players to ready up</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full bg-surface-container text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] md:text-[20px] text-carbon-teal" style={{ animation: 'spin 3s linear infinite' }}>sync</span>
              <span className="font-label-caps text-[10px] md:text-[12px] font-semibold">Ready</span>
            </div>
          </div>

          {/* Player Roster */}
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-between mb-2 md:mb-3 px-0.5">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">person_check</span>
                <h2 className="font-headline-sm text-[14px] md:text-[18px] text-on-surface font-bold">Player Roster</h2>
              </div>
              <span className="font-label-caps text-[10px] md:text-[12px] text-on-surface-variant font-semibold">{playerCount} CONNECTED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2.5 md:gap-3">
              {/* Player List */}
              {game?.players.map((player) => {
                const team = getTeamForPlayer(player);
                const isCurrentPlayer = player.name === playerName;
                
                return (
                  <div key={player.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 md:w-14 h-12 md:h-14 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-headline-sm text-[14px] md:text-[16px] font-bold">
                          {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-carbon-green border-2 border-surface-container-lowest"></span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface truncate font-semibold">{player.name}</span>
                          {isCurrentPlayer && (
                            <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-[10px] md:text-[11px]">YOU</span>
                          )}
                        </div>
                        <span className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant">
                          {isHost ? 'Match Leader' : `Score: ${player.totalScore || 0} pts`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      {team && (
                        <span className={`px-2.5 py-1 rounded-full ${getTeamColor(team)} font-label-caps text-[10px] md:text-[11px] font-bold`}>
                          {team.name?.toUpperCase()}
                        </span>
                      )}
                      <span className="material-symbols-outlined text-carbon-green text-[20px] md:text-[24px]">check_circle</span>
                    </div>
                  </div>
                );
              })}

              {/* Empty Slot */}
              {Array.from({ length: Math.max(0, maxSlots - playerCount) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-surface-container-low/70 border border-dashed border-surface-container-highest">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 md:w-14 h-12 md:h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[24px] md:text-[28px]">person_add</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-[14px] md:text-[15px] text-on-surface-variant truncate">Empty Slot {playerCount + i + 1}</span>
                      <span className="font-label-sm text-[12px] md:text-[13px] text-outline">Awaiting connection...</span>
                    </div>
                  </div>
                  <button
                    onClick={handleShareInvite}
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-surface-container-highest text-primary font-label-caps text-[10px] md:text-[12px] font-bold uppercase transition-transform active:scale-95 hover:bg-surface-container-lowest shadow-sm"
                    type="button"
                  >
                    + Ping
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Rules & Actions */}
        <div className="md:col-span-5 lg:col-span-5 flex flex-col gap-4 mt-4 md:mt-0">
          {/* Match Rules Summary */}
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-between mb-2 md:mb-3 px-0.5">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px] md:text-[24px]">tune</span>
                <h2 className="font-headline-sm text-[14px] md:text-[18px] text-on-surface font-bold">Match Rules</h2>
              </div>
              <span className="font-label-caps text-[10px] md:text-[12px] text-primary font-semibold hover:underline cursor-pointer">EDIT CONFIG</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              {/* Rounds Card */}
              <div className="flex flex-col p-3 md:p-4 rounded-xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-1 md:gap-1.5 text-tertiary mb-1 md:mb-2">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">casino</span>
                  <span className="font-label-caps text-[10px] md:text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold">Structure</span>
                </div>
                <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-bold">Round 1 of 9</span>
                <span className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant mt-0.5">12 Categories each</span>
              </div>

              {/* Timer Card */}
              <div className="flex flex-col p-3 md:p-4 rounded-xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-1 md:gap-1.5 text-carbon-amber mb-1 md:mb-2">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">timer</span>
                  <span className="font-label-caps text-[10px] md:text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold">Clock</span>
                </div>
                <span className="font-headline-sm text-[14px] md:text-[16px] text-on-surface font-bold">
                  Timer: {game?.settings?.timerSeconds || 180}s
                </span>
                <span className="font-label-sm text-[12px] md:text-[13px] text-on-surface-variant mt-0.5">
                  {(game?.settings?.timerSeconds || 180) <= 60 ? 'Speed pace' : 'High paced speed'}
                </span>
              </div>

              {/* Strict Rule Filter */}
              <div className="col-span-2 flex flex-col p-3 md:p-5 rounded-xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-1.5 md:mb-3">
                  <div className="flex items-center gap-1 md:gap-2 text-carbon-magenta">
                    <span className="material-symbols-outlined text-[18px] md:text-[24px]">verified</span>
                    <span className="font-label-caps text-[10px] md:text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold">Strict Rule Filter</span>
                  </div>
                  <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-surface-container font-label-caps text-[10px] md:text-[11px] text-on-surface-variant font-bold">MODIFIED</span>
                </div>
                <p className="font-body-md text-[14px] md:text-[16px] text-on-surface font-semibold">
                  {!game?.settings?.allowPlurals && !game?.settings?.allowProperNouns
                    ? 'No Plurals, No Proper Nouns'
                    : !game?.settings?.allowPlurals
                      ? 'No Plurals'
                      : !game?.settings?.allowProperNouns
                        ? 'No Proper Nouns'
                        : 'All Answers Allowed'}
                </p>
                <p className="font-label-sm text-[12px] md:text-[14px] text-on-surface-variant mt-0.5 md:mt-1">
                  Duplicate submissions will be automatically eliminated in group review.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 md:p-4 bg-error-container text-error rounded-xl text-sm border border-error/20">
              {error}
            </div>
          )}

          {/* Action Dock (Desktop inline, Mobile sticky) */}
          <div className="fixed md:static bottom-0 left-0 right-0 z-20 p-4 md:p-0 bg-gradient-to-t from-surface via-surface to-transparent md:bg-none mt-auto">
            <div className="max-w-md md:max-w-none mx-auto flex flex-col gap-2.5 md:gap-4">
              <button
                onClick={handleStart}
                disabled={starting || playerCount === 0}
                className="relative overflow-hidden w-full min-h-[52px] md:min-h-[64px] rounded-xl md:rounded-2xl bg-primary text-on-primary font-headline-sm text-[14px] md:text-[18px] font-semibold flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(15,98,254,0.3)] transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {starting ? (
                  <>
                    <span className="material-symbols-outlined text-[24px] md:text-[28px] animate-spin">sync</span>
                    <span>Launching Match...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px] md:text-[32px]">play_arrow</span>
                    <span>Start Game</span>
                    <span className="ml-1 md:ml-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/20 font-label-caps text-[10px] md:text-[12px] font-bold tracking-wider">
                      {playerCount} READY
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={handleShareInvite}
                className="w-full min-h-[48px] md:min-h-[56px] rounded-xl md:rounded-2xl bg-surface-container-highest md:bg-surface-container-low text-primary font-headline-sm text-[14px] md:text-[16px] font-semibold flex items-center justify-center gap-2 transition-all hover:bg-surface-container-high active:scale-[0.98]"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[24px]">person_add</span>
                <span>Invite More Friends</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
