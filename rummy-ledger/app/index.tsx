import React from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGame } from '@/src/context/GameContext';

export default function HomeScreen() {
  const { gameHistory, currentGame, loading, error, clearError } = useGame();

  const handleCreateNewGame = () => {
    router.push('/game-setup');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleResumeGame = () => {
    if (currentGame) {
      router.push('/game-play');
    }
  };

  const recentGames = gameHistory.slice(0, 3);

  // Handle error display
  React.useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error,
        [
          {
            text: 'OK',
            onPress: clearError,
          },
        ]
      );
    }
  }, [error, clearError]);

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Rummy Ledger
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Digital scorekeeping for your Rummy games
        </ThemedText>
      </View>

      <View style={styles.mainActions}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton, loading && styles.disabledButton]} 
          onPress={handleCreateNewGame}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>
              Create New Game
            </ThemedText>
          )}
        </TouchableOpacity>

        {currentGame && (
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]} 
            onPress={handleResumeGame}
            disabled={loading}
          >
            <ThemedText style={[styles.secondaryButtonText, loading && styles.disabledText]}>
              Resume Current Game
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]} 
          onPress={handleViewHistory}
          disabled={loading}
        >
          <ThemedText style={[styles.secondaryButtonText, loading && styles.disabledText]}>
            Game History
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loading && gameHistory.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <ThemedText style={styles.loadingText}>Loading your games...</ThemedText>
        </View>
      ) : recentGames.length > 0 ? (
        <View style={styles.recentGames}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Games
          </ThemedText>
          {recentGames.map((game) => (
            <View key={game.id} style={styles.gameItem}>
              <ThemedText style={styles.gameDate}>
                {new Date(game.createdAt).toLocaleDateString()}
              </ThemedText>
              <ThemedText style={styles.gamePlayers}>
                {game.players.map(p => p.name).join(', ')}
              </ThemedText>
              {game.winner && (
                <ThemedText style={styles.gameWinner}>
                  Winner: {game.winner}
                </ThemedText>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            No games yet. Create your first game to get started!
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  mainActions: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '500',
  },
  recentGames: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  gameItem: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  gameDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  gamePlayers: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  gameWinner: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
});
