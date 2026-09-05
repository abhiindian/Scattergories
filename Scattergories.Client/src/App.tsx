import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  GoogleAuthProviderWrapper,
  AuthProvider,
  useIsAuthenticated,
} from './context/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Rules } from './pages/Rules';
import { Lobby } from './pages/Lobby';
import { GamePage } from './pages/GamePage';
import { Scoreboard } from './pages/Scoreboard';
import { HostRoomConfig } from './pages/HostRoomConfig';
import { Header } from './components/Header';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID';

/** AuthGuard: redirect to Login if not authenticated */
function AuthGuard() {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}

/** Layout wrapper for authenticated routes (provides top header + bottom nav) */
function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-2 pb-20">
        <div className="animate-page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

/** Bottom Navigation Bar */
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: 'home', label: 'Home', path: '/' },
    { icon: 'group', label: 'Lobby', path: '/lobby' },
    { icon: 'emoji_events', label: 'Rankings', path: '/scoreboard' },
    { icon: 'history', label: 'History', path: '/history' },
    { icon: 'menu_book', label: 'Rules', path: '/rules' },
  ];

  const isActivePath = (itemPath: string) => {
    if (itemPath === '/') return location.pathname === '/';
    if (itemPath === '/lobby') return location.pathname.startsWith('/lobby');
    if (itemPath === '/scoreboard') return location.pathname.startsWith('/scoreboard');
    if (itemPath === '/history') return location.pathname === '/history';
    if (itemPath === '/rules') return location.pathname === '/rules';
    return location.pathname === itemPath;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-border-subtle shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div className="max-w-md md:max-w-4xl lg:max-w-[1120px] mx-auto flex items-center justify-around md:justify-center md:gap-16 px-2 py-1 md:py-2">
        {navItems.map(item => {
          const isActive = isActivePath(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 md:px-6 py-1.5 rounded-lg transition-colors min-w-0 ${
                isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
              type="button"
            >
              <span className={`material-symbols-outlined text-[22px] md:text-[26px] ${isActive ? '' : ''}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className={`font-label-caps text-[9px] md:text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary mt-0.5"></div>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Main layout replacing AuthGuard to allow guests */
function MainLayout() {
  return (
    <>
      <AuthLayout />
      <BottomNav />
    </>
  );
}

export function App() {
  return (
    <GoogleAuthProviderWrapper clientId={CLIENT_ID}>
      <HashRouter>
        <AuthProvider clientId={CLIENT_ID}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated routes */}
            <Route element={<AuthGuard />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="/host" element={<HostRoomConfig />} />
                <Route path="/lobby" element={<Navigate to="/" replace />} />
                <Route path="/lobby/:code" element={<Lobby />} />
                <Route path="/game/:code" element={<GamePage />} />
                <Route path="/scoreboard" element={<Navigate to="/" replace />} />
                <Route path="/scoreboard/:code" element={<Scoreboard />} />
                <Route path="/history" element={<Home />} />
                <Route path="/rules" element={<Rules />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </GoogleAuthProviderWrapper>
  );
}
