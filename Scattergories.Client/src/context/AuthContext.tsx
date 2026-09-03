import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { useGameStore } from '../state/gameStore';
import { useAuthStore, UserAccount } from '../state/authStore';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: UserAccount | null;
  isLoading: boolean;
  login: (playerName: string) => Promise<void>;
  handleGoogleLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
  clientId?: string;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, user, setAuth, logout } = useAuthStore();
  const { setPlayerName, setHubConnected } = useGameStore();
  const navigate = useNavigate();

  const login = async (playerName: string) => {
    setPlayerName(playerName);
    if (!isAuthenticated) {
      localStorage.setItem('playerId', localStorage.getItem('playerId') ?? '');
      setHubConnected(true);
    }
  };

  // Google Sign-In — code flow with PKCE (default)
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Exchange access token for user profile
        const profileResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${response.access_token}` } }
        );
        const profile = await profileResponse.json();

        // Exchange Google access token with our backend
        const { accessToken, user: authUser } = await apiClient.googleAuth(profile.id);
        setAuth(accessToken, authUser);
        navigate('/');
      } catch {
        console.error('Google login failed');
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
    },
    scope: 'openid email profile',
  });

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated,
    user,
    isLoading: false,
    login,
    handleGoogleLogin,
    logout,
  }), [isAuthenticated, user, logout, handleGoogleLogin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Wrapper for Google OAuth
export function GoogleAuthProviderWrapper({ children, clientId }: AuthProviderProps) {
  return (
    <GoogleOAuthProvider clientId={clientId ?? 'GOOGLE_CLIENT_ID'}>
      {children}
    </GoogleOAuthProvider>
  );
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

// Route guards
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return <>{children}</>;
}

export function RedirectAuthenticated({ fallback, children }: { fallback: string; children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate(fallback);
    return null;
  }

  return <>{children}</>;
}
