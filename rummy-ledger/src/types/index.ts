// Core game types
export interface Player {
  id: string;
  name: string;
  totalScore: number;
  isLeader: boolean;
}

export interface PlayerScore {
  playerId: string;
  score: number;
  isRummy: boolean;
}

export interface Round {
  id: string;
  roundNumber: number;
  scores: PlayerScore[];
  timestamp: Date;
}

export interface Game {
  id: string;
  players: Player[];
  rounds: Round[];
  targetScore?: number;
  status: 'active' | 'completed';
  winner?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Service interfaces
export interface GameService {
  createGame(players: string[], targetScore?: number): Game;
  addRound(gameId: string, scores: PlayerScore[]): Game;
  editRound(gameId: string, roundId: string, scores: PlayerScore[]): Game;
  deleteRound(gameId: string, roundId: string): Game;
  calculateLeaderboard(game: Game): Player[];
  checkGameEnd(game: Game): boolean;
}

export interface StorageService {
  saveGame(game: Game): Promise<void>;
  loadGame(gameId: string): Promise<Game>;
  loadCurrentGame(): Promise<Game | null>;
  clearCurrentGame(): Promise<void>;
  loadGameHistory(): Promise<Game[]>;
  addGameToHistory(game: Game): Promise<void>;
  clearGameHistory(): Promise<void>;
  savePlayerHistory(players: string[]): Promise<void>;
  loadRecentPlayers(): Promise<string[]>;
  clearRecentPlayers(): Promise<void>;
  clearAllData(): Promise<void>;
}

// Context types
export interface GameContextType {
  currentGame: Game | null;
  gameHistory: Game[];
  recentPlayers: string[];
  loading: boolean;
  error: string | null;
  createGame: (players: string[], targetScore?: number) => void;
  addRound: (scores: PlayerScore[]) => void;
  editRound: (roundId: string, scores: PlayerScore[]) => void;
  deleteRound: (roundId: string) => void;
  endGame: () => void;
  clearError: () => void;
}
