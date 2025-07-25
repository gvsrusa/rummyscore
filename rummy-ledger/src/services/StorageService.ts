import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Game } from '../types';

// Storage keys
const STORAGE_KEYS = {
  CURRENT_GAME: '@RummyLedger:currentGame',
  GAME_HISTORY: '@RummyLedger:gameHistory',
  RECENT_PLAYERS: '@RummyLedger:recentPlayers',
  SETTINGS: '@RummyLedger:settings',
  APP_STATE: '@RummyLedger:appState',
} as const;

// Error types for better error handling
export class StorageError extends Error {
  constructor(message: string, public readonly operation: string, public readonly cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export class DataCorruptionError extends StorageError {
  constructor(key: string, cause?: Error) {
    super(`Data corruption detected for key: ${key}`, 'validation', cause);
    this.name = 'DataCorruptionError';
  }
}

export class StorageService {
  private static instance: StorageService;

  // Singleton pattern to ensure consistent storage access
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private constructor() {}

  /**
   * Save a game to storage
   */
  async saveGame(game: Game): Promise<void> {
    try {
      const gameData = JSON.stringify(game);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_GAME, gameData);
    } catch (error) {
      throw new StorageError(
        'Failed to save game',
        'saveGame',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Load a specific game by ID
   */
  async loadGame(gameId: string): Promise<Game> {
    try {
      // First check current game
      const currentGameData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
      if (currentGameData) {
        const currentGame = this.parseAndValidateGame(currentGameData);
        if (currentGame.id === gameId) {
          return currentGame;
        }
      }

      // Check game history
      const historyData = await AsyncStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
      if (historyData) {
        const games = this.parseAndValidateGameHistory(historyData);
        const game = games.find(g => g.id === gameId);
        if (game) {
          return game;
        }
      }

      throw new StorageError(`Game with ID ${gameId} not found`, 'loadGame');
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to load game',
        'loadGame',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Load current active game
   */
  async loadCurrentGame(): Promise<Game | null> {
    try {
      const gameData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
      if (!gameData) {
        return null;
      }
      return this.parseAndValidateGame(gameData);
    } catch (error) {
      if (error instanceof DataCorruptionError) {
        // Clear corrupted data and return null
        await this.clearCurrentGame();
        return null;
      }
      throw new StorageError(
        'Failed to load current game',
        'loadCurrentGame',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Clear current game from storage
   */
  async clearCurrentGame(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
    } catch (error) {
      throw new StorageError(
        'Failed to clear current game',
        'clearCurrentGame',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Load game history
   */
  async loadGameHistory(): Promise<Game[]> {
    try {
      const historyData = await AsyncStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
      if (!historyData) {
        return [];
      }
      return this.parseAndValidateGameHistory(historyData);
    } catch (error) {
      if (error instanceof DataCorruptionError) {
        // Clear corrupted data and return empty array
        await this.clearGameHistory();
        return [];
      }
      throw new StorageError(
        'Failed to load game history',
        'loadGameHistory',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Add a completed game to history
   */
  async addGameToHistory(game: Game): Promise<void> {
    try {
      const currentHistory = await this.loadGameHistory();
      const updatedHistory = [game, ...currentHistory];
      
      // Keep only the most recent 100 games to prevent storage bloat
      const trimmedHistory = updatedHistory.slice(0, 100);
      
      const historyData = JSON.stringify(trimmedHistory);
      await AsyncStorage.setItem(STORAGE_KEYS.GAME_HISTORY, historyData);
    } catch (error) {
      throw new StorageError(
        'Failed to add game to history',
        'addGameToHistory',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Clear game history
   */
  async clearGameHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
    } catch (error) {
      throw new StorageError(
        'Failed to clear game history',
        'clearGameHistory',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Save player names to recent players list
   */
  async savePlayerHistory(players: string[]): Promise<void> {
    try {
      const currentPlayers = await this.loadRecentPlayers();
      
      // Add new players to the beginning, remove duplicates
      const uniquePlayers = Array.from(new Set([...players, ...currentPlayers]));
      
      // Keep only the most recent 50 players
      const trimmedPlayers = uniquePlayers.slice(0, 50);
      
      const playersData = JSON.stringify(trimmedPlayers);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_PLAYERS, playersData);
    } catch (error) {
      throw new StorageError(
        'Failed to save player history',
        'savePlayerHistory',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Load recent players list
   */
  async loadRecentPlayers(): Promise<string[]> {
    try {
      const playersData = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_PLAYERS);
      if (!playersData) {
        return [];
      }
      
      const players = JSON.parse(playersData);
      if (!Array.isArray(players) || !players.every(p => typeof p === 'string')) {
        throw new DataCorruptionError(STORAGE_KEYS.RECENT_PLAYERS);
      }
      
      return players;
    } catch (error) {
      if (error instanceof DataCorruptionError || error instanceof SyntaxError) {
        // Clear corrupted data and return empty array
        await this.clearRecentPlayers();
        return [];
      }
      throw new StorageError(
        'Failed to load recent players',
        'loadRecentPlayers',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Clear recent players list
   */
  async clearRecentPlayers(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_PLAYERS);
    } catch (error) {
      throw new StorageError(
        'Failed to clear recent players',
        'clearRecentPlayers',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Clear all storage data (useful for testing and reset)
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.clearCurrentGame(),
        this.clearGameHistory(),
        this.clearRecentPlayers(),
      ]);
    } catch (error) {
      throw new StorageError(
        'Failed to clear all data',
        'clearAllData',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Parse and validate game data
   */
  private parseAndValidateGame(gameData: string): Game {
    try {
      const game = JSON.parse(gameData);
      
      // Basic validation
      if (!this.isValidGame(game)) {
        throw new DataCorruptionError('game');
      }
      
      // Convert date strings back to Date objects
      return {
        ...game,
        createdAt: new Date(game.createdAt),
        completedAt: game.completedAt ? new Date(game.completedAt) : undefined,
        rounds: game.rounds.map((round: any) => ({
          ...round,
          timestamp: new Date(round.timestamp),
        })),
      };
    } catch (error) {
      if (error instanceof DataCorruptionError || error instanceof SyntaxError) {
        throw new DataCorruptionError('game', error instanceof Error ? error : new Error(String(error)));
      }
      throw new DataCorruptionError('game', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Parse and validate game history data
   */
  private parseAndValidateGameHistory(historyData: string): Game[] {
    try {
      const games = JSON.parse(historyData);
      
      if (!Array.isArray(games)) {
        throw new DataCorruptionError(STORAGE_KEYS.GAME_HISTORY);
      }
      
      return games.map(game => {
        if (!this.isValidGame(game)) {
          throw new DataCorruptionError(STORAGE_KEYS.GAME_HISTORY);
        }
        
        return {
          ...game,
          createdAt: new Date(game.createdAt),
          completedAt: game.completedAt ? new Date(game.completedAt) : undefined,
          rounds: game.rounds.map((round: any) => ({
            ...round,
            timestamp: new Date(round.timestamp),
          })),
        };
      });
    } catch (error) {
      if (error instanceof DataCorruptionError || error instanceof SyntaxError) {
        throw new DataCorruptionError(STORAGE_KEYS.GAME_HISTORY, error instanceof Error ? error : new Error(String(error)));
      }
      throw new DataCorruptionError(STORAGE_KEYS.GAME_HISTORY, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Validate game object structure
   */
  private isValidGame(game: any): game is Game {
    return (
      game &&
      typeof game.id === 'string' &&
      Array.isArray(game.players) &&
      Array.isArray(game.rounds) &&
      (game.status === 'active' || game.status === 'completed') &&
      game.createdAt &&
      game.players.every((player: any) => this.isValidPlayer(player)) &&
      game.rounds.every((round: any) => this.isValidRound(round))
    );
  }

  /**
   * Validate player object structure
   */
  private isValidPlayer(player: any): player is Game['players'][0] {
    return (
      player &&
      typeof player.id === 'string' &&
      typeof player.name === 'string' &&
      typeof player.totalScore === 'number' &&
      typeof player.isLeader === 'boolean'
    );
  }

  /**
   * Validate round object structure
   */
  private isValidRound(round: any): round is Game['rounds'][0] {
    return (
      round &&
      typeof round.id === 'string' &&
      typeof round.roundNumber === 'number' &&
      Array.isArray(round.scores) &&
      round.timestamp &&
      round.scores.every((score: any) => 
        score &&
        typeof score.playerId === 'string' &&
        typeof score.score === 'number' &&
        typeof score.isRummy === 'boolean'
      )
    );
  }

  /**
   * Save generic data to storage
   */
  async saveData(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
      throw new StorageError(
        `Failed to save data for key: ${key}`,
        'saveData',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Load generic data from storage
   */
  async loadData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      throw new StorageError(
        `Failed to load data for key: ${key}`,
        'loadData',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Save current game (alias for compatibility)
   */
  async saveCurrentGame(game: Game): Promise<void> {
    return this.saveGame(game);
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();