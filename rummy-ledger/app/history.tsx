import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGame } from '@/src/context/GameContext';
import { Game } from '@/src/types';

export default function HistoryScreen() {
  const { gameHistory } = useGame();

  const handleGamePress = (game: Game) => {
    router.push({
      pathname: '/game-details',
      params: { gameId: game.id },
    });
  };

  const renderGameItem = ({ item: game }: { item: Game }) => (
    <TouchableOpacity
      style={styles.gameItem}
      onPress={() => handleGamePress(game)}
    >
      <View style={styles.gameHeader}>
        <ThemedText style={styles.gameDate}>
          {new Date(game.createdAt).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </ThemedText>
        <ThemedText style={styles.gameTime}>
          {new Date(game.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </ThemedText>
      </View>

      <View style={styles.gameInfo}>
        <ThemedText style={styles.gamePlayers}>
          Players: {game.players.map(p => p.name).join(', ')}
        </ThemedText>
        
        {game.winner && (
          <ThemedText style={styles.gameWinner}>
            Winner: {game.winner} 👑
          </ThemedText>
        )}
        
        <View style={styles.gameStats}>
          <ThemedText style={styles.statText}>
            {game.rounds.length} rounds
          </ThemedText>
          {game.targetScore && (
            <ThemedText style={styles.statText}>
              Target: {game.targetScore}
            </ThemedText>
          )}
          {game.completedAt && (
            <ThemedText style={styles.statText}>
              Duration: {Math.round(
                (new Date(game.completedAt).getTime() - 
                 new Date(game.createdAt).getTime()) / (1000 * 60)
              )} min
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.finalScores}>
        {game.players
          .sort((a, b) => a.totalScore - b.totalScore)
          .slice(0, 3)
          .map((player, index) => (
            <View key={player.id} style={styles.scoreItem}>
              <ThemedText style={styles.scoreRank}>
                #{index + 1}
              </ThemedText>
              <ThemedText style={styles.scoreName}>
                {player.name}
              </ThemedText>
              <ThemedText style={styles.scoreValue}>
                {player.totalScore}
              </ThemedText>
            </View>
          ))}
        {game.players.length > 3 && (
          <ThemedText style={styles.morePlayersText}>
            +{game.players.length - 3} more
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyTitle}>No Games Yet</ThemedText>
      <ThemedText style={styles.emptyMessage}>
        Start playing some Rummy games to see your history here!
      </ThemedText>
      <TouchableOpacity
        style={styles.createGameButton}
        onPress={() => router.push('/game-setup')}
      >
        <ThemedText style={styles.createGameButtonText}>
          Create Your First Game
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      {gameHistory.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={gameHistory}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  gameItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameTime: {
    fontSize: 14,
    opacity: 0.6,
  },
  gameInfo: {
    marginBottom: 16,
  },
  gamePlayers: {
    fontSize: 14,
    marginBottom: 4,
  },
  gameWinner: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
    marginBottom: 8,
  },
  gameStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 12,
    opacity: 0.6,
  },
  finalScores: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreRank: {
    width: 30,
    fontSize: 12,
    fontWeight: '500',
  },
  scoreName: {
    flex: 1,
    fontSize: 14,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  morePlayersText: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 24,
  },
  createGameButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  createGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});