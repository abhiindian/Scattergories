import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useGameStore } from '../state/gameStore';

/**
 * Home page - the landing screen for Scattergories.
 * Shows play as guest option and login option for returning players.
 */
export function Home() {
  const navigate = useNavigate();
  const { login, handleGoogleLogin, isAuthenticated } = useAuth();
  const { playerName, setPlayerName } = useGameStore();
  const [joinGameCode, setJoinGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setError('Enter your name first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = await apiClient.createGame({ timerSeconds: 180 });
      navigate(`/lobby/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('Enter your name first');
      return;
    }
    if (!joinGameCode.trim()) {
      setError('Enter a game code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let result: { playerId: string };
      if (isAuthenticated) {
        result = await apiClient.joinGameAuth(joinGameCode.trim().toUpperCase(), playerName);
      } else {
        result = await apiClient.joinGame(joinGameCode.trim().toUpperCase(), playerName);
      }
      localStorage.setItem('playerId', result.playerId);
      navigate(`/lobby/${joinGameCode.trim().toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlaying = () => {
    if (!playerName.trim()) {
      setError('Enter your name above');
      return;
    }
    login(playerName);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800">
      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={handleStartPlaying} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
              S
            </div>
            <span className="text-white font-bold text-lg">Scattergories</span>
          </button>

          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-white/80 text-sm hidden sm:block">{playerName}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {(playerName || 'G')[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            Scatter<span className="text-amber-400">gories</span>
          </h1>
          <p className="text-violet-200 text-lg">
            Name, Place, Animal, Thing
          </p>
          <p className="text-violet-300/70 text-sm mt-2">
            Challenge your friends in real-time word association!
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl shadow-black/10">
          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none placeholder-white/30"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-xl text-sm border border-red-500/20">
              {error}
            </div>
          )}

          {/* Create Game Button */}
          <button
            onClick={handleCreate}
            disabled={loading || !playerName.trim()}
            className="w-full mb-3 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-amber-500/30"
          >
            {loading ? 'Creating...' : 'Create New Game'}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-transparent text-violet-300/60">or</span>
            </div>
          </div>

          {/* Join Game */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-1.5 text-center">
              Join Game
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinGameCode}
                onChange={(e) => setJoinGameCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none placeholder-white/30 text-center text-lg tracking-[0.5em] uppercase"
                placeholder="ABC"
                maxLength={3}
              />
              <button
                onClick={handleJoin}
                disabled={loading || !joinGameCode.trim() || !playerName.trim()}
                className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <>
            {/* Login Option */}
            <button
              onClick={handleGoogleLogin}
              className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </>
        )}

        {/* Footer info */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-violet-200/60 text-xs">
          <div>
            <div className="text-amber-400 text-lg font-bold">9</div>
            Rounds
          </div>
          <div>
            <div className="text-amber-400 text-lg font-bold">A–Z</div>
            Letters
          </div>
          <div>
            <div className="text-amber-400 text-lg font-bold">∞</div>
            Fun
          </div>
        </div>
      </div>
    </div>
  );
}
