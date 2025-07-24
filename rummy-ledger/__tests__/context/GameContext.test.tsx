import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { GameProvider, useGame } from '../../src/context/GameContext';
import { storageService } from '../../src/services/StorageService';
import { Game, Player, PlayerScore } from '../../src/types';
import * as gameUtils from '../../src/models/gameUtils';

// Mock the storage service
jest.mock('../../src/services/StorageService');
const mockStorageService = storageService as jest.Mocked<typeof storageService>;

// Mock game utils
jest.mock('../../src/models/gameUtils');
const mockGameUtils = gameUtils as jest.Mocked<typeof gameUtils>;

// Mock data
const mockPlayer1: Player = {
  id: 'player1',
  name: 'Alice',
  totalScore: 0,
  isLeader: false,
};

const mockPlayer2: Player = {
  id: 'player2',
  name: 'Bob',
  totalScore: 0,
  isLeader: false,
};

const mockGame: Game = {
  id: 'game1',
  players: [mockPlayer1, mockPlayer2],
  rounds: [],
  targetScore: 100,
  status: 'active',
  createdAt: new Date('2023-01-01'),
};

const mockCompletedGame: Game = {
  ...mockGame,
  status: 'completed',
  completedAt: new Date('2023-01-02'),
  winner: 'player1',
};

const mockPlayerScores: PlayerScore[] = [
  { playerId: 'player1', score: 10, isRummy: false },
  { playerId: 'player2', score: 15, isRummy: false },
];

// Test wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

describe('GameContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockStorageService.loadCurrentGame.mockResolvedValue(null);
    mockStorageService.loadGameHistory.mockResolvedValue([]);
    mockStorageService.loadRecentPlayers.mockResolvedValue([]);
    mockStorageService.saveGame.mockResolvedValue();
    mockStorageService.savePlayerHistory.mockResolvedValue();
    mockStorageService.addGameToHistory.mockResolvedValue();
    mockStorageService.clearCurrentGame.mockResolvedValue();
    
    mockGameUtils.createGame.mockReturnValue(mockGame);
    mockGameUtils.addRoundToGame.mockReturnValue(mockGame);
    mockGameUtils.editRoundInGame.mockReturnValue(mockGame);
    mockGameUtils.deleteRoundFromGame.mockReturnValue(mockGame);
  });

  describe('useGame hook', () => {
    it('should throw error when used outside GameProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useGame());
      }).toThrow('useGame must be used within a GameProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide context value when used within GameProvider', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      expect(result.current).toMatchObject({
        currentGame: null,
        gameHistory: [],
        recentPlayers: [],
        loading: expect.any(Boolean),
        error: null,
        createGame: expect.any(Function),
        addRound: expect.any(Function),
        editRound: expect.any(Function),
        deleteRound: expect.any(Function),
        endGame: expect.any(Function),
        clearError: expect.any(Function),
      });
    });
  });

  describe('initial data loading', () => {
    it('should load initial data on mount', async () => {
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);
      mockStorageService.loadGameHistory.mockResolvedValue([mockCompletedGame]);
      mockStorageService.loadRecentPlayers.mockResolvedValue(['Alice', 'Bob']);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentGame).toEqual(mockGame);
      expect(result.current.gameHistory).toEqual([mockCompletedGame]);
      expect(result.current.recentPlayers).toEqual(['Alice', 'Bob']);
    });

    it('should handle loading errors', async () => {
      const error = new Error('Storage error');
      mockStorageService.loadCurrentGame.mockRejectedValue(error);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Storage error');
    });
  });

  describe('createGame', () => {
    it('should create a new game successfully', async () => {
      mockStorageService.loadRecentPlayers.mockResolvedValue(['Alice', 'Bob', 'Charlie']);
      
      const { result } = renderHook(() => useGame(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createGame(['Alice', 'Bob'], 100);
      });

      await waitFor(() => {
        expect(result.current.currentGame).toEqual(mockGame);
      });

      expect(mockGameUtils.createGame).toHaveBeenCalledWith(['Alice', 'Bob'], 100);
      expect(mockStorageService.savePlayerHistory).toHaveBeenCalledWith(['Alice', 'Bob']);
      expect(result.current.recentPlayers).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should handle create game errors', async () => {
      const error = new Error('Create game error');
      mockGameUtils.createGame.mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useGame(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createGame(['Alice', 'Bob']);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Create game error');
      });

      expect(result.current.currentGame).toBeNull();
    });
  });

  describe('addRound', () => {
    it('should add a round successfully', async () => {
      const updatedGame = { ...mockGame, rounds: [{ id: 'round1', roundNumber: 1, scores: mockPlayerScores, timestamp: new Date() }] };
      mockGameUtils.addRoundToGame.mockReturnValue(updatedGame);
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addRound(mockPlayerScores);
      });

      expect(mockGameUtils.addRoundToGame).toHaveBeenCalledWith(mockGame, mockPlayerScores);
      expect(result.current.currentGame).toEqual(updatedGame);
    });

    it('should handle no active game error', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addRound(mockPlayerScores);
      });

      expect(result.current.error).toBe('No active game found');
    });

    it('should handle add round errors', async () => {
      const error = new Error('Add round error');
      mockGameUtils.addRoundToGame.mockImplementation(() => {
        throw error;
      });
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addRound(mockPlayerScores);
      });

      expect(result.current.error).toBe('Add round error');
    });
  });

  describe('editRound', () => {
    it('should edit a round successfully', async () => {
      const updatedGame = { ...mockGame, rounds: [{ id: 'round1', roundNumber: 1, scores: mockPlayerScores, timestamp: new Date() }] };
      mockGameUtils.editRoundInGame.mockReturnValue(updatedGame);
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.editRound('round1', mockPlayerScores);
      });

      expect(mockGameUtils.editRoundInGame).toHaveBeenCalledWith(mockGame, 'round1', mockPlayerScores);
      expect(result.current.currentGame).toEqual(updatedGame);
    });

    it('should handle no active game error', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.editRound('round1', mockPlayerScores);
      });

      expect(result.current.error).toBe('No active game found');
    });
  });

  describe('deleteRound', () => {
    it('should delete a round successfully', async () => {
      const updatedGame = { ...mockGame, rounds: [] };
      mockGameUtils.deleteRoundFromGame.mockReturnValue(updatedGame);
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteRound('round1');
      });

      expect(mockGameUtils.deleteRoundFromGame).toHaveBeenCalledWith(mockGame, 'round1');
      expect(result.current.currentGame).toEqual(updatedGame);
    });

    it('should handle no active game error', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteRound('round1');
      });

      expect(result.current.error).toBe('No active game found');
    });
  });

  describe('endGame', () => {
    it('should end game successfully', async () => {
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);
      mockStorageService.loadGameHistory.mockResolvedValue([]);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.endGame();
      });

      expect(mockStorageService.addGameToHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockGame,
          status: 'completed',
          completedAt: expect.any(Date),
        })
      );
      expect(mockStorageService.clearCurrentGame).toHaveBeenCalled();
      expect(result.current.currentGame).toBeNull();
    });

    it('should handle no active game error', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.endGame();
      });

      expect(result.current.error).toBe('No active game found');
    });

    it('should handle end game errors', async () => {
      const error = new Error('End game error');
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);
      mockStorageService.addGameToHistory.mockRejectedValue(error);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.endGame();
      });

      expect(result.current.error).toBe('End game error');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useGame(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set an error first
      await act(async () => {
        await result.current.addRound(mockPlayerScores); // This will set "No active game found" error
      });

      await waitFor(() => {
        expect(result.current.error).toBe('No active game found');
      });

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('auto-save functionality', () => {
    it('should auto-save current game when it changes', async () => {
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for auto-save to be called
      await waitFor(() => {
        expect(mockStorageService.saveGame).toHaveBeenCalledWith(mockGame);
      });
    });

    it('should handle auto-save errors gracefully', async () => {
      const error = new Error('Save error');
      mockStorageService.saveGame.mockRejectedValue(error);
      mockStorageService.loadCurrentGame.mockResolvedValue(mockGame);

      const { result } = renderHook(() => useGame(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait for auto-save error to be handled
      await waitFor(() => {
        expect(result.current.error).toBe('Save error');
      });
    });
  });
});