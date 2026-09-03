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
  isAuthenticated: !!localStorage.getItem('authToken'),
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
