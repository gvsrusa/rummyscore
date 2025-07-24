import { Game, Player, Round, PlayerScore } from '../types';

/**
 * Validation error class for model validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates a player name
 */
export function validatePlayerName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmedName = name.trim();
  return trimmedName.length > 0 && trimmedName.length <= 50;
}

/**
 * Validates a score value
 */
export function validateScore(score: number): boolean {
  return typeof score === 'number' && 
         Number.isInteger(score) && 
         score >= 0;
}

/**
 * Validates a target score
 */
export function validateTargetScore(targetScore?: number): boolean {
  if (targetScore === undefined || targetScore === null) {
    return true; // Optional field
  }
  
  return typeof targetScore === 'number' && 
         Number.isInteger(targetScore) && 
         targetScore > 0;
}

/**
 * Validates a Player object
 */
export function validatePlayer(player: Player): void {
  if (!player.id || typeof player.id !== 'string') {
    throw new ValidationError('Player must have a valid ID');
  }
  
  if (!validatePlayerName(player.name)) {
    throw new ValidationError('Player must have a valid name (1-50 characters)');
  }
  
  if (!validateScore(player.totalScore)) {
    throw new ValidationError('Player total score must be a non-negative integer');
  }
  
  if (typeof player.isLeader !== 'boolean') {
    throw new ValidationError('Player isLeader must be a boolean');
  }
}

/**
 * Validates a PlayerScore object
 */
export function validatePlayerScore(playerScore: PlayerScore): void {
  if (!playerScore.playerId || typeof playerScore.playerId !== 'string') {
    throw new ValidationError('PlayerScore must have a valid playerId');
  }
  
  if (!validateScore(playerScore.score)) {
    throw new ValidationError('PlayerScore must have a valid non-negative integer score');
  }
  
  if (typeof playerScore.isRummy !== 'boolean') {
    throw new ValidationError('PlayerScore isRummy must be a boolean');
  }
}

/**
 * Validates a Round object
 */
export function validateRound(round: Round): void {
  if (!round.id || typeof round.id !== 'string') {
    throw new ValidationError('Round must have a valid ID');
  }
  
  if (!Number.isInteger(round.roundNumber) || round.roundNumber < 1) {
    throw new ValidationError('Round number must be a positive integer');
  }
  
  if (!Array.isArray(round.scores) || round.scores.length === 0) {
    throw new ValidationError('Round must have at least one player score');
  }
  
  // Validate each player score
  round.scores.forEach((score, index) => {
    try {
      validatePlayerScore(score);
    } catch (error) {
      throw new ValidationError(`Invalid player score at index ${index}: ${error.message}`);
    }
  });
  
  if (!(round.timestamp instanceof Date) || isNaN(round.timestamp.getTime())) {
    throw new ValidationError('Round must have a valid timestamp');
  }
}

/**
 * Validates a Game object
 */
export function validateGame(game: Game): void {
  if (!game.id || typeof game.id !== 'string') {
    throw new ValidationError('Game must have a valid ID');
  }
  
  if (!Array.isArray(game.players) || game.players.length < 2 || game.players.length > 6) {
    throw new ValidationError('Game must have between 2 and 6 players');
  }
  
  // Validate each player
  game.players.forEach((player, index) => {
    try {
      validatePlayer(player);
    } catch (error) {
      throw new ValidationError(`Invalid player at index ${index}: ${error.message}`);
    }
  });
  
  // Check for duplicate player names
  const playerNames = game.players.map(p => p.name.toLowerCase());
  const uniqueNames = new Set(playerNames);
  if (uniqueNames.size !== playerNames.length) {
    throw new ValidationError('All player names must be unique');
  }
  
  // Validate rounds
  if (!Array.isArray(game.rounds)) {
    throw new ValidationError('Game rounds must be an array');
  }
  
  game.rounds.forEach((round, index) => {
    try {
      validateRound(round);
    } catch (error) {
      throw new ValidationError(`Invalid round at index ${index}: ${error.message}`);
    }
  });
  
  // Validate target score
  if (!validateTargetScore(game.targetScore)) {
    throw new ValidationError('Game target score must be a positive integer or undefined');
  }
  
  // Validate status
  if (!['active', 'completed'].includes(game.status)) {
    throw new ValidationError('Game status must be either "active" or "completed"');
  }
  
  // Validate winner (only for completed games)
  if (game.status === 'completed' && game.winner) {
    const winnerExists = game.players.some(p => p.id === game.winner);
    if (!winnerExists) {
      throw new ValidationError('Game winner must be one of the players');
    }
  }
  
  // Validate dates
  if (!(game.createdAt instanceof Date) || isNaN(game.createdAt.getTime())) {
    throw new ValidationError('Game must have a valid createdAt date');
  }
  
  if (game.completedAt && (!(game.completedAt instanceof Date) || isNaN(game.completedAt.getTime()))) {
    throw new ValidationError('Game completedAt must be a valid date or undefined');
  }
  
  if (game.completedAt && game.createdAt && game.completedAt < game.createdAt) {
    throw new ValidationError('Game completedAt cannot be before createdAt');
  }
}

/**
 * Validates an array of player names for game setup
 */
export function validatePlayerNames(playerNames: string[]): void {
  if (!Array.isArray(playerNames)) {
    throw new ValidationError('Player names must be an array');
  }
  
  if (playerNames.length < 2 || playerNames.length > 6) {
    throw new ValidationError('Must have between 2 and 6 players');
  }
  
  playerNames.forEach((name, index) => {
    if (!validatePlayerName(name)) {
      throw new ValidationError(`Invalid player name at index ${index}: must be 1-50 characters`);
    }
  });
  
  // Check for duplicates (case-insensitive)
  const lowerNames = playerNames.map(name => name.toLowerCase().trim());
  const uniqueNames = new Set(lowerNames);
  if (uniqueNames.size !== lowerNames.length) {
    throw new ValidationError('All player names must be unique');
  }
}