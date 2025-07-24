import {
  generateId,
  createPlayer,
  createGame,
  calculatePlayerTotals,
  calculateLeaderboard,
  addRound,
  editRound,
  deleteRound,
  checkGameEnd,
  determineWinner,
  endGame,
  createPlayerScore,
  getCurrentRoundNumber,
  getGameStats,
} from '../../src/models/gameUtils';
import { ValidationError } from '../../src/models/validation';
import { Game, Player, PlayerScore } from '../../src/types';

describe('Game Utilities', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('createPlayer', () => {
    it('should create a valid player', () => {
      const player = createPlayer('John Doe');
      
      expect(player.id).toBeDefined();
      expect(player.name).toBe('John Doe');
      expect(player.totalScore).toBe(0);
      expect(player.isLeader).toBe(false);
    });

    it('should trim player names', () => {
      const player = createPlayer('  Alice  ');
      expect(player.name).toBe('Alice');
    });
  });

  describe('createGame', () => {
    it('should create a valid game with players', () => {
      const game = createGame(['John', 'Jane'], 100);
      
      expect(game.id).toBeDefined();
      expect(game.players).toHaveLength(2);
      expect(game.players[0].name).toBe('John');
      expect(game.players[1].name).toBe('Jane');
      expect(game.rounds).toEqual([]);
      expect(game.targetScore).toBe(100);
      expect(game.status).toBe('active');
      expect(game.createdAt).toBeInstanceOf(Date);
    });

    it('should create game without target score', () => {
      const game = createGame(['John', 'Jane']);
      expect(game.targetScore).toBeUndefined();
    });

    it('should throw for invalid number of players', () => {
      expect(() => createGame(['John'])).toThrow(ValidationError);
      expect(() => createGame(Array(7).fill('Player').map((p, i) => `${p}${i}`))).toThrow(ValidationError);
    });
  });

  describe('calculatePlayerTotals', () => {
    it('should calculate correct totals from rounds', () => {
      const game = createGame(['John', 'Jane']);
      game.rounds = [
        {
          id: 'round-1',
          roundNumber: 1,
          scores: [
            { playerId: game.players[0].id, score: 10, isRummy: false },
            { playerId: game.players[1].id, score: 15, isRummy: false },
          ],
          timestamp: new Date(),
        },
        {
          id: 'round-2',
          roundNumber: 2,
          scores: [
            { playerId: game.players[0].id, score: 5, isRummy: false },
            { playerId: game.players[1].id, score: 0, isRummy: true },
          ],
          timestamp: new Date(),
        },
      ];

      const playersWithTotals = calculatePlayerTotals(game);
      
      expect(playersWithTotals[0].totalScore).toBe(15); // John: 10 + 5
      expect(playersWithTotals[1].totalScore).toBe(15); // Jane: 15 + 0
    });

    it('should handle empty rounds', () => {
      const game = createGame(['John', 'Jane']);
      const playersWithTotals = calculatePlayerTotals(game);
      
      expect(playersWithTotals[0].totalScore).toBe(0);
      expect(playersWithTotals[1].totalScore).toBe(0);
    });
  });

  describe('calculateLeaderboard', () => {
    it('should sort players by score (lowest first)', () => {
      const game = createGame(['John', 'Jane', 'Bob']);
      game.rounds = [
        {
          id: 'round-1',
          roundNumber: 1,
          scores: [
            { playerId: game.players[0].id, score: 20, isRummy: false }, // John
            { playerId: game.players[1].id, score: 10, isRummy: false }, // Jane
            { playerId: game.players[2].id, score: 15, isRummy: false }, // Bob
          ],
          timestamp: new Date(),
        },
      ];

      const leaderboard = calculateLeaderboard(game);
      
      expect(leaderboard[0].name).toBe('Jane'); // Lowest score (10)
      expect(leaderboard[0].isLeader).toBe(true);
      expect(leaderboard[1].name).toBe('Bob'); // Middle score (15)
      expect(leaderboard[1].isLeader).toBe(false);
      expect(leaderboard[2].name).toBe('John'); // Highest score (20)
      expect(leaderboard[2].isLeader).toBe(false);
    });
  });

  describe('addRound', () => {
    it('should add a round to the game', () => {
      const game = createGame(['John', 'Jane']);
      const playerScores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 0, isRummy: true },
      ];

      const updatedGame = addRound(game, playerScores);
      
      expect(updatedGame.rounds).toHaveLength(1);
      expect(updatedGame.rounds[0].roundNumber).toBe(1);
      expect(updatedGame.rounds[0].scores).toEqual(playerScores);
    });

    it('should throw if not all players have scores', () => {
      const game = createGame(['John', 'Jane']);
      const incompleteScores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
      ];

      expect(() => addRound(game, incompleteScores)).toThrow(ValidationError);
    });
  });

  describe('editRound', () => {
    it('should edit an existing round', () => {
      const game = createGame(['John', 'Jane']);
      const initialScores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
      ];
      const gameWithRound = addRound(game, initialScores);
      
      const newScores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 5, isRummy: false },
        { playerId: game.players[1].id, score: 0, isRummy: true },
      ];

      const updatedGame = editRound(gameWithRound, gameWithRound.rounds[0].id, newScores);
      
      expect(updatedGame.rounds[0].scores).toEqual(newScores);
    });

    it('should throw for non-existent round', () => {
      const game = createGame(['John', 'Jane']);
      const scores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
      ];

      expect(() => editRound(game, 'non-existent', scores)).toThrow(ValidationError);
    });
  });

  describe('deleteRound', () => {
    it('should delete a round and renumber subsequent rounds', () => {
      const game = createGame(['John', 'Jane']);
      let updatedGame = addRound(game, [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
      ]);
      updatedGame = addRound(updatedGame, [
        { playerId: game.players[0].id, score: 5, isRummy: false },
        { playerId: game.players[1].id, score: 20, isRummy: false },
      ]);

      const firstRoundId = updatedGame.rounds[0].id;
      const finalGame = deleteRound(updatedGame, firstRoundId);
      
      expect(finalGame.rounds).toHaveLength(1);
      expect(finalGame.rounds[0].roundNumber).toBe(1); // Renumbered
    });

    it('should throw for non-existent round', () => {
      const game = createGame(['John', 'Jane']);
      expect(() => deleteRound(game, 'non-existent')).toThrow(ValidationError);
    });
  });

  describe('checkGameEnd', () => {
    it('should return true when target score is exceeded', () => {
      const game = createGame(['John', 'Jane'], 50);
      const gameWithRounds = addRound(game, [
        { playerId: game.players[0].id, score: 60, isRummy: false },
        { playerId: game.players[1].id, score: 30, isRummy: false },
      ]);

      expect(checkGameEnd(gameWithRounds)).toBe(true);
    });

    it('should return false when target score is not exceeded', () => {
      const game = createGame(['John', 'Jane'], 100);
      const gameWithRounds = addRound(game, [
        { playerId: game.players[0].id, score: 40, isRummy: false },
        { playerId: game.players[1].id, score: 30, isRummy: false },
      ]);

      expect(checkGameEnd(gameWithRounds)).toBe(false);
    });

    it('should return false for games without target score', () => {
      const game = createGame(['John', 'Jane']);
      const gameWithRounds = addRound(game, [
        { playerId: game.players[0].id, score: 1000, isRummy: false },
        { playerId: game.players[1].id, score: 2000, isRummy: false },
      ]);

      expect(checkGameEnd(gameWithRounds)).toBe(false);
    });
  });

  describe('determineWinner', () => {
    it('should return player with lowest score', () => {
      const game = createGame(['John', 'Jane']);
      const gameWithRounds = addRound(game, [
        { playerId: game.players[0].id, score: 30, isRummy: false },
        { playerId: game.players[1].id, score: 20, isRummy: false },
      ]);

      const winner = determineWinner(gameWithRounds);
      expect(winner?.name).toBe('Jane');
    });

    it('should return null for empty game', () => {
      const game = createGame(['John', 'Jane']);
      game.players = [];
      
      const winner = determineWinner(game);
      expect(winner).toBeNull();
    });
  });

  describe('endGame', () => {
    it('should end the game and set winner', () => {
      const game = createGame(['John', 'Jane']);
      const gameWithRounds = addRound(game, [
        { playerId: game.players[0].id, score: 30, isRummy: false },
        { playerId: game.players[1].id, score: 20, isRummy: false },
      ]);

      const endedGame = endGame(gameWithRounds);
      
      expect(endedGame.status).toBe('completed');
      expect(endedGame.winner).toBe(game.players[1].id); // Jane has lower score
      expect(endedGame.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('createPlayerScore', () => {
    it('should create a normal player score', () => {
      const score = createPlayerScore('player-1', 15, false);
      
      expect(score.playerId).toBe('player-1');
      expect(score.score).toBe(15);
      expect(score.isRummy).toBe(false);
    });

    it('should create a rummy score (score = 0)', () => {
      const score = createPlayerScore('player-1', 25, true);
      
      expect(score.playerId).toBe('player-1');
      expect(score.score).toBe(0); // Rummy always sets score to 0
      expect(score.isRummy).toBe(true);
    });
  });

  describe('getCurrentRoundNumber', () => {
    it('should return correct round number', () => {
      const game = createGame(['John', 'Jane']);
      expect(getCurrentRoundNumber(game)).toBe(1);

      const gameWithRound = addRound(game, [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
      ]);
      expect(getCurrentRoundNumber(gameWithRound)).toBe(2);
    });
  });

  describe('getGameStats', () => {
    it('should calculate correct game statistics', () => {
      const game = createGame(['John', 'Jane']);
      let updatedGame = addRound(game, [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 0, isRummy: true },
      ]);
      updatedGame = addRound(updatedGame, [
        { playerId: game.players[0].id, score: 15, isRummy: false },
        { playerId: game.players[1].id, score: 20, isRummy: false },
      ]);

      const stats = getGameStats(updatedGame);
      
      expect(stats.totalRounds).toBe(2);
      expect(stats.averageScore).toBe(22.5); // (25 + 20) / 2
      expect(stats.highestScore).toBe(25); // John's total
      expect(stats.lowestScore).toBe(20); // Jane's total
      expect(stats.rummyCount).toBe(1); // Jane's rummy in round 1
    });

    it('should handle empty game', () => {
      const game = createGame(['John', 'Jane']);
      const stats = getGameStats(game);
      
      expect(stats.totalRounds).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.highestScore).toBe(0);
      expect(stats.lowestScore).toBe(0);
      expect(stats.rummyCount).toBe(0);
    });
  });
});