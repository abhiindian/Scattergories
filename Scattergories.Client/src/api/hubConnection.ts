import * as signalR from '@microsoft/signalr';
import type {
  GameState,
  CategoryDto,
  ScoredAnswerDto,
} from './types';

const HUB_URL = '/hubs/game';

// Typed callbacks
type GameUpdatedHandler = (state: GameState) => void;
type RoundStartedHandler = (data: { letter: string; timerSeconds: number; categories: CategoryDto[] }) => void;
type TimerTickHandler = (data: { remaining: number; total: number }) => void;
type TimeUpHandler = () => void;
type AnswersRevealedHandler = (data: { roundCategories: CategoryDto[]; scoredAnswers: ScoredAnswerDto[] }) => void;
type RoundCompleteHandler = () => void;
type GameFinishedHandler = () => void;
type ErrorHandler = (error: string) => void;

let connection: signalR.HubConnection | null = null;

export const hubConnection = {
  async start(
    gameCode: string,
    playerName: string,
    playerId?: string,
    token?: string,
  ): Promise<void> {
    if (connection) {
      try { await connection.stop(); } catch { /* ignore */ }
    }

    const builder = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token ?? '',
      })
      .withAutomaticReconnect()
      .build();

    const conn = builder; // capture for callbacks within start

    // --- Event handlers ---
    conn.on('LobbyUpdated', (state: GameState) => {
      _handlers.onGameUpdated!(state);
    });

    conn.on('RoundStarted', (data: { letter: string; timerSeconds: number; categories: CategoryDto[] }) => {
      _handlers.onRoundStarted!(data);
    });

    conn.on('TimerTick', (data: { remaining: number; total: number }) => {
      _handlers.onTimerTick!(data);
    });

    conn.on('TimeUp', () => {
      _handlers.onTimeUp!();
    });

    conn.on('AnswersRevealed', (data: { roundCategories: CategoryDto[]; scoredAnswers: ScoredAnswerDto[] }) => {
      _handlers.onAnswersRevealed!(data);
    });

    conn.on('RoundComplete', () => {
      _handlers.onRoundComplete!();
    });

    conn.on('GameFinished', () => {
      _handlers.onGameFinished!();
    });

    conn.on('PlayerError', (error: string) => {
      _handlers.onError!(error);
    });

    conn.onreconnecting(() => {
      console.warn('SignalR reconnecting...');
    });

    conn.onreconnected(() => {
      // Re-join the game group after reconnect
      connection?.invoke('JoinGameRoom', gameCode, playerName, playerId)
        .catch(err => console.error('Re-join failed:', err));
    });

    connection = conn;

    await connection.start();

    // Join the game room group
    await connection.invoke('JoinGameRoom', gameCode, playerName, playerId)
      .catch(err => console.error('Failed to join game room:', err));
  },

  async submitAnswers(
    gameCode: string,
    answers: Array<{ categoryId: string; text: string }>,
  ): Promise<void> {
    await connection?.invoke('SubmitAnswers', gameCode, answers);
  },

  async stop(): Promise<void> {
    if (connection) {
      try { await connection.stop(); } catch { /* ignore */ }
      connection = null;
    }
  },

  // --- Subscribe to events ---
  onGameUpdated: (handler: GameUpdatedHandler) => register('LobbyUpdated', handler),
  onRoundStarted: (handler: RoundStartedHandler) => register('RoundStarted', handler),
  onTimerTick: (handler: TimerTickHandler) => register('TimerTick', handler),
  onTimeUp: (handler: TimeUpHandler) => register('TimeUp', handler),
  onAnswersRevealed: (handler: AnswersRevealedHandler) => register('AnswersRevealed', handler),
  onRoundComplete: (handler: RoundCompleteHandler) => register('RoundComplete', handler),
  onGameFinished: (handler: GameFinishedHandler) => register('GameFinished', handler),
  onError: (handler: ErrorHandler) => register('PlayerError', handler),
};

// --- Internal handler registry ---
const _handlers: {
  onGameUpdated: GameUpdatedHandler | null;
  onRoundStarted: RoundStartedHandler | null;
  onTimerTick: TimerTickHandler | null;
  onTimeUp: TimeUpHandler | null;
  onAnswersRevealed: AnswersRevealedHandler | null;
  onRoundComplete: RoundCompleteHandler | null;
  onGameFinished: GameFinishedHandler | null;
  onError: ErrorHandler | null;
} = {
  onGameUpdated: null,
  onRoundStarted: null,
  onTimerTick: null,
  onTimeUp: null,
  onAnswersRevealed: null,
  onRoundComplete: null,
  onGameFinished: null,
  onError: null,
};

function register<T extends string, H>(
  eventName: T,
  handler: H,
): void {
  switch (eventName) {
    case 'LobbyUpdated':
      _handlers.onGameUpdated = handler as GameUpdatedHandler;
      break;
    case 'RoundStarted':
      _handlers.onRoundStarted = handler as RoundStartedHandler;
      break;
    case 'TimerTick':
      _handlers.onTimerTick = handler as TimerTickHandler;
      break;
    case 'TimeUp':
      _handlers.onTimeUp = handler as TimeUpHandler;
      break;
    case 'AnswersRevealed':
      _handlers.onAnswersRevealed = handler as AnswersRevealedHandler;
      break;
    case 'RoundComplete':
      _handlers.onRoundComplete = handler as RoundCompleteHandler;
      break;
    case 'GameFinished':
      _handlers.onGameFinished = handler as GameFinishedHandler;
      break;
    case 'PlayerError':
      _handlers.onError = handler as ErrorHandler;
      break;
  }
}
