import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../state/gameStore';
import type { GameState } from '../api/types';

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
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-amber-400/30 border-amber-400 rounded-full animate-spin" />
        <p className="text-white/70 mt-3 text-sm">Loading results...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>
        <p className="text-white mb-2 font-medium">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
          Back to Home
        </button>
      </div>
    </div>
  );

  if (!game) return null;

  const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
  const sortedTeams = [...game.teams].sort((a, b) => b.teamScore - a.teamScore);
  const winner = sortedPlayers[0];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Game Over Header */}
      <div className="text-center">
        <div className="inline-block mb-3">
          <span className="text-5xl">🏆</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">Game Over!</h1>
        <p className="text-white/40 text-sm">
          Code: <span className="font-mono font-bold text-white/70">{code}</span>
        </p>
        {winner && (
          <p className="text-amber-400 text-sm font-medium mt-2">
            Winner: {winner.name} ({winner.totalScore} pts)
          </p>
        )}
      </div>

      {/* Player Rankings */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Player Rankings</h2>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const hostId = game.players[0]?.id;
            const isHostAtTop = hostId && player.id === hostId && index === 0;
            return (
            <div key={player.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
              isHostAtTop
                ? 'bg-amber-500/20 ring-1 ring-amber-400/30'
                : index > 0 && index < 3
                  ? 'bg-white/5'
                  : ''
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  index === 0 ? 'bg-amber-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-white/10 text-white/50'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <span className="text-white font-medium text-sm">{player.name}</span>
                  {player.isHost && (
                    <span className="ml-1.5 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">HOST</span>
                  )}
                  {player.team && (
                    <span className="block text-xs text-white/40">{player.team}</span>
                  )}
                </div>
              </div>
              <div className="text-amber-400 font-bold text-sm">{player.totalScore} pts</div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Team Standings */}
      {sortedTeams.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Team Standings</h2>
          <div className="space-y-2">
            {sortedTeams.map((team, index) => (
              <div key={team.id} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    index === 0 ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-white text-sm font-medium">{team.name}</span>
                </div>
                <span className="text-amber-400 font-bold text-sm">{team.teamScore} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Round History */}
      {game.rounds && game.rounds.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Round History</h2>
          <div className="space-y-1.5">
            {[...game.rounds].sort((a, b) => a.roundNumber - b.roundNumber).map(round => (
              <div key={round.id} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                <span className="text-white text-sm font-medium">Round {round.roundNumber}</span>
                <span className="text-amber-400 text-sm">Letter {round.letter}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back to Home */}
      <button
        onClick={() => navigate('/')}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/30"
      >
        Back to Home
      </button>
    </div>
  );
}
