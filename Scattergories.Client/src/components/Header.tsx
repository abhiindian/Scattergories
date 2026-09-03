import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useIsAuthenticated } from '../context/AuthContext';
import { useGameStore } from '../state/gameStore';

export function Header() {
  const { user, logout } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const { playerName, setPlayerName, reset } = useGameStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setEditingName(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleNameSave = () => {
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
    }
    setEditingName(false);
    setShowMenu(false);
  };

  const handleLogout = () => {
    logout();
    reset();
    setShowMenu(false);
    navigate('/');
  };

  const handleHome = () => {
    setShowMenu(false);
    navigate('/');
  };

  // If not authenticated, show minimal header
  if (!isAuthenticated) {
    return (
      <header className="w-full bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
          <button
            onClick={handleHome}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
              S
            </div>
            <span className="text-white font-bold text-lg">Scattergories</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white/10 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={handleHome}
          className="flex items-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
            S
          </div>
          <span className="text-white font-bold text-lg hidden sm:block">Scattergories</span>
        </button>

        {/* Right side: Player info & menu */}
        <div className="flex items-center gap-3" ref={menuRef}>
          {/* Player Name */}
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  className="w-28 px-2 py-1 bg-white/20 text-white rounded-md text-sm outline-none border border-white/30 focus:border-amber-400 placeholder-white/40"
                  autoFocus
                  maxLength={20}
                  placeholder="Your name"
                  defaultValue={playerName}
                />
              </div>
            ) : (
              <button
                onClick={() => { setTempName(playerName || user?.name || ''); setEditingName(true); }}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-white/10"
              >
                {playerName || user?.name || 'Player'}
              </button>
            )}
          </div>

          {/* Avatar */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 hover:border-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setTempName(playerName || user.name);
                      setEditingName(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="w-4 text-center">✏️</span> Change Name
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                  >
                    <span className="w-4 text-center">🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
