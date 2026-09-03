import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useGameStore } from '../state/gameStore';

export function Lobby() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { playerName, game, joinGame, setGame } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, [fetchGame]);

  const handleStart = async () => {
    try {
      await apiClient.startGame(code!);
      navigate(`/game/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start game');
    }
  };

  const handleCopyCode = () => {
    if (code) navigator.clipboard.writeText(code);
  };

  const isHost = game?.players[0]?.name === playerName;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-amber-400/30 border-amber-400 rounded-full animate-spin" />
        <p className="text-white/70 mt-3 text-sm">Loading lobby...</p>
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

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Game Code Banner */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/10">
        <h1 className="text-white/80 text-sm font-medium mb-1">Game Code</h1>
        <button
          onClick={handleCopyCode}
          className="text-4xl font-bold text-white font-mono tracking-[0.3em] hover:text-amber-400 transition-colors cursor-pointer"
        >
          {code}
        </button>
        <p className="text-white/40 text-xs mt-2">Click to copy</p>
      </div>

      {/* Players */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Players ({game?.players.length || 0})
          </h2>
        </div>
        <ul className="space-y-2">
          {game?.players.map((p, i) => (
            <li key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              p.name === playerName ? 'bg-white/15 ring-1 ring-amber-400/50' : 'bg-white/5'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs w-4">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                  {p.name[0].toUpperCase()}
                </div>
                <span className="text-white font-medium text-sm">{p.name}</span>
              </div>
              {p.isHost && (
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">HOST</span>
              )}
              {p.name === playerName && (
                <span className="text-xs text-amber-300">(You)</span>
              )}
            </li>
          ))}
        </ul>
        {!game?.players?.length && (
          <p className="text-white/40 text-sm text-center py-4">No players yet</p>
        )}
      </div>

      {/* Teams */}
      {game?.teams && game.teams.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            🏆 Teams
          </h2>
          <div className="grid gap-2">
            {game.teams.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.id === game.teams[0]?.id ? '#f59e0b' : '#8b5cf6' }} />
                  <span className="text-white text-sm font-medium">{t.name}</span>
                </div>
                <span className="text-amber-400 font-bold text-sm">{t.teamScore} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {game && game.settings && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            ⚙️ Game Settings
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <SettingTile label="Rounds" value={game.settings.roundCount} />
            <SettingTile label="Timer" value={`${game.settings.timerSeconds}s`} />
            <SettingTile label="Points" value={game.settings.pointsPerAnswer} />
            <SettingTile label="Plurals" value={game.settings.allowPlurals ? '✅' : '❌'} />
            <SettingTile label="Proper Nouns" value={game.settings.allowProperNouns ? '✅' : '❌'} />
            <SettingTile label="Offensive" value={game.settings.allowOffensiveWords ? '✅' : '❌'} />
          </div>
        </div>
      )}

      {/* Start / Waiting */}
      {isHost ? (
        <button
          onClick={handleStart}
          disabled={game?.players.length === 0}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-amber-500/30"
        >
          {game?.players.length === 0 ? 'Waiting for players...' : 'Start Game!'}
        </button>
      ) : (
        <div className="text-center py-4">
          <div className="inline-block w-8 h-8 border-3 border-white/30 border-amber-400 rounded-full animate-spin" />
          <p className="text-white/60 mt-2 text-sm">Waiting for host to start...</p>
        </div>
      )}
    </div>
  );
}

function SettingTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-3 py-2 bg-white/5 rounded-lg">
      <div className="text-white/40 text-xs">{label}</div>
      <div className="text-white font-medium text-sm">{value}</div>
    </div>
  );
}
