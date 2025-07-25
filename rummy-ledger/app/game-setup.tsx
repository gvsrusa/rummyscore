import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FadeInView, SlideInView } from '@/components/ThemedAnimatedView';
import { useGame } from '@/src/context/GameContext';
import { useHaptics } from '@/src/services/HapticService';
import { validatePlayerNames, validateTargetScore } from '@/src/models/validation';

export default function GameSetupScreen() {
  const { createGame, recentPlayers, loading } = useGame();
  const { gameCreation, errorAction } = useHaptics();
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [targetScore, setTargetScore] = useState<string>('');
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animation values
  const screenOpacity = useSharedValue(0);
  const screenTranslateY = useSharedValue(30);

  // Screen entrance animation
  useEffect(() => {
    screenOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    screenTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  // Update suggestions based on active input
  useEffect(() => {
    if (activeInputIndex !== null && activeInputIndex < players.length) {
      const currentInput = players[activeInputIndex];
      if (currentInput.length > 0) {
        const filtered = recentPlayers.filter(player =>
          player.toLowerCase().includes(currentInput.toLowerCase()) &&
          !players.some((p, index) => index !== activeInputIndex && p.toLowerCase() === player.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5));
      } else {
        // Show recent players when input is empty
        const availablePlayers = recentPlayers.filter(player =>
          !players.some((p, index) => index !== activeInputIndex && p.toLowerCase() === player.toLowerCase())
        );
        setSuggestions(availablePlayers.slice(0, 5));
      }
    } else {
      setSuggestions([]);
    }
  }, [activeInputIndex, players, recentPlayers]);

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
    
    // Clear player-specific errors when user starts typing
    if (errors[`player-${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`player-${index}`];
      setErrors(newErrors);
    }
  };

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, '']);
      // Focus on the new input field
      setTimeout(() => {
        const newIndex = players.length;
        inputRefs.current[newIndex]?.focus();
      }, 100);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
      
      // Clear any errors for removed player
      const newErrors = { ...errors };
      delete newErrors[`player-${index}`];
      setErrors(newErrors);
      
      // Update input refs array
      inputRefs.current = inputRefs.current.filter((_, i) => i !== index);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    if (activeInputIndex !== null) {
      updatePlayer(activeInputIndex, suggestion);
      setSuggestions([]);
      setActiveInputIndex(null);
      Keyboard.dismiss();
    }
  };

  const handleInputFocus = (index: number) => {
    setActiveInputIndex(index);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for suggestion selection
    setTimeout(() => {
      setActiveInputIndex(null);
      setSuggestions([]);
    }, 150);
  };

  const validateAndStartGame = async () => {
    const newErrors: { [key: string]: string } = {};
    
    // Get non-empty players
    const nonEmptyPlayers = players.filter(p => p.trim().length > 0);
    const trimmedPlayers = nonEmptyPlayers.map(p => p.trim());
    
    // Validate individual player names
    players.forEach((player, index) => {
      if (player.trim().length === 0 && index < 2) {
        newErrors[`player-${index}`] = 'Player name is required';
      } else if (player.trim().length > 50) {
        newErrors[`player-${index}`] = 'Player name must be 50 characters or less';
      }
    });
    
    // Validate using the validation utility
    try {
      if (trimmedPlayers.length > 0) {
        validatePlayerNames(trimmedPlayers);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Must have between 2 and 6 players')) {
          newErrors.players = 'Please add at least 2 players to start the game';
        } else if (error.message.includes('must be unique')) {
          newErrors.players = 'All player names must be unique';
        } else {
          newErrors.players = error.message;
        }
      }
    }

    // Validate target score
    let parsedTargetScore: number | undefined;
    if (targetScore.trim()) {
      try {
        parsedTargetScore = parseInt(targetScore.trim());
        if (!validateTargetScore(parsedTargetScore)) {
          newErrors.targetScore = 'Target score must be a positive number';
        }
      } catch {
        newErrors.targetScore = 'Target score must be a valid number';
      }
    }

    // If there are errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Show alert for the first error with haptic feedback
      const firstError = Object.values(newErrors)[0];
      errorAction();
      Alert.alert('Validation Error', firstError);
      return;
    }

    // Clear any existing errors
    setErrors({});

    // Create game and navigate
    try {
      await gameCreation();
      createGame(trimmedPlayers, parsedTargetScore);
      router.replace('/game-play');
    } catch (error) {
      await errorAction();
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create game');
    }
  };

  // Screen animation styles
  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateY: screenTranslateY.value }],
  }));

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <Animated.View style={[{ flex: 1 }, screenAnimatedStyle]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <FadeInView delay={200} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Players ({players.length}/6)
          </ThemedText>
          
          {players.map((player, index) => (
            <SlideInView 
              key={index} 
              delay={300 + index * 100}
              direction="left"
              style={styles.playerInputContainer}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.playerInput,
                    errors[`player-${index}`] && styles.inputError
                  ]}
                  placeholder={`Player ${index + 1} name${index < 2 ? ' (required)' : ''}`}
                  value={player}
                  onChangeText={(text) => updatePlayer(index, text)}
                  onFocus={() => handleInputFocus(index)}
                  onBlur={handleInputBlur}
                  maxLength={50}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType={index === players.length - 1 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (index < players.length - 1) {
                      inputRefs.current[index + 1]?.focus();
                    } else {
                      Keyboard.dismiss();
                    }
                  }}
                />
                {errors[`player-${index}`] && (
                  <ThemedText style={styles.errorText}>
                    {errors[`player-${index}`]}
                  </ThemedText>
                )}
              </View>
              {players.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePlayer(index)}
                  accessibilityLabel={`Remove player ${index + 1}`}
                >
                  <ThemedText style={styles.removeButtonText}>×</ThemedText>
                </TouchableOpacity>
              )}
            </SlideInView>
          ))}

          {suggestions.length > 0 && activeInputIndex !== null && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item}
                renderItem={({ item: suggestion }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion)}
                    accessibilityLabel={`Select player ${suggestion}`}
                  >
                    <ThemedText style={styles.suggestionText}>
                      {suggestion}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {errors.players && (
            <ThemedText style={styles.errorText}>
              {errors.players}
            </ThemedText>
          )}

          {players.length < 6 && (
            <TouchableOpacity 
              style={styles.addPlayerButton} 
              onPress={addPlayer}
              accessibilityLabel="Add another player"
            >
              <ThemedText style={styles.addPlayerText}>+ Add Player</ThemedText>
            </TouchableOpacity>
          )}
        </FadeInView>

        <FadeInView delay={500} style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Target Score (Optional)
          </ThemedText>
          <TextInput
            style={[
              styles.targetScoreInput,
              errors.targetScore && styles.inputError
            ]}
            placeholder="Enter target score (e.g., 500)"
            value={targetScore}
            onChangeText={(text) => {
              setTargetScore(text);
              // Clear target score error when user starts typing
              if (errors.targetScore) {
                const newErrors = { ...errors };
                delete newErrors.targetScore;
                setErrors(newErrors);
              }
            }}
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="done"
            accessibilityLabel="Target score input"
          />
          {errors.targetScore && (
            <ThemedText style={styles.errorText}>
              {errors.targetScore}
            </ThemedText>
          )}
          <ThemedText style={styles.helperText}>
            Leave empty for open-ended game
          </ThemedText>
        </FadeInView>
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={validateAndStartGame}
          disabled={loading}
          accessibilityLabel="Start game"
          testID="start-game-button"
        >
          <ThemedText style={[styles.startButtonText, loading && styles.startButtonTextDisabled]}>
            {loading ? 'Creating Game...' : 'Start Game'}
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  playerInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  removeButton: {
    marginLeft: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 12,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  addPlayerButton: {
    borderWidth: 2,
    borderColor: '#1E3A8A',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addPlayerText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '500',
  },
  targetScoreInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    opacity: 0.6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  startButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  startButtonTextDisabled: {
    color: '#D1D5DB',
  },
});