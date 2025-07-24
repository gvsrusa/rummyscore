import { Game } from '../types';

// State interface
export interface GameState {
  currentGame: Game | null;
  gameHistory: Game[];
  recentPlayers: string[];
  loading: boolean;
  error: string | null;
}

// Action types
export type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_INITIAL_DATA'; payload: { currentGame: Game | null; gameHistory: Game[]; recentPlayers: string[] } }
  | { type: 'CREATE_GAME'; payload: Game }
  | { type: 'ADD_ROUND'; payload: Game }
  | { type: 'EDIT_ROUND'; payload: Game }
  | { type: 'DELETE_ROUND'; payload: Game }
  | { type: 'END_GAME'; payload: Game }
  | { type: 'UPDATE_GAME_HISTORY'; payload: Game[] }
  | { type: 'UPDATE_RECENT_PLAYERS'; payload: string[] };

/**
 * Game reducer function
 */
export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'LOAD_INITIAL_DATA':
      return {
        ...state,
        currentGame: action.payload.currentGame,
        gameHistory: action.payload.gameHistory,
        recentPlayers: action.payload.recentPlayers,
        loading: false,
        error: null,
      };

    case 'CREATE_GAME':
      return {
        ...state,
        currentGame: action.payload,
        error: null,
      };

    case 'ADD_ROUND':
    case 'EDIT_ROUND':
    case 'DELETE_ROUND':
      return {
        ...state,
        currentGame: action.payload,
        error: null,
      };

    case 'END_GAME':
      return {
        ...state,
        currentGame: null,
        gameHistory: [action.payload, ...state.gameHistory],
        error: null,
      };

    case 'UPDATE_GAME_HISTORY':
      return {
        ...state,
        gameHistory: action.payload,
      };

    case 'UPDATE_RECENT_PLAYERS':
      return {
        ...state,
        recentPlayers: action.payload,
      };

    default:
      return state;
  }
};