import { create } from 'zustand';
import type { GameState as GameDto } from '../api/types';

interface PlayerState {
  playerName: string;
  playerId: string | null;
  gameCode: string | null;
  game: GameDto | null;
  hubConnected: boolean;
  roundTimer: number;
  roundTimerTotal: number;
  isTimerActive: boolean;
}

interface GameStore extends PlayerState {
  setPlayerName: (name: string) => void;
  joinGame: (code: string, playerName: string) => void;
  setGame: (game: GameDto) => void;
  setHubConnected: (connected: boolean) => void;
  setRoundTimer: (seconds: number, total: number, active: boolean) => void;
  reset: () => void;
}

const initialGame: GameDto = {
  id: '',
  code: '',
  gameState: 'Lobby',
  currentRound: null,
  players: [],
  teams: [],
  settings: {
    roundCount: 9,
    timerSeconds: 180,
    pointsPerAnswer: 10,
    allowPlurals: false,
    allowProperNouns: false,
    allowOffensiveWords: false,
  },
  rounds: [],
};

export const useGameStore = create<GameStore>((set) => ({
  playerName: '',
  playerId: null,
  gameCode: null,
  game: initialGame,
  hubConnected: false,
  roundTimer: 0,
  roundTimerTotal: 0,
  isTimerActive: false,

  setPlayerName: (name) => set({ playerName: name }),

  joinGame: (code, playerName) =>
    set({
      gameCode: code,
      playerName,
      game: initialGame,
    }),

  setGame: (game) => set({ game }),

  setHubConnected: (connected) => set({ hubConnected: connected }),

  setRoundTimer: (seconds, total, active) =>
    set({ roundTimer: seconds, roundTimerTotal: total, isTimerActive: active }),

  reset: () =>
    set({
      playerName: '',
      playerId: null,
      gameCode: null,
      game: initialGame,
      hubConnected: false,
      roundTimer: 0,
      roundTimerTotal: 0,
      isTimerActive: false,
    }),
}));
