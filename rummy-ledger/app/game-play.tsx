import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScoreEntryModal from '@/components/ScoreEntryModal';
import { useGame } from '@/src/context/GameContext';
import { PlayerScore } from '@/src/types';
import { checkGameEnd, determineWinner } from '@/src/models/gameUtils';

export default function GamePlayScreen() {
  const { currentGame, addRound, endGame } = useGame();
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Check for game end after each round
  useEffect(() => {
    if (currentGame && checkGameEnd(currentGame)) {
      const gameWinner = determineWinner(currentGame);
      setWinner(gameWinner?.name || null);
      setShowGameOver(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [currentGame]);

  if (!currentGame) {
    // Redirect to home if no current game
    router.replace('/');
    return null;
  }

  const handleAddRound = () => {
    setShowScoreEntry(true);
  };

  const handleScoreSubmit = (scores: PlayerScore[]) => {
    addRound(scores);
    setShowScoreEntry(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleScoreCancel = () => {
    setShowScoreEntry(false);
  };

  const handleEndGame = () => {
    Alert.alert(
      'End Game',
      'Are you sure you want to end this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: () => {
            endGame();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleGameOverContinue = () => {
    setShowGameOver(false);
    endGame();
    router.replace('/');
  };

  const handleNewGame = () => {
    setShowGameOver(false);
    endGame();
    router.replace('/game-setup');
  };

  const sortedPlayers = [...currentGame.players].sort((a, b) => a.totalScore - b.totalScore);

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Game Info */}
        <View style={styles.gameInfo}>
          <ThemedText type="subtitle" style={styles.gameTitle}>
            Round {currentGame.rounds.length + 1}
          </ThemedText>
          {currentGame.targetScore && (
            <ThemedText style={styles.targetScore}>
              Target: {currentGame.targetScore}
            </ThemedText>
          )}
        </View>

        {/* Leaderboard */}
        <View style={styles.leaderboard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Live Leaderboard
          </ThemedText>
          
          {sortedPlayers.map((player, index) => {
            const isLeader = index === 0;
            const isCloseToTarget = currentGame.targetScore && 
              player.totalScore >= (currentGame.targetScore * 0.8);
            
            return (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  isLeader && styles.leaderRow,
                  isCloseToTarget && styles.warningRow,
                ]}
              >
                <View style={styles.playerRank}>
                  <ThemedText style={[
                    styles.rankText,
                    isLeader && styles.leaderRankText,
                  ]}>
                    #{index + 1}
                  </ThemedText>
                </View>
                <View style={styles.playerInfo}>
                  <ThemedText
                    style={[
                      styles.playerName,
                      isLeader && styles.leaderName,
                    ]}
                  >
                    {player.name}
                    {isLeader && ' 👑'}
                  </ThemedText>
                  {currentGame.targetScore && (
                    <ThemedText style={styles.targetProgress}>
                      {Math.max(0, currentGame.targetScore - player.totalScore)} to target
                    </ThemedText>
                  )}
                </View>
                <View style={styles.playerScore}>
                  <ThemedText
                    style={[
                      styles.scoreText,
                      isLeader && styles.leaderScore,
                      isCloseToTarget && styles.warningScore,
                    ]}
                  >
                    {player.totalScore}
                  </ThemedText>
                  {currentGame.targetScore && (
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(100, (player.totalScore / currentGame.targetScore) * 100)}%` },
                          isCloseToTarget && styles.warningProgress,
                        ]} 
                      />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Round History */}
        {currentGame.rounds.length > 0 && (
          <View style={styles.roundHistory}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Round History ({currentGame.rounds.length} rounds)
            </ThemedText>
            
            {currentGame.rounds.slice().reverse().map((round, index) => {
              const roundNumber = currentGame.rounds.length - index;
              const roundTotal = round.scores.reduce((sum, score) => sum + score.score, 0);
              
              return (
                <View key={round.id} style={styles.roundItem}>
                  <View style={styles.roundHeader}>
                    <ThemedText style={styles.roundTitle}>
                      Round {roundNumber}
                    </ThemedText>
                    <ThemedText style={styles.roundTotal}>
                      Total: {roundTotal}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.roundScores}>
                    {round.scores
                      .sort((a, b) => {
                        const playerA = currentGame.players.find(p => p.id === a.playerId);
                        const playerB = currentGame.players.find(p => p.id === b.playerId);
                        return (playerA?.name || '').localeCompare(playerB?.name || '');
                      })
                      .map((score) => {
                        const player = currentGame.players.find(p => p.id === score.playerId);
                        return (
                          <View key={score.playerId} style={styles.roundScore}>
                            <ThemedText style={styles.roundPlayerName}>
                              {player?.name}
                            </ThemedText>
                            <ThemedText style={[
                              styles.roundScoreValue,
                              score.isRummy && styles.rummyScore,
                            ]}>
                              {score.isRummy ? 'RUMMY (0)' : score.score}
                            </ThemedText>
                          </View>
                        );
                      })}
                  </View>
                  
                  <ThemedText style={styles.roundTimestamp}>
                    {new Date(round.timestamp).toLocaleTimeString()}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addRoundButton}
          onPress={handleAddRound}
        >
          <ThemedText style={styles.addRoundButtonText}>
            Add Round
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.endGameButton}
          onPress={handleEndGame}
        >
          <ThemedText style={styles.endGameButtonText}>
            End Game
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Score Entry Modal */}
      <ScoreEntryModal
        visible={showScoreEntry}
        players={currentGame.players}
        roundNumber={currentGame.rounds.length + 1}
        onSubmit={handleScoreSubmit}
        onCancel={handleScoreCancel}
      />

      {/* Game Over Modal */}
      <Modal
        visible={showGameOver}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {}}
      >
        <ThemedView style={styles.gameOverContainer}>
          <View style={styles.gameOverContent}>
            <View style={styles.celebrationHeader}>
              <ThemedText style={styles.gameOverTitle}>🎉 Game Over! 🎉</ThemedText>
              {winner && (
                <ThemedText style={styles.winnerText}>
                  {winner} Wins!
                </ThemedText>
              )}
              <ThemedText style={styles.gameOverSubtitle}>
                Target score of {currentGame.targetScore} reached
              </ThemedText>
            </View>

            <View style={styles.finalLeaderboard}>
              <ThemedText type="subtitle" style={styles.finalLeaderboardTitle}>
                Final Standings
              </ThemedText>
              
              {sortedPlayers.map((player, index) => (
                <View
                  key={player.id}
                  style={[
                    styles.finalPlayerRow,
                    index === 0 && styles.finalWinnerRow,
                  ]}
                >
                  <View style={styles.finalPlayerRank}>
                    <ThemedText style={[
                      styles.finalRankText,
                      index === 0 && styles.finalWinnerText,
                    ]}>
                      #{index + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.finalPlayerInfo}>
                    <ThemedText style={[
                      styles.finalPlayerName,
                      index === 0 && styles.finalWinnerText,
                    ]}>
                      {player.name}
                      {index === 0 && ' 👑'}
                    </ThemedText>
                  </View>
                  <View style={styles.finalPlayerScore}>
                    <ThemedText style={[
                      styles.finalScoreText,
                      index === 0 && styles.finalWinnerText,
                    ]}>
                      {player.totalScore}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.gameOverActions}>
              <TouchableOpacity
                style={styles.newGameButton}
                onPress={handleNewGame}
              >
                <ThemedText style={styles.newGameButtonText}>
                  New Game
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.homeButton}
                onPress={handleGameOverContinue}
              >
                <ThemedText style={styles.homeButtonText}>
                  Back to Home
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  gameInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  targetScore: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  leaderboard: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  leaderRow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  warningRow: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  playerRank: {
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '500',
  },
  leaderRankText: {
    color: '#92400E',
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  leaderName: {
    fontWeight: 'bold',
    color: '#92400E',
  },
  targetProgress: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  playerScore: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
  leaderScore: {
    color: '#92400E',
    fontWeight: 'bold',
  },
  warningScore: {
    color: '#DC2626',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  warningProgress: {
    backgroundColor: '#EF4444',
  },
  roundHistory: {
    marginBottom: 20,
  },
  roundItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  roundTotal: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  roundScores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  roundScore: {
    flex: 1,
    minWidth: '45%',
  },
  roundPlayerName: {
    fontSize: 14,
    opacity: 0.7,
  },
  roundScoreValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  rummyScore: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  roundTimestamp: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addRoundButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addRoundButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  endGameButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  endGameButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  // Game Over Modal Styles
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  gameOverContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameOverSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  finalLeaderboard: {
    width: '100%',
    marginBottom: 32,
  },
  finalLeaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  finalPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  finalWinnerRow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  finalPlayerRank: {
    width: 40,
  },
  finalRankText: {
    fontSize: 16,
    fontWeight: '500',
  },
  finalPlayerInfo: {
    flex: 1,
  },
  finalPlayerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  finalPlayerScore: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  finalScoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
  finalWinnerText: {
    color: '#92400E',
    fontWeight: 'bold',
  },
  gameOverActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  newGameButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});