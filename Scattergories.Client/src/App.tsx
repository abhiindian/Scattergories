import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import {
  GoogleAuthProviderWrapper,
  AuthProvider,
  useIsAuthenticated,
} from './context/AuthContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Lobby } from './pages/Lobby';
import { GamePage } from './pages/GamePage';
import { Scoreboard } from './pages/Scoreboard';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID';

/** Layout wrapper for authenticated routes (provides Header) */
function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-800">
      <Header />
      <div className="pt-1 pb-4">
        <Outlet />
      </div>
    </div>
  );
}

/** Route guard: redirect to /login if not authenticated */
function AuthGuard() {
  const isAuthenticated = useIsAuthenticated();
  if (!isAuthenticated) return <Login />;
  return <AuthProvider clientId={CLIENT_ID}><AuthLayout /></AuthProvider>;
}

export function App() {
  return (
    <GoogleAuthProviderWrapper clientId={CLIENT_ID}>
      <HashRouter>
        <Routes>
          {/* Login page — redirect to home if already authenticated */}
          <Route
            path="/login"
            element={
              useIsAuthenticated() ? <Home /> : <Login />
            }
          />

          {/* Protected routes */}
          <Route path="/" element={<AuthGuard />}>
            <Route index element={<Home />} />
            <Route path="/lobby/:code" element={<Lobby />} />
            <Route path="/game/:code" element={<GamePage />} />
            <Route path="/scoreboard/:code" element={<Scoreboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </HashRouter>
    </GoogleAuthProviderWrapper>
  );
}
