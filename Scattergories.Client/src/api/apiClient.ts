const API_BASE = '/api';

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `HTTP ${response.status}`);
  }
  return text ? JSON.parse(text) : ({} as T);
}

export const apiClient = {
  createGame: async (data: {
    roundCount?: number;
    timerSeconds?: number;
    pointsPerAnswer?: number;
    allowPlurals?: boolean;
    allowProperNouns?: boolean;
    allowOffensiveWords?: boolean;
  }) => {
    const res = await request<{ code: string }>('/games', { method: 'POST', body: JSON.stringify(data) });
    return res.code;
  },

  updateGameConfig: (code: string, data: {
    roundCount?: number;
    timerSeconds?: number;
    pointsPerAnswer?: number;
    allowPlurals?: boolean;
    allowProperNouns?: boolean;
    allowOffensiveWords?: boolean;
  }) =>
    request<void>(`/games/${code}/config`, { method: 'PUT', body: JSON.stringify(data) }),

  joinGame: (code: string, playerName: string) =>
    request<{ playerId: string }>(`/games/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  getGame: (code: string) =>
    request<import('./types').GameState>(`/games/${code}`),

  startGame: (code: string) =>
    request<void>(`/games/${code}/start`, { method: 'POST' }),

  submitAnswers: (code: string, roundId: string, answers: Array<{ categoryId: string; text: string }>) =>
    request<void>(`/games/${code}/answers`, {
      method: 'POST',
      body: JSON.stringify({ roundId, answers }),
    }),

  revealAndScore: (code: string) =>
    request<import('./types').RevealAndScoreResult>(`/games/${code}/reveal`, { method: 'POST' }),

  nextRound: (code: string) =>
    request<void>(`/games/${code}/next-round`, { method: 'POST' }),

  endGame: (code: string) =>
    request<import('./types').EndGameResult>(`/games/${code}/end`, { method: 'POST' }),

  // Auth methods
  googleAuth: (idToken: string) =>
    request<import('../state/authStore').AuthToken>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  getCurrentUser: () =>
    request<{
      id: string;
      googleId: string;
      email: string;
      name: string;
      profileImageUrl?: string;
    }>('/auth/me'),

  joinGameAuth: (code: string, playerName?: string) =>
    request<{ playerId: string }>(`/games/${code}/join/auth`, {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),
};
