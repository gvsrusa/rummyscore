import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Game, GameContextType, PlayerScore } from '../types';
import { gameReducer, GameAction, GameState } from './gameReducer';
import { storageService } from '../services/StorageService';
import { createGame, addRoundToGame, editRoundInGame, deleteRoundFromGame } from '../models/gameUtils';

// Initial state
const initialState: GameState = {
  currentGame: null,
  gameHistory: [],
  recentPlayers: [],
  loading: false,
  error: null,
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Context provider props
interface GameProviderProps {
  children: ReactNode;
}

// Context provider component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-save current game when it changes
  useEffect(() => {
    if (state.currentGame) {
      saveCurrentGame(state.currentGame);
    }
  }, [state.currentGame]);

  /**
   * Load initial data from storage
   */
  const loadInitialData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const [currentGame, gameHistory, recentPlayers] = await Promise.all([
        storageService.loadCurrentGame(),
        storageService.loadGameHistory(),
        storageService.loadRecentPlayers(),
      ]);

      dispatch({ type: 'LOAD_INITIAL_DATA', payload: { currentGame, gameHistory, recentPlayers } });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load initial data' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Save current game to storage
   */
  const saveCurrentGame = async (game: Game) => {
    try {
      await storageService.saveGame(game);
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to save game' 
      });
    }
  };

  /**
   * Create a new game
   */
  const createGameHandler = async (players: string[], targetScore?: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const newGame = createGame(players, targetScore);
      dispatch({ type: 'CREATE_GAME', payload: newGame });

      // Save player names to recent players
      await storageService.savePlayerHistory(players);
      const updatedRecentPlayers = await storageService.loadRecentPlayers();
      dispatch({ type: 'UPDATE_RECENT_PLAYERS', payload: updatedRecentPlayers });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to create game' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Add a round to the current game
   */
  const addRound = async (scores: PlayerScore[]) => {
    if (!state.currentGame) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game found' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const updatedGame = addRoundToGame(state.currentGame, scores);
      dispatch({ type: 'ADD_ROUND', payload: updatedGame });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to add round' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Edit a round in the current game
   */
  const editRound = async (roundId: string, scores: PlayerScore[]) => {
    if (!state.currentGame) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game found' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const updatedGame = editRoundInGame(state.currentGame, roundId, scores);
      dispatch({ type: 'EDIT_ROUND', payload: updatedGame });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to edit round' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Delete a round from the current game
   */
  const deleteRound = async (roundId: string) => {
    if (!state.currentGame) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game found' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const updatedGame = deleteRoundFromGame(state.currentGame, roundId);
      dispatch({ type: 'DELETE_ROUND', payload: updatedGame });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to delete round' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * End the current game
   */
  const endGame = async () => {
    if (!state.currentGame) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game found' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const completedGame: Game = {
        ...state.currentGame,
        status: 'completed',
        completedAt: new Date(),
      };

      // Add to history and clear current game
      await storageService.addGameToHistory(completedGame);
      await storageService.clearCurrentGame();

      // Update state
      dispatch({ type: 'END_GAME', payload: completedGame });

      // Reload game history
      const updatedHistory = await storageService.loadGameHistory();
      dispatch({ type: 'UPDATE_GAME_HISTORY', payload: updatedHistory });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to end game' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Context value
  const contextValue: GameContextType = {
    currentGame: state.currentGame,
    gameHistory: state.gameHistory,
    recentPlayers: state.recentPlayers,
    loading: state.loading,
    error: state.error,
    createGame: createGameHandler,
    addRound,
    editRound,
    deleteRound,
    endGame,
    clearError,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};