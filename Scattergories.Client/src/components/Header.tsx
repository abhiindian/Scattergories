import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useIsAuthenticated } from '../context/AuthContext';
import { useGameStore } from '../state/gameStore';
import { GlassAvatar } from './common/GlassAvatar';
import { toast } from 'sonner';

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
      toast.success('Name updated!');
    }
    setEditingName(false);
    setShowMenu(false);
  };

  const handleLogout = () => {
    logout();
    reset();
    setShowMenu(false);
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleHome = () => {
    setShowMenu(false);
    navigate('/');
  };

  // If not authenticated, show minimal header
  if (!isAuthenticated) {
    return null;
  }

  return (
    <header>
      {/* Top Navigation Bar */}
      <nav className="w-full bg-surface-container-lowest border-b border-border-subtle shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={handleHome}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                S
              </div>
              <span className="text-text-primary font-bold text-base hidden sm:block">Scattergories</span>
            </button>

            {/* Nav Links */}
            <div className="flex items-center gap-1 md:gap-2">
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors font-label-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span className="hidden md:inline">Home</span>
              </Link>
              <Link
                to="/lobby"
                className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors font-label-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span className="hidden md:inline">Lobby</span>
              </Link>
              <Link
                to="/scoreboard"
                className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors font-label-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
                <span className="hidden md:inline">Rankings</span>
              </Link>
              <Link
                to="/history"
                className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors font-label-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span className="hidden md:inline">History</span>
              </Link>
              <Link
                to="/rules"
                className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors font-label-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span className="hidden md:inline">Rules</span>
              </Link>
            </div>

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
                className="focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                {user.profileImageUrl ? (
                  <GlassAvatar src={user.profileImageUrl} name={user.name} size="lg" />
                ) : (
                  <GlassAvatar name={user.name} size="lg" gradient="from-violet-400 to-indigo-500" />
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
    </div>
    </nav>
    </header>
  );
}
