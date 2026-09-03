export type GameStateValue = 'Lobby' | 'RoundRunning' | 'Answering' | 'Revealing' | 'Finished';

export interface GameState {
  id: string;
  code: string;
  gameState: GameStateValue;
  currentRound: RoundDto | null;
  players: PlayerDto[];
  teams: TeamDto[];
  settings: GameSettingsDto;
  rounds: RoundDto[];
}

export interface RoundDto {
  id: string;
  roundNumber: number;
  letter: string;
  state: string;
  categories: CategoryDto[];
  answers: ScoredAnswerDto[];
}

export interface PlayerDto {
  id: string;
  name: string;
  teamId: string | null;
  isHost: boolean;
  totalScore: number;
  team?: string;
}

export interface TeamDto {
  id: string;
  name: string;
  teamScore: number;
}

export interface GameSettingsDto {
  roundCount: number;
  timerSeconds: number;
  pointsPerAnswer: number;
  allowPlurals: boolean;
  allowProperNouns: boolean;
  allowOffensiveWords: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  displayOrder: number;
}

export interface ScoredAnswerDto {
  answerId: string;
  playerId: string;
  playerName: string;
  teamId: string | null;
  teamName: string | null;
  categoryId: string;
  categoryName: string;
  text: string;
  isValid: boolean;
  isUnique: boolean;
  points: number | null;
}

export interface BeginRoundResult {
  roundNumber: number;
  letter: string;
  timerSeconds: number;
  categories: CategoryDto[];
}

export interface RevealAndScoreResult {
  roundId: string;
  roundNumber: number;
  letter: string;
  scores: ScoredAnswerDto[];
}

export interface EndGameResult {
  standings: FinalScoreDto[];
  winnerName: string;
}

export interface FinalScoreDto {
  id: string;
  name: string;
  isTeam: boolean;
  totalScore: number;
}

export interface SubmitAnswer {
  categoryId: string;
  text: string;
}
