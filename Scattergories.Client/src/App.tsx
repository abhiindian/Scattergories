import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useNavigate, Navigate } from 'react-router-dom';
import {
  GoogleAuthProviderWrapper,
  AuthProvider,
  useIsAuthenticated,
} from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Rules } from './pages/Rules';
import { Lobby } from './pages/Lobby';
import { GamePage } from './pages/GamePage';
import { Scoreboard } from './pages/Scoreboard';
import { HostRoomConfig } from './pages/HostRoomConfig';
import { Header } from './components/Header';
import { Rankings } from './pages/Rankings';
import { History } from './pages/History';

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

/** Layout wrapper for authenticated routes (provides top header) */
function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-2 pb-6">
        <div className="animate-page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <GoogleAuthProviderWrapper clientId={CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider clientId={CLIENT_ID}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Authenticated routes */}
            <Route element={<AuthGuard />}>
              <Route element={<AuthLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/host" element={<HostRoomConfig />} />
                <Route path="/lobby" element={<Navigate to="/dashboard" replace />} />
                <Route path="/lobby/:code" element={<Lobby />} />
                <Route path="/game/:code" element={<GamePage />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/scoreboard/:code" element={<Scoreboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/rules" element={<Rules />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleAuthProviderWrapper>
  );
}
