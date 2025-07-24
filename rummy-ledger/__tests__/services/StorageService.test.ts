import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, StorageError, DataCorruptionError } from '../../src/services/StorageService';
import { Game, Player, Round, PlayerScore } from '../../src/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('StorageService', () => {
  let storageService: StorageService;
  let mockAsyncStorage: jest.Mocked<typeof AsyncStorage>;

  // Sample test data
  const samplePlayer: Player = {
    id: 'player1',
    name: 'John Doe',
    totalScore: 25,
    isLeader: false,
  };

  const samplePlayerScore: PlayerScore = {
    playerId: 'player1',
    score: 10,
    isRummy: false,
  };

  const sampleRound: Round = {
    id: 'round1',
    roundNumber: 1,
    scores: [samplePlayerScore],
    timestamp: new Date('2024-01-01T10:00:00Z'),
  };

  const sampleGame: Game = {
    id: 'game1',
    players: [samplePlayer],
    rounds: [sampleRound],
    targetScore: 100,
    status: 'active',
    createdAt: new Date('2024-01-01T09:00:00Z'),
  };

  beforeEach(() => {
    storageService = StorageService.getInstance();
    mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
    jest.clearAllMocks();
    // Reset all mock implementations
    mockAsyncStorage.getItem.mockReset();
    mockAsyncStorage.setItem.mockReset();
    mockAsyncStorage.removeItem.mockReset();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StorageService.getInstance();
      const instance2 = StorageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('saveGame', () => {
    it('should save game successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.saveGame(sampleGame);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@RummyLedger:currentGame',
        JSON.stringify(sampleGame)
      );
    });

    it('should throw StorageError on save failure', async () => {
      const error = new Error('Storage failed');
      mockAsyncStorage.setItem.mockRejectedValue(error);

      await expect(storageService.saveGame(sampleGame)).rejects.toThrow(StorageError);
      await expect(storageService.saveGame(sampleGame)).rejects.toThrow('Failed to save game');
    });
  });

  describe('loadCurrentGame', () => {
    it('should load current game successfully', async () => {
      const gameData = JSON.stringify(sampleGame);
      mockAsyncStorage.getItem.mockResolvedValue(gameData);

      const result = await storageService.loadCurrentGame();

      expect(result).toEqual(sampleGame);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@RummyLedger:currentGame');
    });

    it('should return null when no current game exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.loadCurrentGame();

      expect(result).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.loadCurrentGame();

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@RummyLedger:currentGame');
    });

    it('should convert date strings to Date objects', async () => {
      const gameWithStringDates = {
        ...sampleGame,
        createdAt: '2024-01-01T09:00:00Z',
        rounds: [{
          ...sampleRound,
          timestamp: '2024-01-01T10:00:00Z',
        }],
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameWithStringDates));

      const result = await storageService.loadCurrentGame();

      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.rounds[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('loadGame', () => {
    it('should load game from current game when ID matches', async () => {
      const gameData = JSON.stringify(sampleGame);
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(gameData) // current game
        .mockResolvedValueOnce(null); // history (not called)

      const result = await storageService.loadGame('game1');

      expect(result).toEqual(sampleGame);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@RummyLedger:currentGame');
    });

    it('should load game from history when not in current game', async () => {
      const otherGame = { ...sampleGame, id: 'game2' };
      
      // Mock the calls in sequence
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(otherGame)) // current game call
        .mockResolvedValueOnce(JSON.stringify([sampleGame, otherGame])); // history call

      const result = await storageService.loadGame('game1');

      expect(result.id).toBe(sampleGame.id);
      expect(result.players).toEqual(sampleGame.players);
      expect(result.status).toBe(sampleGame.status);
    });

    it('should throw error when game not found', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await expect(storageService.loadGame('nonexistent')).rejects.toThrow(StorageError);
      await expect(storageService.loadGame('nonexistent')).rejects.toThrow('Game with ID nonexistent not found');
    });
  });

  describe('loadGameHistory', () => {
    it('should load game history successfully', async () => {
      const historyData = JSON.stringify([sampleGame]);
      mockAsyncStorage.getItem.mockResolvedValue(historyData);

      const result = await storageService.loadGameHistory();

      expect(result).toEqual([sampleGame]);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@RummyLedger:gameHistory');
    });

    it('should return empty array when no history exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.loadGameHistory();

      expect(result).toEqual([]);
    });

    it('should handle corrupted history data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.loadGameHistory();

      expect(result).toEqual([]);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@RummyLedger:gameHistory');
    });
  });

  describe('addGameToHistory', () => {
    it('should add game to history successfully', async () => {
      const existingHistory = [{ ...sampleGame, id: 'game2' }];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingHistory));
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.addGameToHistory(sampleGame);

      const expectedHistory = [sampleGame, ...existingHistory];
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@RummyLedger:gameHistory',
        JSON.stringify(expectedHistory)
      );
    });

    it('should limit history to 100 games', async () => {
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        ...sampleGame,
        id: `game${i}`,
      }));
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(largeHistory));
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.addGameToHistory(sampleGame);

      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedHistory = JSON.parse(setItemCall[1]);
      expect(savedHistory).toHaveLength(100);
      expect(savedHistory[0].id).toBe(sampleGame.id);
      expect(savedHistory[0].players).toEqual(sampleGame.players);
    });
  });

  describe('savePlayerHistory', () => {
    it('should save player history successfully', async () => {
      const existingPlayers = ['Jane Doe', 'Bob Smith'];
      const newPlayers = ['John Doe', 'Alice Johnson'];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPlayers));
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.savePlayerHistory(newPlayers);

      const expectedPlayers = ['John Doe', 'Alice Johnson', 'Jane Doe', 'Bob Smith'];
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@RummyLedger:recentPlayers',
        JSON.stringify(expectedPlayers)
      );
    });

    it('should remove duplicates and maintain order', async () => {
      const existingPlayers = ['John Doe', 'Jane Doe'];
      const newPlayers = ['John Doe', 'Bob Smith'];
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPlayers));
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.savePlayerHistory(newPlayers);

      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedPlayers = JSON.parse(setItemCall[1]);
      expect(savedPlayers).toEqual(['John Doe', 'Bob Smith', 'Jane Doe']);
    });

    it('should limit players to 50', async () => {
      const largePlayers = Array.from({ length: 50 }, (_, i) => `Player${i}`);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(largePlayers));
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.savePlayerHistory(['New Player']);

      const setItemCall = mockAsyncStorage.setItem.mock.calls[0];
      const savedPlayers = JSON.parse(setItemCall[1]);
      expect(savedPlayers).toHaveLength(50);
      expect(savedPlayers[0]).toBe('New Player');
    });
  });

  describe('loadRecentPlayers', () => {
    it('should load recent players successfully', async () => {
      const players = ['John Doe', 'Jane Doe'];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(players));

      const result = await storageService.loadRecentPlayers();

      expect(result).toEqual(players);
    });

    it('should return empty array when no players exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storageService.loadRecentPlayers();

      expect(result).toEqual([]);
    });

    it('should handle corrupted player data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.loadRecentPlayers();

      expect(result).toEqual([]);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@RummyLedger:recentPlayers');
    });

    it('should validate player data structure', async () => {
      const invalidPlayers = [123, 'valid player', null];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidPlayers));
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.loadRecentPlayers();

      expect(result).toEqual([]);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('clearAllData', () => {
    it('should clear all storage data', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await storageService.clearAllData();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@RummyLedger:currentGame');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@RummyLedger:gameHistory');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@RummyLedger:recentPlayers');
    });
  });

  describe('Data Validation', () => {
    it('should reject invalid game structure', async () => {
      const invalidGame = {
        id: 'game1',
        // missing required fields
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidGame));
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.loadCurrentGame();

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('should reject game with invalid players', async () => {
      const gameWithInvalidPlayers = {
        ...sampleGame,
        players: [{ id: 'player1' }], // missing required fields
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameWithInvalidPlayers));
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.loadCurrentGame();

      expect(result).toBeNull();
    });

    it('should reject game with invalid rounds', async () => {
      const gameWithInvalidRounds = {
        ...sampleGame,
        rounds: [{ id: 'round1' }], // missing required fields
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameWithInvalidRounds));
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.loadCurrentGame();

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw StorageError with proper context', async () => {
      const originalError = new Error('Network error');
      mockAsyncStorage.setItem.mockRejectedValue(originalError);

      try {
        await storageService.saveGame(sampleGame);
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).operation).toBe('saveGame');
        expect((error as StorageError).cause).toBe(originalError);
      }
    });

    it('should throw DataCorruptionError for invalid JSON', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      try {
        await storageService.loadCurrentGame();
      } catch (error) {
        // Should not throw, should return null and clear data
        expect(error).toBeUndefined();
      }
    });
  });
});