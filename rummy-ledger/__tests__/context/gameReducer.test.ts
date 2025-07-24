import { gameReducer, GameState, GameAction } from '../../src/context/gameReducer';
import { Game, Player, PlayerScore } from '../../src/types';

// Mock game data for testing
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

const initialState: GameState = {
  currentGame: null,
  gameHistory: [],
  recentPlayers: [],
  loading: false,
  error: null,
};

describe('gameReducer', () => {
  describe('SET_LOADING', () => {
    it('should set loading state to true', () => {
      const action: GameAction = { type: 'SET_LOADING', payload: true };
      const result = gameReducer(initialState, action);
      
      expect(result).toEqual({
        ...initialState,
        loading: true,
      });
    });

    it('should set loading state to false', () => {
      const state = { ...initialState, loading: true };
      const action: GameAction = { type: 'SET_LOADING', payload: false };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        loading: false,
      });
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message and stop loading', () => {
      const state = { ...initialState, loading: true };
      const action: GameAction = { type: 'SET_ERROR', payload: 'Test error' };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        error: 'Test error',
        loading: false,
      });
    });
  });

  describe('CLEAR_ERROR', () => {
    it('should clear error message', () => {
      const state = { ...initialState, error: 'Test error' };
      const action: GameAction = { type: 'CLEAR_ERROR' };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        error: null,
      });
    });
  });

  describe('LOAD_INITIAL_DATA', () => {
    it('should load initial data and clear loading/error states', () => {
      const state = { ...initialState, loading: true, error: 'Previous error' };
      const action: GameAction = {
        type: 'LOAD_INITIAL_DATA',
        payload: {
          currentGame: mockGame,
          gameHistory: [mockCompletedGame],
          recentPlayers: ['Alice', 'Bob'],
        },
      };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        currentGame: mockGame,
        gameHistory: [mockCompletedGame],
        recentPlayers: ['Alice', 'Bob'],
        loading: false,
        error: null,
      });
    });

    it('should handle null current game', () => {
      const action: GameAction = {
        type: 'LOAD_INITIAL_DATA',
        payload: {
          currentGame: null,
          gameHistory: [],
          recentPlayers: [],
        },
      };
      const result = gameReducer(initialState, action);
      
      expect(result).toEqual({
        currentGame: null,
        gameHistory: [],
        recentPlayers: [],
        loading: false,
        error: null,
      });
    });
  });

  describe('CREATE_GAME', () => {
    it('should set current game and clear error', () => {
      const state = { ...initialState, error: 'Previous error' };
      const action: GameAction = { type: 'CREATE_GAME', payload: mockGame };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        currentGame: mockGame,
        error: null,
      });
    });
  });

  describe('ADD_ROUND', () => {
    it('should update current game and clear error', () => {
      const state = { ...initialState, currentGame: mockGame, error: 'Previous error' };
      const updatedGame = { ...mockGame, rounds: [{ id: 'round1', roundNumber: 1, scores: [], timestamp: new Date() }] };
      const action: GameAction = { type: 'ADD_ROUND', payload: updatedGame };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        currentGame: updatedGame,
        error: null,
      });
    });
  });

  describe('EDIT_ROUND', () => {
    it('should update current game and clear error', () => {
      const state = { ...initialState, currentGame: mockGame, error: 'Previous error' };
      const updatedGame = { ...mockGame, rounds: [{ id: 'round1', roundNumber: 1, scores: [], timestamp: new Date() }] };
      const action: GameAction = { type: 'EDIT_ROUND', payload: updatedGame };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        currentGame: updatedGame,
        error: null,
      });
    });
  });

  describe('DELETE_ROUND', () => {
    it('should update current game and clear error', () => {
      const state = { ...initialState, currentGame: mockGame, error: 'Previous error' };
      const updatedGame = { ...mockGame, rounds: [] };
      const action: GameAction = { type: 'DELETE_ROUND', payload: updatedGame };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        currentGame: updatedGame,
        error: null,
      });
    });
  });

  describe('END_GAME', () => {
    it('should clear current game, add to history, and clear error', () => {
      const state = { 
        ...initialState, 
        currentGame: mockGame, 
        gameHistory: [],
        error: 'Previous error' 
      };
      const action: GameAction = { type: 'END_GAME', payload: mockCompletedGame };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        currentGame: null,
        gameHistory: [mockCompletedGame],
        error: null,
      });
    });

    it('should add completed game to existing history', () => {
      const existingGame = { ...mockCompletedGame, id: 'existing' };
      const state = { 
        ...initialState, 
        currentGame: mockGame, 
        gameHistory: [existingGame] 
      };
      const action: GameAction = { type: 'END_GAME', payload: mockCompletedGame };
      const result = gameReducer(state, action);
      
      expect(result.gameHistory).toEqual([mockCompletedGame, existingGame]);
    });
  });

  describe('UPDATE_GAME_HISTORY', () => {
    it('should update game history', () => {
      const state = { ...initialState, gameHistory: [] };
      const newHistory = [mockCompletedGame];
      const action: GameAction = { type: 'UPDATE_GAME_HISTORY', payload: newHistory };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        gameHistory: newHistory,
      });
    });
  });

  describe('UPDATE_RECENT_PLAYERS', () => {
    it('should update recent players list', () => {
      const state = { ...initialState, recentPlayers: [] };
      const newPlayers = ['Alice', 'Bob', 'Charlie'];
      const action: GameAction = { type: 'UPDATE_RECENT_PLAYERS', payload: newPlayers };
      const result = gameReducer(state, action);
      
      expect(result).toEqual({
        ...initialState,
        recentPlayers: newPlayers,
      });
    });
  });

  describe('default case', () => {
    it('should return current state for unknown action', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as any;
      const result = gameReducer(initialState, unknownAction);
      
      expect(result).toBe(initialState);
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState };
      const action: GameAction = { type: 'SET_LOADING', payload: true };
      
      gameReducer(initialState, action);
      
      expect(initialState).toEqual(originalState);
    });

    it('should not mutate nested objects', () => {
      const state = { 
        ...initialState, 
        currentGame: mockGame,
        gameHistory: [mockCompletedGame],
        recentPlayers: ['Alice', 'Bob']
      };
      const originalGame = { ...mockGame };
      const originalHistory = [...state.gameHistory];
      const originalPlayers = [...state.recentPlayers];
      
      const action: GameAction = { type: 'SET_LOADING', payload: true };
      gameReducer(state, action);
      
      expect(state.currentGame).toEqual(originalGame);
      expect(state.gameHistory).toEqual(originalHistory);
      expect(state.recentPlayers).toEqual(originalPlayers);
    });
  });
});