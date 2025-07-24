import { GameService } from '../../src/services/GameService';
import { Game, PlayerScore } from '../../src/types';
import { ValidationError } from '../../src/models/validation';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  describe('createGame', () => {
    it('should create a new game with valid players', () => {
      const players = ['Alice', 'Bob', 'Charlie'];
      const game = gameService.createGame(players);

      expect(game).toBeDefined();
      expect(game.id).toBeDefined();
      expect(game.players).toHaveLength(3);
      expect(game.players[0].name).toBe('Alice');
      expect(game.players[1].name).toBe('Bob');
      expect(game.players[2].name).toBe('Charlie');
      expect(game.status).toBe('active');
      expect(game.rounds).toHaveLength(0);
      expect(game.targetScore).toBeUndefined();
      expect(game.createdAt).toBeInstanceOf(Date);
    });

    it('should create a game with target score', () => {
      const players = ['Alice', 'Bob'];
      const targetScore = 100;
      const game = gameService.createGame(players, targetScore);

      expect(game.targetScore).toBe(targetScore);
    });

    it('should throw error for less than 2 players', () => {
      expect(() => {
        gameService.createGame(['Alice']);
      }).toThrow(ValidationError);
    });

    it('should throw error for more than 6 players', () => {
      const players = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace'];
      expect(() => {
        gameService.createGame(players);
      }).toThrow(ValidationError);
    });

    it('should throw error for duplicate player names', () => {
      expect(() => {
        gameService.createGame(['Alice', 'Bob', 'Alice']);
      }).toThrow(ValidationError);
    });

    it('should throw error for invalid target score', () => {
      expect(() => {
        gameService.createGame(['Alice', 'Bob'], -10);
      }).toThrow(ValidationError);

      expect(() => {
        gameService.createGame(['Alice', 'Bob'], 0);
      }).toThrow(ValidationError);

      expect(() => {
        gameService.createGame(['Alice', 'Bob'], 10.5);
      }).toThrow(ValidationError);
    });

    it('should store the created game', () => {
      const players = ['Alice', 'Bob'];
      const game = gameService.createGame(players);

      expect(gameService.gameExists(game.id)).toBe(true);
      expect(gameService.getGame(game.id)).toEqual(game);
    });
  });

  describe('addRound', () => {
    let game: Game;
    let playerScores: PlayerScore[];

    beforeEach(() => {
      game = gameService.createGame(['Alice', 'Bob', 'Charlie']);
      playerScores = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
        { playerId: game.players[2].id, score: 0, isRummy: true },
      ];
    });

    it('should add a round to the game', () => {
      const updatedGame = gameService.addRound(game.id, playerScores);

      expect(updatedGame.rounds).toHaveLength(1);
      expect(updatedGame.rounds[0].roundNumber).toBe(1);
      expect(updatedGame.rounds[0].scores).toEqual(playerScores);
      expect(updatedGame.rounds[0].timestamp).toBeInstanceOf(Date);
    });

    it('should calculate correct leaderboard after adding round', () => {
      const updatedGame = gameService.addRound(game.id, playerScores);
      const leaderboard = gameService.calculateLeaderboard(updatedGame);

      expect(leaderboard[0].name).toBe('Charlie'); // 0 points (Rummy)
      expect(leaderboard[0].totalScore).toBe(0);
      expect(leaderboard[0].isLeader).toBe(true);
      
      expect(leaderboard[1].name).toBe('Alice'); // 10 points
      expect(leaderboard[1].totalScore).toBe(10);
      expect(leaderboard[1].isLeader).toBe(false);
      
      expect(leaderboard[2].name).toBe('Bob'); // 15 points
      expect(leaderboard[2].totalScore).toBe(15);
      expect(leaderboard[2].isLeader).toBe(false);
    });

    it('should throw error for non-existent game', () => {
      expect(() => {
        gameService.addRound('non-existent-id', playerScores);
      }).toThrow(ValidationError);
    });

    it('should throw error for completed game', () => {
      // Complete the game first
      gameService.endGame(game.id);
      
      expect(() => {
        gameService.addRound(game.id, playerScores);
      }).toThrow(ValidationError);
    });

    it('should throw error for missing player scores', () => {
      const incompleteScores = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        // Missing scores for other players
      ];

      expect(() => {
        gameService.addRound(game.id, incompleteScores);
      }).toThrow(ValidationError);
    });

    it('should automatically end game when target score is reached', () => {
      const gameWithTarget = gameService.createGame(['Alice', 'Bob'], 20);
      const scores = [
        { playerId: gameWithTarget.players[0].id, score: 25, isRummy: false },
        { playerId: gameWithTarget.players[1].id, score: 10, isRummy: false },
      ];

      const completedGame = gameService.addRound(gameWithTarget.id, scores);

      expect(completedGame.status).toBe('completed');
      expect(completedGame.winner).toBe(gameWithTarget.players[1].id); // Bob has lower score
      expect(completedGame.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('editRound', () => {
    let game: Game;
    let roundId: string;

    beforeEach(() => {
      game = gameService.createGame(['Alice', 'Bob']);
      const initialScores = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
      ];
      const updatedGame = gameService.addRound(game.id, initialScores);
      roundId = updatedGame.rounds[0].id;
    });

    it('should edit an existing round', () => {
      const newScores = [
        { playerId: game.players[0].id, score: 20, isRummy: false },
        { playerId: game.players[1].id, score: 5, isRummy: false },
      ];

      const updatedGame = gameService.editRound(game.id, roundId, newScores);

      expect(updatedGame.rounds[0].scores).toEqual(newScores);
      expect(updatedGame.rounds[0].timestamp).toBeInstanceOf(Date);
    });

    it('should recalculate leaderboard after editing', () => {
      const newScores = [
        { playerId: game.players[0].id, score: 5, isRummy: false },
        { playerId: game.players[1].id, score: 20, isRummy: false },
      ];

      const updatedGame = gameService.editRound(game.id, roundId, newScores);
      const leaderboard = gameService.calculateLeaderboard(updatedGame);

      expect(leaderboard[0].name).toBe('Alice'); // Now has lower score
      expect(leaderboard[0].totalScore).toBe(5);
      expect(leaderboard[0].isLeader).toBe(true);
    });

    it('should throw error for non-existent round', () => {
      const newScores = [
        { playerId: game.players[0].id, score: 20, isRummy: false },
        { playerId: game.players[1].id, score: 5, isRummy: false },
      ];

      expect(() => {
        gameService.editRound(game.id, 'non-existent-round', newScores);
      }).toThrow(ValidationError);
    });

    it('should throw error for completed game', () => {
      gameService.endGame(game.id);
      
      const newScores = [
        { playerId: game.players[0].id, score: 20, isRummy: false },
        { playerId: game.players[1].id, score: 5, isRummy: false },
      ];

      expect(() => {
        gameService.editRound(game.id, roundId, newScores);
      }).toThrow(ValidationError);
    });

    it('should automatically end game if edited scores reach target', () => {
      const gameWithTarget = gameService.createGame(['Alice', 'Bob'], 20);
      const initialScores = [
        { playerId: gameWithTarget.players[0].id, score: 10, isRummy: false },
        { playerId: gameWithTarget.players[1].id, score: 5, isRummy: false },
      ];
      const gameWithRound = gameService.addRound(gameWithTarget.id, initialScores);
      const roundToEdit = gameWithRound.rounds[0].id;

      const newScores = [
        { playerId: gameWithTarget.players[0].id, score: 25, isRummy: false },
        { playerId: gameWithTarget.players[1].id, score: 10, isRummy: false },
      ];

      const completedGame = gameService.editRound(gameWithTarget.id, roundToEdit, newScores);

      expect(completedGame.status).toBe('completed');
      expect(completedGame.winner).toBe(gameWithTarget.players[1].id);
    });
  });

  describe('deleteRound', () => {
    let game: Game;
    let roundId: string;

    beforeEach(() => {
      game = gameService.createGame(['Alice', 'Bob']);
      const scores = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
      ];
      const updatedGame = gameService.addRound(game.id, scores);
      roundId = updatedGame.rounds[0].id;
    });

    it('should delete a round from the game', () => {
      const updatedGame = gameService.deleteRound(game.id, roundId);

      expect(updatedGame.rounds).toHaveLength(0);
    });

    it('should renumber subsequent rounds after deletion', () => {
      // Add a second round
      const secondRoundScores = [
        { playerId: game.players[0].id, score: 20, isRummy: false },
        { playerId: game.players[1].id, score: 25, isRummy: false },
      ];
      gameService.addRound(game.id, secondRoundScores);

      // Delete the first round
      const updatedGame = gameService.deleteRound(game.id, roundId);

      expect(updatedGame.rounds).toHaveLength(1);
      expect(updatedGame.rounds[0].roundNumber).toBe(1); // Should be renumbered
    });

    it('should throw error for non-existent round', () => {
      expect(() => {
        gameService.deleteRound(game.id, 'non-existent-round');
      }).toThrow(ValidationError);
    });

    it('should throw error for completed game', () => {
      gameService.endGame(game.id);

      expect(() => {
        gameService.deleteRound(game.id, roundId);
      }).toThrow(ValidationError);
    });
  });

  describe('calculateLeaderboard', () => {
    it('should return players sorted by total score (lowest first)', () => {
      const game = gameService.createGame(['Alice', 'Bob', 'Charlie']);
      
      // Add multiple rounds
      const round1Scores = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
        { playerId: game.players[2].id, score: 5, isRummy: false },
      ];
      gameService.addRound(game.id, round1Scores);

      const round2Scores = [
        { playerId: game.players[0].id, score: 20, isRummy: false },
        { playerId: game.players[1].id, score: 10, isRummy: false },
        { playerId: game.players[2].id, score: 15, isRummy: false },
      ];
      const updatedGame = gameService.addRound(game.id, round2Scores);

      const leaderboard = gameService.calculateLeaderboard(updatedGame);

      expect(leaderboard[0].name).toBe('Charlie'); // 20 total
      expect(leaderboard[0].totalScore).toBe(20);
      expect(leaderboard[0].isLeader).toBe(true);

      expect(leaderboard[1].name).toBe('Bob'); // 25 total
      expect(leaderboard[1].totalScore).toBe(25);
      expect(leaderboard[1].isLeader).toBe(false);

      expect(leaderboard[2].name).toBe('Alice'); // 30 total
      expect(leaderboard[2].totalScore).toBe(30);
      expect(leaderboard[2].isLeader).toBe(false);
    });

    it('should handle Rummy scores correctly', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      const scores = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 0, isRummy: true },
      ];
      const updatedGame = gameService.addRound(game.id, scores);

      const leaderboard = gameService.calculateLeaderboard(updatedGame);

      expect(leaderboard[0].name).toBe('Bob');
      expect(leaderboard[0].totalScore).toBe(0);
      expect(leaderboard[0].isLeader).toBe(true);
    });
  });

  describe('checkGameEnd', () => {
    it('should return false for game without target score', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      
      expect(gameService.checkGameEnd(game)).toBe(false);
    });

    it('should return false when no player reaches target score', () => {
      const game = gameService.createGame(['Alice', 'Bob'], 50);
      const scores = [
        { playerId: game.players[0].id, score: 20, isRummy: false },
        { playerId: game.players[1].id, score: 25, isRummy: false },
      ];
      const updatedGame = gameService.addRound(game.id, scores);

      expect(gameService.checkGameEnd(updatedGame)).toBe(false);
    });

    it('should return true when a player reaches target score', () => {
      const game = gameService.createGame(['Alice', 'Bob'], 30);
      const scores = [
        { playerId: game.players[0].id, score: 35, isRummy: false },
        { playerId: game.players[1].id, score: 25, isRummy: false },
      ];
      // Manually create the game state without using addRound to test checkGameEnd directly
      const gameWithRounds = {
        ...game,
        rounds: [{
          id: 'test-round',
          roundNumber: 1,
          scores: scores,
          timestamp: new Date()
        }]
      };

      expect(gameService.checkGameEnd(gameWithRounds)).toBe(true);
    });

    it('should return false for completed games', () => {
      const game = gameService.createGame(['Alice', 'Bob'], 30);
      const completedGame = gameService.endGame(game.id);

      expect(gameService.checkGameEnd(completedGame)).toBe(false);
    });
  });

  describe('endGame', () => {
    it('should end an active game', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      const completedGame = gameService.endGame(game.id);

      expect(completedGame.status).toBe('completed');
      expect(completedGame.completedAt).toBeInstanceOf(Date);
      expect(completedGame.winner).toBeDefined();
    });

    it('should determine correct winner (lowest score)', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      const scores = [
        { playerId: game.players[0].id, score: 30, isRummy: false },
        { playerId: game.players[1].id, score: 20, isRummy: false },
      ];
      gameService.addRound(game.id, scores);
      
      const completedGame = gameService.endGame(game.id);

      expect(completedGame.winner).toBe(game.players[1].id); // Bob has lower score
    });

    it('should throw error for already completed game', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      gameService.endGame(game.id);

      expect(() => {
        gameService.endGame(game.id);
      }).toThrow(ValidationError);
    });

    it('should throw error for non-existent game', () => {
      expect(() => {
        gameService.endGame('non-existent-id');
      }).toThrow(ValidationError);
    });
  });

  describe('getWinner', () => {
    it('should return winner for completed game', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      const scores = [
        { playerId: game.players[0].id, score: 30, isRummy: false },
        { playerId: game.players[1].id, score: 20, isRummy: false },
      ];
      gameService.addRound(game.id, scores);
      gameService.endGame(game.id);

      const winner = gameService.getWinner(game.id);

      expect(winner).toBeDefined();
      expect(winner!.name).toBe('Bob');
      expect(winner!.totalScore).toBe(20);
    });

    it('should return null for active game', () => {
      const game = gameService.createGame(['Alice', 'Bob']);

      const winner = gameService.getWinner(game.id);

      expect(winner).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should get game by ID', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      const retrievedGame = gameService.getGame(game.id);

      expect(retrievedGame).toEqual(game);
    });

    it('should throw error for non-existent game', () => {
      expect(() => {
        gameService.getGame('non-existent-id');
      }).toThrow(ValidationError);
    });

    it('should check if game exists', () => {
      const game = gameService.createGame(['Alice', 'Bob']);

      expect(gameService.gameExists(game.id)).toBe(true);
      expect(gameService.gameExists('non-existent-id')).toBe(false);
    });

    it('should get all games', () => {
      const game1 = gameService.createGame(['Alice', 'Bob']);
      const game2 = gameService.createGame(['Charlie', 'David']);

      const allGames = gameService.getAllGames();

      expect(allGames).toHaveLength(2);
      expect(allGames).toContain(game1);
      expect(allGames).toContain(game2);
    });

    it('should remove game', () => {
      const game = gameService.createGame(['Alice', 'Bob']);
      
      expect(gameService.removeGame(game.id)).toBe(true);
      expect(gameService.gameExists(game.id)).toBe(false);
      expect(gameService.removeGame(game.id)).toBe(false);
    });

    it('should clear all games', () => {
      gameService.createGame(['Alice', 'Bob']);
      gameService.createGame(['Charlie', 'David']);

      gameService.clearAllGames();

      expect(gameService.getAllGames()).toHaveLength(0);
    });

    it('should get current round number', () => {
      const game = gameService.createGame(['Alice', 'Bob']);

      expect(gameService.getCurrentRoundNumber(game.id)).toBe(1);

      const scores = [
        { playerId: game.players[0].id, score: 10, isRummy: false },
        { playerId: game.players[1].id, score: 15, isRummy: false },
      ];
      gameService.addRound(game.id, scores);

      expect(gameService.getCurrentRoundNumber(game.id)).toBe(2);
    });
  });
});