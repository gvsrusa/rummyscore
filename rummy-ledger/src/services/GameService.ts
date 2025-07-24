import { Game, Player, PlayerScore, GameService as IGameService } from '../types';
import {
  createGame as createGameUtil,
  addRound as addRoundUtil,
  editRound as editRoundUtil,
  deleteRound as deleteRoundUtil,
  calculateLeaderboard as calculateLeaderboardUtil,
  checkGameEnd as checkGameEndUtil,
  determineWinner,
  endGame as endGameUtil,
} from '../models/gameUtils';
import { validatePlayerNames, ValidationError } from '../models/validation';

/**
 * GameService class that implements the core game business logic
 * This service manages game creation, round management, scoring, and game end detection
 */
export class GameService implements IGameService {
  private games: Map<string, Game> = new Map();

  /**
   * Creates a new game with the specified players and optional target score
   * @param players Array of player names (2-6 players)
   * @param targetScore Optional target score for automatic game end
   * @returns The created game object
   * @throws ValidationError if player names are invalid
   */
  createGame(players: string[], targetScore?: number): Game {
    validatePlayerNames(players);
    
    if (targetScore !== undefined && (typeof targetScore !== 'number' || targetScore <= 0 || !Number.isInteger(targetScore))) {
      throw new ValidationError('Target score must be a positive integer');
    }

    const game = createGameUtil(players, targetScore);
    this.games.set(game.id, game);
    return game;
  }

  /**
   * Adds a new round to the specified game
   * @param gameId The ID of the game to add the round to
   * @param scores Array of player scores for the round
   * @returns The updated game object
   * @throws ValidationError if game not found or scores are invalid
   */
  addRound(gameId: string, scores: PlayerScore[]): Game {
    const game = this.getGame(gameId);
    
    if (game.status === 'completed') {
      throw new ValidationError('Cannot add rounds to a completed game');
    }

    const updatedGame = addRoundUtil(game, scores);
    
    // Check if game should end after adding this round
    if (this.checkGameEnd(updatedGame)) {
      const completedGame = endGameUtil(updatedGame);
      this.games.set(gameId, completedGame);
      return completedGame;
    }

    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  /**
   * Edits an existing round in the specified game
   * @param gameId The ID of the game containing the round
   * @param roundId The ID of the round to edit
   * @param scores New array of player scores for the round
   * @returns The updated game object
   * @throws ValidationError if game or round not found, or scores are invalid
   */
  editRound(gameId: string, roundId: string, scores: PlayerScore[]): Game {
    const game = this.getGame(gameId);
    
    if (game.status === 'completed') {
      throw new ValidationError('Cannot edit rounds in a completed game');
    }

    const updatedGame = editRoundUtil(game, roundId, scores);
    
    // Check if game should end after editing this round
    if (this.checkGameEnd(updatedGame)) {
      const completedGame = endGameUtil(updatedGame);
      this.games.set(gameId, completedGame);
      return completedGame;
    }

    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  /**
   * Deletes a round from the specified game
   * @param gameId The ID of the game containing the round
   * @param roundId The ID of the round to delete
   * @returns The updated game object
   * @throws ValidationError if game or round not found
   */
  deleteRound(gameId: string, roundId: string): Game {
    const game = this.getGame(gameId);
    
    if (game.status === 'completed') {
      throw new ValidationError('Cannot delete rounds from a completed game');
    }

    const updatedGame = deleteRoundUtil(game, roundId);
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  /**
   * Calculates and returns the current leaderboard for the game
   * @param game The game to calculate the leaderboard for
   * @returns Array of players sorted by score (lowest first)
   */
  calculateLeaderboard(game: Game): Player[] {
    return calculateLeaderboardUtil(game);
  }

  /**
   * Checks if the game should end based on target score
   * @param game The game to check
   * @returns True if the game should end, false otherwise
   */
  checkGameEnd(game: Game): boolean {
    return checkGameEndUtil(game);
  }

  /**
   * Manually ends a game and determines the winner
   * @param gameId The ID of the game to end
   * @returns The completed game object
   * @throws ValidationError if game not found or already completed
   */
  endGame(gameId: string): Game {
    const game = this.getGame(gameId);
    
    if (game.status === 'completed') {
      throw new ValidationError('Game is already completed');
    }

    const completedGame = endGameUtil(game);
    this.games.set(gameId, completedGame);
    return completedGame;
  }

  /**
   * Gets the winner of a completed game
   * @param gameId The ID of the game
   * @returns The winning player or null if game is not completed
   * @throws ValidationError if game not found
   */
  getWinner(gameId: string): Player | null {
    const game = this.getGame(gameId);
    
    if (game.status !== 'completed') {
      return null;
    }

    return determineWinner(game);
  }

  /**
   * Gets a game by ID
   * @param gameId The ID of the game to retrieve
   * @returns The game object
   * @throws ValidationError if game not found
   */
  getGame(gameId: string): Game {
    const game = this.games.get(gameId);
    if (!game) {
      throw new ValidationError(`Game with ID ${gameId} not found`);
    }
    return game;
  }

  /**
   * Gets all games managed by this service
   * @returns Array of all games
   */
  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }

  /**
   * Removes a game from the service
   * @param gameId The ID of the game to remove
   * @returns True if game was removed, false if not found
   */
  removeGame(gameId: string): boolean {
    return this.games.delete(gameId);
  }

  /**
   * Clears all games from the service
   */
  clearAllGames(): void {
    this.games.clear();
  }

  /**
   * Gets the current round number for a game
   * @param gameId The ID of the game
   * @returns The current round number (next round to be played)
   * @throws ValidationError if game not found
   */
  getCurrentRoundNumber(gameId: string): number {
    const game = this.getGame(gameId);
    return game.rounds.length + 1;
  }

  /**
   * Checks if a game exists
   * @param gameId The ID of the game to check
   * @returns True if game exists, false otherwise
   */
  gameExists(gameId: string): boolean {
    return this.games.has(gameId);
  }
}

// Export a singleton instance for use throughout the app
export const gameService = new GameService();