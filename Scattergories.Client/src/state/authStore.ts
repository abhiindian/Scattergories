import { create } from 'zustand';

export interface UserAccount {
  id: string;
  googleId: string;
  email: string;
  name: string;
  profileImageUrl?: string;
}

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserAccount;
}

/**
 * Decodes the JWT payload and checks whether the token has expired.
 * Returns true only if the token exists AND its `exp` claim is in the future.
 */
function isJwtValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // base64url decode (replace URL-safe chars, then add padding)
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), '=');

    const decoded = JSON.parse(atob(payload));
    if (!decoded?.exp) return true; // no exp claim — treat as valid (legacy tokens)

    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

interface AuthState {
  token: string | null;
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (token: string, user: UserAccount) => void;
  updateUser: (name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('authToken'),
  user: (() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  })(),
  isAuthenticated: (() => {
    const token = localStorage.getItem('authToken');
    return !!token && isJwtValid(token);
  })(),
  isLoading: false,

  setAuth: (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  updateUser: (name) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, name };
      localStorage.setItem('authUser', JSON.stringify(updated));
      return { user: updated, isAuthenticated: true };
    });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('playerId');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
