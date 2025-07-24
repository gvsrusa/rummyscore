import {
  ValidationError,
  validatePlayerName,
  validateScore,
  validateTargetScore,
  validatePlayer,
  validatePlayerScore,
  validateRound,
  validateGame,
  validatePlayerNames,
} from '../../src/models/validation';
import { Game, Player, Round, PlayerScore } from '../../src/types';

describe('Validation Functions', () => {
  describe('validatePlayerName', () => {
    it('should return true for valid player names', () => {
      expect(validatePlayerName('John')).toBe(true);
      expect(validatePlayerName('Alice Smith')).toBe(true);
      expect(validatePlayerName('Player123')).toBe(true);
      expect(validatePlayerName('A')).toBe(true);
    });

    it('should return false for invalid player names', () => {
      expect(validatePlayerName('')).toBe(false);
      expect(validatePlayerName('   ')).toBe(false);
      expect(validatePlayerName('a'.repeat(51))).toBe(false);
      expect(validatePlayerName(null as any)).toBe(false);
      expect(validatePlayerName(undefined as any)).toBe(false);
      expect(validatePlayerName(123 as any)).toBe(false);
    });
  });

  describe('validateScore', () => {
    it('should return true for valid scores', () => {
      expect(validateScore(0)).toBe(true);
      expect(validateScore(10)).toBe(true);
      expect(validateScore(100)).toBe(true);
    });

    it('should return false for invalid scores', () => {
      expect(validateScore(-1)).toBe(false);
      expect(validateScore(1.5)).toBe(false);
      expect(validateScore(NaN)).toBe(false);
      expect(validateScore(Infinity)).toBe(false);
      expect(validateScore('10' as any)).toBe(false);
    });
  });

  describe('validateTargetScore', () => {
    it('should return true for valid target scores', () => {
      expect(validateTargetScore(100)).toBe(true);
      expect(validateTargetScore(500)).toBe(true);
      expect(validateTargetScore(undefined)).toBe(true);
      expect(validateTargetScore(null as any)).toBe(true);
    });

    it('should return false for invalid target scores', () => {
      expect(validateTargetScore(0)).toBe(false);
      expect(validateTargetScore(-10)).toBe(false);
      expect(validateTargetScore(1.5)).toBe(false);
      expect(validateTargetScore('100' as any)).toBe(false);
    });
  });

  describe('validatePlayer', () => {
    const validPlayer: Player = {
      id: 'player-1',
      name: 'John',
      totalScore: 25,
      isLeader: false,
    };

    it('should not throw for valid player', () => {
      expect(() => validatePlayer(validPlayer)).not.toThrow();
    });

    it('should throw for invalid player ID', () => {
      expect(() => validatePlayer({ ...validPlayer, id: '' })).toThrow(ValidationError);
      expect(() => validatePlayer({ ...validPlayer, id: null as any })).toThrow(ValidationError);
    });

    it('should throw for invalid player name', () => {
      expect(() => validatePlayer({ ...validPlayer, name: '' })).toThrow(ValidationError);
      expect(() => validatePlayer({ ...validPlayer, name: 'a'.repeat(51) })).toThrow(ValidationError);
    });

    it('should throw for invalid total score', () => {
      expect(() => validatePlayer({ ...validPlayer, totalScore: -1 })).toThrow(ValidationError);
      expect(() => validatePlayer({ ...validPlayer, totalScore: 1.5 })).toThrow(ValidationError);
    });

    it('should throw for invalid isLeader', () => {
      expect(() => validatePlayer({ ...validPlayer, isLeader: 'true' as any })).toThrow(ValidationError);
    });
  });

  describe('validatePlayerScore', () => {
    const validPlayerScore: PlayerScore = {
      playerId: 'player-1',
      score: 10,
      isRummy: false,
    };

    it('should not throw for valid player score', () => {
      expect(() => validatePlayerScore(validPlayerScore)).not.toThrow();
    });

    it('should throw for invalid player ID', () => {
      expect(() => validatePlayerScore({ ...validPlayerScore, playerId: '' })).toThrow(ValidationError);
    });

    it('should throw for invalid score', () => {
      expect(() => validatePlayerScore({ ...validPlayerScore, score: -1 })).toThrow(ValidationError);
    });

    it('should throw for invalid isRummy', () => {
      expect(() => validatePlayerScore({ ...validPlayerScore, isRummy: 'false' as any })).toThrow(ValidationError);
    });
  });

  describe('validateRound', () => {
    const validRound: Round = {
      id: 'round-1',
      roundNumber: 1,
      scores: [
        { playerId: 'player-1', score: 10, isRummy: false },
        { playerId: 'player-2', score: 0, isRummy: true },
      ],
      timestamp: new Date(),
    };

    it('should not throw for valid round', () => {
      expect(() => validateRound(validRound)).not.toThrow();
    });

    it('should throw for invalid round ID', () => {
      expect(() => validateRound({ ...validRound, id: '' })).toThrow(ValidationError);
    });

    it('should throw for invalid round number', () => {
      expect(() => validateRound({ ...validRound, roundNumber: 0 })).toThrow(ValidationError);
      expect(() => validateRound({ ...validRound, roundNumber: 1.5 })).toThrow(ValidationError);
    });

    it('should throw for empty scores', () => {
      expect(() => validateRound({ ...validRound, scores: [] })).toThrow(ValidationError);
    });

    it('should throw for invalid timestamp', () => {
      expect(() => validateRound({ ...validRound, timestamp: new Date('invalid') })).toThrow(ValidationError);
      expect(() => validateRound({ ...validRound, timestamp: 'today' as any })).toThrow(ValidationError);
    });
  });

  describe('validateGame', () => {
    const validGame: Game = {
      id: 'game-1',
      players: [
        { id: 'player-1', name: 'John', totalScore: 25, isLeader: false },
        { id: 'player-2', name: 'Jane', totalScore: 30, isLeader: true },
      ],
      rounds: [],
      targetScore: 100,
      status: 'active',
      createdAt: new Date(),
    };

    it('should not throw for valid game', () => {
      expect(() => validateGame(validGame)).not.toThrow();
    });

    it('should throw for invalid game ID', () => {
      expect(() => validateGame({ ...validGame, id: '' })).toThrow(ValidationError);
    });

    it('should throw for invalid number of players', () => {
      expect(() => validateGame({ ...validGame, players: [validGame.players[0]] })).toThrow(ValidationError);
      expect(() => validateGame({ 
        ...validGame, 
        players: Array(7).fill(validGame.players[0]).map((p, i) => ({ ...p, id: `player-${i}`, name: `Player${i}` }))
      })).toThrow(ValidationError);
    });

    it('should throw for duplicate player names', () => {
      const duplicateGame = {
        ...validGame,
        players: [
          { id: 'player-1', name: 'John', totalScore: 25, isLeader: false },
          { id: 'player-2', name: 'john', totalScore: 30, isLeader: true }, // Same name, different case
        ],
      };
      expect(() => validateGame(duplicateGame)).toThrow(ValidationError);
    });

    it('should throw for invalid status', () => {
      expect(() => validateGame({ ...validGame, status: 'invalid' as any })).toThrow(ValidationError);
    });

    it('should throw for invalid target score', () => {
      expect(() => validateGame({ ...validGame, targetScore: 0 })).toThrow(ValidationError);
    });

    it('should throw for invalid dates', () => {
      expect(() => validateGame({ ...validGame, createdAt: new Date('invalid') })).toThrow(ValidationError);
      expect(() => validateGame({ 
        ...validGame, 
        completedAt: new Date('2020-01-01'),
        createdAt: new Date('2021-01-01')
      })).toThrow(ValidationError);
    });
  });

  describe('validatePlayerNames', () => {
    it('should not throw for valid player names array', () => {
      expect(() => validatePlayerNames(['John', 'Jane'])).not.toThrow();
      expect(() => validatePlayerNames(['A', 'B', 'C', 'D'])).not.toThrow();
    });

    it('should throw for invalid array size', () => {
      expect(() => validatePlayerNames(['John'])).toThrow(ValidationError);
      expect(() => validatePlayerNames(Array(7).fill('Player').map((p, i) => `${p}${i}`))).toThrow(ValidationError);
    });

    it('should throw for duplicate names', () => {
      expect(() => validatePlayerNames(['John', 'john'])).toThrow(ValidationError);
      expect(() => validatePlayerNames(['Alice', 'Bob', 'Alice'])).toThrow(ValidationError);
    });

    it('should throw for invalid names', () => {
      expect(() => validatePlayerNames(['John', ''])).toThrow(ValidationError);
      expect(() => validatePlayerNames(['John', 'a'.repeat(51)])).toThrow(ValidationError);
    });
  });
});