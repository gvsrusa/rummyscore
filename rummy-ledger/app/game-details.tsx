import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGame } from '@/src/context/GameContext';

export default function GameDetailsScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { gameHistory } = useGame();

  const game = gameHistory.find(g => g.id === gameId);

  if (!game) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Game not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const sortedPlayers = [...game.players].sort((a, b) => a.totalScore - b.totalScore);

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Game Summary */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Game Summary
          </ThemedText>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Date</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {new Date(game.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>
            
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Duration</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {game.completedAt
                  ? `${Math.round(
                      (new Date(game.completedAt).getTime() - 
                       new Date(game.createdAt).getTime()) / (1000 * 60)
                    )} minutes`
                  : 'In progress'
                }
              </ThemedText>
            </View>
            
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryLabel}>Rounds</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {game.rounds.length}
              </ThemedText>
            </View>
            
            {game.targetScore && (
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Target Score</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {game.targetScore}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Final Rankings */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Final Rankings
          </ThemedText>
          
          {sortedPlayers.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.rankingItem,
                index === 0 && styles.winnerItem,
              ]}
            >
              <View style={styles.rankingRank}>
                <ThemedText
                  style={[
                    styles.rankText,
                    index === 0 && styles.winnerRankText,
                  ]}
                >
                  #{index + 1}
                </ThemedText>
              </View>
              
              <View style={styles.rankingInfo}>
                <ThemedText
                  style={[
                    styles.rankingName,
                    index === 0 && styles.winnerName,
                  ]}
                >
                  {player.name}
                  {index === 0 && ' 👑'}
                </ThemedText>
              </View>
              
              <View style={styles.rankingScore}>
                <ThemedText
                  style={[
                    styles.rankingScoreText,
                    index === 0 && styles.winnerScoreText,
                  ]}
                >
                  {player.totalScore}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Round by Round Breakdown */}
        {game.rounds.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Round by Round
            </ThemedText>
            
            {game.rounds.map((round, roundIndex) => (
              <View key={round.id} style={styles.roundDetail}>
                <ThemedText style={styles.roundDetailTitle}>
                  Round {roundIndex + 1}
                </ThemedText>
                
                <View style={styles.roundScoresGrid}>
                  {round.scores.map((score) => {
                    const player = game.players.find(p => p.id === score.playerId);
                    return (
                      <View key={score.playerId} style={styles.roundScoreItem}>
                        <ThemedText style={styles.roundScorePlayer}>
                          {player?.name}
                        </ThemedText>
                        <ThemedText style={styles.roundScoreValue}>
                          {score.isRummy ? 'RUMMY (0)' : score.score}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
                
                {/* Running totals after this round */}
                <View style={styles.runningTotals}>
                  <ThemedText style={styles.runningTotalsTitle}>
                    Running Totals:
                  </ThemedText>
                  <View style={styles.runningTotalsGrid}>
                    {game.players.map((player) => {
                      // Calculate total up to this round
                      const totalUpToRound = game.rounds
                        .slice(0, roundIndex + 1)
                        .reduce((sum, r) => {
                          const playerScore = r.scores.find(s => s.playerId === player.id);
                          return sum + (playerScore?.score || 0);
                        }, 0);
                      
                      return (
                        <View key={player.id} style={styles.runningTotalItem}>
                          <ThemedText style={styles.runningTotalPlayer}>
                            {player.name}
                          </ThemedText>
                          <ThemedText style={styles.runningTotalScore}>
                            {totalUpToRound}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  winnerItem: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  rankingRank: {
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '500',
  },
  winnerRankText: {
    color: '#92400E',
    fontWeight: 'bold',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '500',
  },
  winnerName: {
    fontWeight: 'bold',
    color: '#92400E',
  },
  rankingScore: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  rankingScoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
  winnerScoreText: {
    color: '#92400E',
    fontWeight: 'bold',
  },
  roundDetail: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  roundDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  roundScoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  roundScoreItem: {
    flex: 1,
    minWidth: '45%',
  },
  roundScorePlayer: {
    fontSize: 14,
    opacity: 0.7,
  },
  roundScoreValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  runningTotals: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  runningTotalsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  runningTotalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  runningTotalItem: {
    flex: 1,
    minWidth: '45%',
  },
  runningTotalPlayer: {
    fontSize: 12,
    opacity: 0.6,
  },
  runningTotalScore: {
    fontSize: 14,
    fontWeight: '500',
  },
});