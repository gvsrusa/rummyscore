import { Game, Player, Round, PlayerScore } from '../../src/types';
import { 
  checkGameEnd, 
  determineWinner, 
  addRound, 
  createGame,
  calculatePlayerTotals,
  calculateLeaderboard 
} from '../../src/models/gameUtils';

describe('Game End Verification Tests', () => {
  describe('Game End Detection with Real Rounds', () => {
    it('should detect game end when target score is exceeded through rounds', () => {
      // Create a game with target score of 50
      const game = createGame(['Alice', 'Bob'], 50);
      
      // Add rounds that bring players close to target
      const round1Scores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 25, isRummy: false }, // Alice: 25
        { playerId: game.players[1].id, score: 20, isRummy: false }, // Bob: 20
      ];
      
      const gameAfterRound1 = addRound(game, round1Scores);
      
      // Game should not end yet
      expect(checkGameEnd(gameAfterRound1)).toBe(false);
      
      // Add another round that exceeds target for Alice
      const round2Scores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 30, isRummy: false }, // Alice: 25 + 30 = 55 (exceeds 50)
        { playerId: game.players[1].id, score: 25, isRummy: false }, // Bob: 20 + 25 = 45
      ];
      
      const gameAfterRound2 = addRound(gameAfterRound1, round2Scores);
      
      // Game should end now
      expect(checkGameEnd(gameAfterRound2)).toBe(true);
      
      // Verify calculated totals
      const totals = calculatePlayerTotals(gameAfterRound2);
      const alice = totals.find(p => p.name === 'Alice');
      const bob = totals.find(p => p.name === 'Bob');
      
      expect(alice?.totalScore).toBe(55);
      expect(bob?.totalScore).toBe(45);
    });

    it('should correctly determine winner as player with lowest score', () => {
      // Create a game and add rounds
      const game = createGame(['Alice', 'Bob', 'Charlie'], 50);
      
      const round1Scores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 30, isRummy: false }, // Alice: 30
        { playerId: game.players[1].id, score: 25, isRummy: false }, // Bob: 25
        { playerId: game.players[2].id, score: 35, isRummy: false }, // Charlie: 35
      ];
      
      const round2Scores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 25, isRummy: false }, // Alice: 30 + 25 = 55 (exceeds target)
        { playerId: game.players[1].id, score: 20, isRummy: false }, // Bob: 25 + 20 = 45 (lowest)
        { playerId: game.players[2].id, score: 18, isRummy: false }, // Charlie: 35 + 18 = 53
      ];
      
      let gameWithRounds = addRound(game, round1Scores);
      gameWithRounds = addRound(gameWithRounds, round2Scores);
      
      // Game should end
      expect(checkGameEnd(gameWithRounds)).toBe(true);
      
      // Bob should be the winner (lowest score: 45)
      const winner = determineWinner(gameWithRounds);
      expect(winner).toBeTruthy();
      expect(winner?.name).toBe('Bob');
      
      // Verify leaderboard order
      const leaderboard = calculateLeaderboard(gameWithRounds);
      expect(leaderboard[0].name).toBe('Bob'); // 45 - winner
      expect(leaderboard[1].name).toBe('Charlie'); // 53
      expect(leaderboard[2].name).toBe('Alice'); // 55
      
      expect(leaderboard[0].totalScore).toBe(45);
      expect(leaderboard[1].totalScore).toBe(53);
      expect(leaderboard[2].totalScore).toBe(55);
    });

    it('should handle Rummy scores correctly in game end detection', () => {
      const game = createGame(['Alice', 'Bob'], 30);
      
      const round1Scores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 15, isRummy: false }, // Alice: 15
        { playerId: game.players[1].id, score: 0, isRummy: true },   // Bob: 0 (Rummy)
      ];
      
      const round2Scores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 20, isRummy: false }, // Alice: 15 + 20 = 35 (exceeds 30)
        { playerId: game.players[1].id, score: 12, isRummy: false }, // Bob: 0 + 12 = 12
      ];
      
      let gameWithRounds = addRound(game, round1Scores);
      gameWithRounds = addRound(gameWithRounds, round2Scores);
      
      // Game should end
      expect(checkGameEnd(gameWithRounds)).toBe(true);
      
      // Bob should win with lowest score (12)
      const winner = determineWinner(gameWithRounds);
      expect(winner?.name).toBe('Bob');
      expect(winner?.totalScore).toBe(12);
    });

    it('should not end game without target score', () => {
      const game = createGame(['Alice', 'Bob']); // No target score
      
      const roundScores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 100, isRummy: false }, // Alice: 100
        { playerId: game.players[1].id, score: 95, isRummy: false },  // Bob: 95
      ];
      
      const gameWithRounds = addRound(game, roundScores);
      
      // Game should not end without target score
      expect(checkGameEnd(gameWithRounds)).toBe(false);
    });

    it('should handle tie scenarios in winner determination', () => {
      const game = createGame(['Alice', 'Bob', 'Charlie'], 50);
      
      const roundScores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 45, isRummy: false }, // Alice: 45
        { playerId: game.players[1].id, score: 45, isRummy: false }, // Bob: 45 (tied for lowest)
        { playerId: game.players[2].id, score: 55, isRummy: false }, // Charlie: 55 (exceeds target)
      ];
      
      const gameWithRounds = addRound(game, roundScores);
      
      // Game should end
      expect(checkGameEnd(gameWithRounds)).toBe(true);
      
      // First player in leaderboard should win (stable sort)
      const winner = determineWinner(gameWithRounds);
      expect(winner).toBeTruthy();
      expect(winner?.totalScore).toBe(45);
      
      // Both Alice and Bob have same score, winner depends on sort stability
      expect(['Alice', 'Bob']).toContain(winner?.name);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rounds correctly', () => {
      const game = createGame(['Alice', 'Bob'], 50);
      
      // No rounds added yet
      expect(checkGameEnd(game)).toBe(false);
      
      const winner = determineWinner(game);
      expect(winner).toBeTruthy(); // Should still return a winner (first player)
      expect(winner?.totalScore).toBe(0);
    });

    it('should handle minimum player games (2 players)', () => {
      const game = createGame(['Player1', 'Player2'], 50);
      
      const roundScores: PlayerScore[] = [
        { playerId: game.players[0].id, score: 60, isRummy: false }, // Player1: 60 (exceeds target)
        { playerId: game.players[1].id, score: 45, isRummy: false }, // Player2: 45 (winner)
      ];
      
      const gameWithRounds = addRound(game, roundScores);
      
      // Game should end
      expect(checkGameEnd(gameWithRounds)).toBe(true);
      
      // Player2 should be the winner (lowest score)
      const winner = determineWinner(gameWithRounds);
      expect(winner?.name).toBe('Player2');
      expect(winner?.totalScore).toBe(45);
    });
  });
});