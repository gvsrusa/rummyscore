import { Game, Player, Round, PlayerScore } from '../types';
import { validateGame, validateRound, ValidationError } from './validation';

/**
 * Generates a unique ID for games, rounds, and players
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Creates a new player object
 */
export function createPlayer(name: string): Player {
  return {
    id: generateId(),
    name: name.trim(),
    totalScore: 0,
    isLeader: false,
  };
}

/**
 * Creates a new game with the specified players and optional target score
 */
export function createGame(playerNames: string[], targetScore?: number): Game {
  if (playerNames.length < 2 || playerNames.length > 6) {
    throw new ValidationError('Game must have between 2 and 6 players');
  }

  const players = playerNames.map(name => createPlayer(name));
  
  const game: Game = {
    id: generateId(),
    players,
    rounds: [],
    targetScore,
    status: 'active',
    createdAt: new Date(),
  };

  validateGame(game);
  return game;
}

/**
 * Calculates total scores for all players based on rounds
 */
export function calculatePlayerTotals(game: Game): Player[] {
  const playerTotals = new Map<string, number>();
  
  // Initialize totals
  game.players.forEach(player => {
    playerTotals.set(player.id, 0);
  });
  
  // Sum scores from all rounds
  game.rounds.forEach(round => {
    round.scores.forEach(playerScore => {
      const currentTotal = playerTotals.get(playerScore.playerId) || 0;
      playerTotals.set(playerScore.playerId, currentTotal + playerScore.score);
    });
  });
  
  // Update player objects with calculated totals
  return game.players.map(player => ({
    ...player,
    totalScore: playerTotals.get(player.id) || 0,
  }));
}

/**
 * Calculates and returns the leaderboard (players sorted by score, lowest first)
 */
export function calculateLeaderboard(game: Game): Player[] {
  const playersWithTotals = calculatePlayerTotals(game);
  
  // Sort by total score (ascending - lowest score wins in Rummy)
  const sortedPlayers = playersWithTotals.sort((a, b) => a.totalScore - b.totalScore);
  
  // Mark the leader (player with lowest score)
  return sortedPlayers.map((player, index) => ({
    ...player,
    isLeader: index === 0,
  }));
}

/**
 * Adds a new round to the game
 */
export function addRound(game: Game, playerScores: PlayerScore[]): Game {
  // Validate that all players have scores
  const playerIds = new Set(game.players.map(p => p.id));
  const scorePlayerIds = new Set(playerScores.map(ps => ps.playerId));
  
  if (playerIds.size !== scorePlayerIds.size || 
      !Array.from(playerIds).every(id => scorePlayerIds.has(id))) {
    throw new ValidationError('All players must have scores for the round');
  }

  const newRound: Round = {
    id: generateId(),
    roundNumber: game.rounds.length + 1,
    scores: playerScores,
    timestamp: new Date(),
  };

  validateRound(newRound);

  const updatedGame: Game = {
    ...game,
    rounds: [...game.rounds, newRound],
  };

  return updatedGame;
}

/**
 * Edits an existing round in the game
 */
export function editRound(game: Game, roundId: string, newPlayerScores: PlayerScore[]): Game {
  const roundIndex = game.rounds.findIndex(round => round.id === roundId);
  
  if (roundIndex === -1) {
    throw new ValidationError('Round not found');
  }

  // Validate that all players have scores
  const playerIds = new Set(game.players.map(p => p.id));
  const scorePlayerIds = new Set(newPlayerScores.map(ps => ps.playerId));
  
  if (playerIds.size !== scorePlayerIds.size || 
      !Array.from(playerIds).every(id => scorePlayerIds.has(id))) {
    throw new ValidationError('All players must have scores for the round');
  }

  const updatedRound: Round = {
    ...game.rounds[roundIndex],
    scores: newPlayerScores,
    timestamp: new Date(), // Update timestamp when edited
  };

  validateRound(updatedRound);

  const updatedRounds = [...game.rounds];
  updatedRounds[roundIndex] = updatedRound;

  return {
    ...game,
    rounds: updatedRounds,
  };
}

/**
 * Deletes a round from the game and renumbers subsequent rounds
 */
export function deleteRound(game: Game, roundId: string): Game {
  const roundIndex = game.rounds.findIndex(round => round.id === roundId);
  
  if (roundIndex === -1) {
    throw new ValidationError('Round not found');
  }

  const updatedRounds = game.rounds
    .filter(round => round.id !== roundId)
    .map((round, index) => ({
      ...round,
      roundNumber: index + 1, // Renumber rounds
    }));

  return {
    ...game,
    rounds: updatedRounds,
  };
}

/**
 * Checks if the game should end based on target score
 */
export function checkGameEnd(game: Game): boolean {
  if (!game.targetScore || game.status === 'completed') {
    return false;
  }

  const playersWithTotals = calculatePlayerTotals(game);
  return playersWithTotals.some(player => player.totalScore >= game.targetScore!);
}

/**
 * Determines the winner of the game (player with lowest score)
 */
export function determineWinner(game: Game): Player | null {
  if (game.players.length === 0) {
    return null;
  }

  const leaderboard = calculateLeaderboard(game);
  return leaderboard[0]; // First player in leaderboard has lowest score
}

/**
 * Ends the game and determines the winner
 */
export function endGame(game: Game): Game {
  const winner = determineWinner(game);
  
  return {
    ...game,
    status: 'completed',
    winner: winner?.id,
    completedAt: new Date(),
  };
}

/**
 * Creates a PlayerScore object for a round
 */
export function createPlayerScore(playerId: string, score: number, isRummy: boolean = false): PlayerScore {
  return {
    playerId,
    score: isRummy ? 0 : score, // Rummy always sets score to 0
    isRummy,
  };
}

/**
 * Gets the current round number for a game
 */
export function getCurrentRoundNumber(game: Game): number {
  return game.rounds.length + 1;
}

/**
 * Gets game statistics
 */
export function getGameStats(game: Game): {
  totalRounds: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  rummyCount: number;
} {
  const playersWithTotals = calculatePlayerTotals(game);
  const totalScores = playersWithTotals.map(p => p.totalScore);
  
  let rummyCount = 0;
  game.rounds.forEach(round => {
    round.scores.forEach(score => {
      if (score.isRummy) rummyCount++;
    });
  });

  return {
    totalRounds: game.rounds.length,
    averageScore: totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0,
    highestScore: totalScores.length > 0 ? Math.max(...totalScores) : 0,
    lowestScore: totalScores.length > 0 ? Math.min(...totalScores) : 0,
    rummyCount,
  };
}
/**

 * Wrapper function for adding a round to a game (matches GameContext naming)
 */
export function addRoundToGame(game: Game, playerScores: PlayerScore[]): Game {
  return addRound(game, playerScores);
}

/**
 * Wrapper function for editing a round in a game (matches GameContext naming)
 */
export function editRoundInGame(game: Game, roundId: string, newPlayerScores: PlayerScore[]): Game {
  return editRound(game, roundId, newPlayerScores);
}

/**
 * Wrapper function for deleting a round from a game (matches GameContext naming)
 */
export function deleteRoundFromGame(game: Game, roundId: string): Game {
  return deleteRound(game, roundId);
}