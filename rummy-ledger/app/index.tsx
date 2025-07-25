import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';
import { ThemedButton } from '@/components/ThemedButton';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { FadeInView, SlideInView } from '@/components/ThemedAnimatedView';
import { useGame } from '@/src/context/GameContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useHaptics } from '@/src/services/HapticService';

export default function HomeScreen() {
  const { gameHistory, currentGame, loading, error, clearError } = useGame();
  const { colors, theme } = useTheme();
  const { gameCreation } = useHaptics();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);

  // Screen entrance animation
  useEffect(() => {
    headerOpacity.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 150 }));
    headerTranslateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 150 }));
    buttonsOpacity.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 150 }));
    buttonsTranslateY.value = withDelay(300, withSpring(0, { damping: 15, stiffness: 150 }));
  }, []);

  const handleCreateNewGame = async () => {
    await gameCreation();
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

  const styles = createStyles(colors, theme);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <ThemedSafeAreaView style={styles.container}>
      <ResponsiveContainer maxWidth="lg" padding="lg">
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <ThemedText type="h1" style={styles.title}>
            Rummy Ledger
          </ThemedText>
          <ThemedText type="bodyLarge" color="textSecondary" style={styles.subtitle}>
            Digital scorekeeping for your Rummy games
          </ThemedText>
        </Animated.View>

        <Animated.View style={[styles.mainActions, buttonsAnimatedStyle]}>
          <ThemedButton
            title="Create New Game"
            variant="primary"
            size="large"
            fullWidth
            onPress={handleCreateNewGame}
            loading={loading}
            accessibilityLabel="Create a new Rummy game"
          />

          {currentGame && (
            <ThemedButton
              title="Resume Current Game"
              variant="secondary"
              size="large"
              fullWidth
              onPress={handleResumeGame}
              disabled={loading}
              accessibilityLabel="Resume the current game in progress"
            />
          )}

          <ThemedButton
            title="Game History"
            variant="outline"
            size="large"
            fullWidth
            onPress={handleViewHistory}
            disabled={loading}
            accessibilityLabel="View previous game history"
          />
        </Animated.View>

        {loading && gameHistory.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="bodyLarge" color="textSecondary" style={styles.loadingText}>
              Loading your games...
            </ThemedText>
          </View>
        ) : recentGames.length > 0 ? (
          <FadeInView delay={500} style={styles.recentGames}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Recent Games
            </ThemedText>
            {recentGames.map((game, index) => (
              <SlideInView
                key={game.id}
                delay={600 + index * 100}
                direction="up"
              >
                <ThemedView 
                  backgroundColor="card"
                  borderRadius="md"
                  padding="md"
                  shadow="sm"
                  style={styles.gameItem}
                >
                <ThemedText type="label" color="textSecondary" style={styles.gameDate}>
                  {new Date(game.createdAt).toLocaleDateString()}
                </ThemedText>
                <ThemedText type="body" style={styles.gamePlayers}>
                  {game.players.map(p => p.name).join(', ')}
                </ThemedText>
                {game.winner && (
                  <ThemedText type="label" color="success" style={styles.gameWinner}>
                    Winner: {game.winner}
                  </ThemedText>
                )}
                </ThemedView>
              </SlideInView>
            ))}
          </FadeInView>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText type="bodyLarge" color="textSecondary" style={styles.emptyStateText}>
              No games yet. Create your first game to get started!
            </ThemedText>
          </View>
        )}
      </ResponsiveContainer>
    </ThemedSafeAreaView>
  );
}

const createStyles = (colors: any, theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.responsive.getSpacing(theme.spacing.xl),
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.responsive.getSpacing(theme.spacing.sm),
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  mainActions: {
    gap: theme.responsive.getSpacing(theme.spacing.md),
    marginBottom: theme.responsive.getSpacing(theme.spacing.xl),
  },
  recentGames: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: theme.responsive.getSpacing(theme.spacing.md),
  },
  gameItem: {
    marginBottom: theme.responsive.getSpacing(theme.spacing.sm),
  },
  gameDate: {
    marginBottom: theme.responsive.getSpacing(theme.spacing.xs),
  },
  gamePlayers: {
    marginBottom: theme.responsive.getSpacing(theme.spacing.xs),
  },
  gameWinner: {
    // No additional styles needed, handled by ThemedText
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.responsive.getSpacing(theme.spacing.md),
  },
  loadingText: {
    // No additional styles needed, handled by ThemedText
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.responsive.getSpacing(theme.spacing.xl),
  },
  emptyStateText: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
