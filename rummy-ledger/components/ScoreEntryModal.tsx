import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { AccessibleTextInput } from '@/components/AccessibleTextInput';
import { KeyboardNavigationView } from '@/components/KeyboardNavigationView';
import { FadeInView, ScaleInView } from '@/components/ThemedAnimatedView';
import { useHaptics } from '@/src/services/HapticService';
import { useTheme } from '@/src/context/ThemeContext';
import { useAccessibility } from '@/src/services/AccessibilityService';
import { Player, PlayerScore } from '@/src/types';

interface ScoreEntryModalProps {
  visible: boolean;
  players: Player[];
  roundNumber: number;
  onSubmit: (scores: PlayerScore[]) => void;
  onCancel: () => void;
  loading?: boolean;
  editingRound?: {
    id: string;
    scores: PlayerScore[];
  };
}

export default function ScoreEntryModal({
  visible,
  players,
  roundNumber,
  onSubmit,
  onCancel,
  loading = false,
  editingRound,
}: ScoreEntryModalProps) {
  const [scores, setScores] = useState<{ [playerId: string]: string }>({});
  const [rummyPlayers, setRummyPlayers] = useState<Set<string>>(new Set());
  
  const { colors, theme } = useTheme();
  const { scoreEntry, rummyToggle, roundComplete, errorAction } = useHaptics();
  const { 
    announceScoreUpdate, 
    announceGameState,
    getScoreLabel,
    getInteractionHint,
    shouldReduceAnimations,
    getAnimationDuration,
    isScreenReaderEnabled 
  } = useAccessibility();
  
  // Refs for managing focus
  const inputRefs = useRef<{ [playerId: string]: React.RefObject<any> }>({});
  const modalRef = useRef<View>(null);
  
  // Animation values for each player row
  const playerAnimations = players.reduce((acc, player) => {
    acc[player.id] = {
      scale: useSharedValue(1),
      rummyScale: useSharedValue(1),
    };
    return acc;
  }, {} as Record<string, { scale: Animated.SharedValue<number>; rummyScale: Animated.SharedValue<number> }>);

  // Initialize input refs
  useEffect(() => {
    players.forEach(player => {
      if (!inputRefs.current[player.id]) {
        inputRefs.current[player.id] = React.createRef();
      }
    });
  }, [players]);

  // Reset state when modal opens or populate with editing data
  useEffect(() => {
    if (visible) {
      if (editingRound) {
        // Populate with existing round data
        const initialScores: { [playerId: string]: string } = {};
        const initialRummyPlayers = new Set<string>();
        
        editingRound.scores.forEach(score => {
          if (score.isRummy) {
            initialRummyPlayers.add(score.playerId);
          } else {
            initialScores[score.playerId] = score.score.toString();
          }
        });
        
        setScores(initialScores);
        setRummyPlayers(initialRummyPlayers);
      } else {
        // Reset for new round
        setScores({});
        setRummyPlayers(new Set());
      }

      // Announce modal opening to screen reader
      if (isScreenReaderEnabled) {
        const message = editingRound 
          ? `Editing round ${roundNumber} scores`
          : `Entering scores for round ${roundNumber}`;
        announceGameState(message);
      }
    }
  }, [visible, editingRound, roundNumber, isScreenReaderEnabled, announceGameState]);

  const updateScore = async (playerId: string, score: string) => {
    // Only allow numeric input
    const numericScore = score.replace(/[^0-9]/g, '');
    
    // Animate score input (respect reduced motion)
    if (playerAnimations[playerId] && !shouldReduceAnimations()) {
      const duration = getAnimationDuration(300);
      playerAnimations[playerId].scale.value = withSequence(
        withSpring(1.05, { damping: 15, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
    
    // Remove from rummy if manually entering score
    if (numericScore && rummyPlayers.has(playerId)) {
      const newRummyPlayers = new Set(rummyPlayers);
      newRummyPlayers.delete(playerId);
      setRummyPlayers(newRummyPlayers);
    }

    setScores(prev => ({
      ...prev,
      [playerId]: numericScore,
    }));
    
    // Haptic feedback for score entry
    if (numericScore) {
      await scoreEntry();
    }

    // Announce score update to screen reader
    if (numericScore && isScreenReaderEnabled) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        await announceScoreUpdate(player.name, parseInt(numericScore));
      }
    }
  };

  const toggleRummy = async (playerId: string) => {
    // Animate rummy button (respect reduced motion)
    if (playerAnimations[playerId] && !shouldReduceAnimations()) {
      const duration = getAnimationDuration(400);
      playerAnimations[playerId].rummyScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
    
    const newRummyPlayers = new Set(rummyPlayers);
    const isRummy = newRummyPlayers.has(playerId);
    
    if (isRummy) {
      newRummyPlayers.delete(playerId);
    } else {
      newRummyPlayers.add(playerId);
      // Clear manual score when marking as rummy
      setScores(prev => ({
        ...prev,
        [playerId]: '',
      }));
    }
    setRummyPlayers(newRummyPlayers);
    
    // Haptic feedback for rummy toggle
    await rummyToggle();

    // Announce rummy toggle to screen reader
    if (isScreenReaderEnabled) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        const message = isRummy 
          ? `${player.name} rummy removed`
          : `${player.name} marked as rummy`;
        await announceScoreUpdate(player.name, 0, !isRummy);
      }
    }
  };

  const validateAndSubmit = async () => {
    const playerScores: PlayerScore[] = [];
    const missingScores: string[] = [];

    for (const player of players) {
      const isRummy = rummyPlayers.has(player.id);
      const scoreText = scores[player.id] || '';

      if (!isRummy && !scoreText.trim()) {
        missingScores.push(player.name);
        continue;
      }

      if (isRummy) {
        playerScores.push({
          playerId: player.id,
          score: 0,
          isRummy: true,
        });
      } else {
        const score = parseInt(scoreText);
        if (isNaN(score) || score < 0) {
          await errorAction();
          Alert.alert('Error', `Invalid score for ${player.name}. Please enter a non-negative number.`);
          return;
        }
        playerScores.push({
          playerId: player.id,
          score,
          isRummy: false,
        });
      }
    }

    if (missingScores.length > 0) {
      await errorAction();
      Alert.alert(
        'Missing Scores',
        `Please enter scores for: ${missingScores.join(', ')}`
      );
      return;
    }

    // Submit scores with haptic feedback
    await roundComplete();
    onSubmit(playerScores);
  };

  const handleCancel = () => {
    if (Object.keys(scores).length > 0 || rummyPlayers.size > 0) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard the entered scores?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
      accessibilityViewIsModal={true}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <KeyboardNavigationView
          ref={modalRef}
          style={styles.modalContent}
          autoFocus={true}
          accessibilityRole="dialog"
          accessibilityLabel={editingRound ? `Edit round ${roundNumber} scores` : `Round ${roundNumber} score entry`}
        >
          <ThemedView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelHeaderButton}
              onPress={handleCancel}
            >
              <ThemedText style={styles.cancelHeaderText}>Cancel</ThemedText>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <ThemedText type="h3" style={styles.title}>
                {editingRound ? `Edit Round ${roundNumber}` : `Round ${roundNumber} Scores`}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {editingRound ? 'Modify scores for each player' : 'Enter scores for each player'}
              </ThemedText>
            </View>
            
            <TouchableOpacity
              style={styles.submitHeaderButton}
              onPress={validateAndSubmit}
            >
              <ThemedText style={styles.submitHeaderText}>Done</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Players List */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.playersContainer}>
              {players.map((player, index) => {
                const isRummy = rummyPlayers.has(player.id);
                const scoreValue = scores[player.id] || '';
                
                // Animated styles for this player
                const playerScale = playerAnimations[player.id]?.scale;
                const rummyScale = playerAnimations[player.id]?.rummyScale;
                
                const playerAnimatedStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: playerScale?.value || 1 }],
                }));
                
                const rummyAnimatedStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: rummyScale?.value || 1 }],
                }));

                return (
                  <ScaleInView
                    key={player.id}
                    delay={index * 100}
                    style={styles.playerContainer}
                  >
                    <View style={styles.playerHeader}>
                      <ThemedText type="playerNameSmall" style={styles.playerName}>
                        {player.name}
                      </ThemedText>
                      <ThemedText type="caption" style={styles.currentTotal}>
                        Current: {player.totalScore}
                      </ThemedText>
                    </View>

                    <View style={styles.scoreInputContainer}>
                      <Animated.View style={[{ flex: 1 }, shouldReduceAnimations() ? {} : playerAnimatedStyle]}>
                        <AccessibleTextInput
                          ref={inputRefs.current[player.id]}
                          containerStyle={{ flex: 1 }}
                          inputStyle={[
                            styles.scoreInput,
                            isRummy && styles.scoreInputDisabled,
                            { color: colors.text, borderColor: colors.border },
                          ]}
                          placeholder="0"
                          placeholderTextColor={colors.textTertiary}
                          value={isRummy ? '0' : scoreValue}
                          onChangeText={(text) => updateScore(player.id, text)}
                          keyboardType="numeric"
                          maxLength={3}
                          editable={!isRummy}
                          selectTextOnFocus
                          variant="score"
                          size="large"
                          accessibilityLabel={`Score input for ${player.name}`}
                          accessibilityHint={isRummy ? 'Rummy selected, score is 0' : getInteractionHint('score-input')}
                        />
                      </Animated.View>
                      
                      <Animated.View style={shouldReduceAnimations() ? {} : rummyAnimatedStyle}>
                        <TouchableOpacity
                          style={[
                            styles.rummyButton,
                            isRummy && styles.rummyButtonActive,
                            {
                              borderColor: colors.success,
                              backgroundColor: isRummy ? colors.success : 'transparent',
                            },
                          ]}
                          onPress={() => toggleRummy(player.id)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`${isRummy ? 'Remove' : 'Mark'} rummy for ${player.name}`}
                          accessibilityHint={getInteractionHint('rummy-toggle')}
                          accessibilityState={{ selected: isRummy }}
                        >
                          <ThemedText
                            type="label"
                            style={[
                              styles.rummyButtonText,
                              {
                                color: isRummy ? colors.textInverse : colors.success,
                              },
                            ]}
                            accessibilityElementsHidden={true}
                          >
                            RUMMY
                          </ThemedText>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  </ScaleInView>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <FadeInView delay={300} style={styles.footer}>
            <ThemedButton
              title="Cancel"
              variant="outline"
              onPress={handleCancel}
              style={{ flex: 1 }}
            />
            
            <ThemedButton
              title={editingRound ? 'Update Scores' : 'Add Scores'}
              variant="primary"
              onPress={validateAndSubmit}
              loading={loading}
              disabled={loading}
              style={{ flex: 2 }}
            />
          </FadeInView>
          </ThemedView>
        </KeyboardNavigationView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelHeaderButton: {
    paddingVertical: 8,
  },
  cancelHeaderText: {
    color: '#6B7280',
    fontSize: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  submitHeaderButton: {
    paddingVertical: 8,
  },
  submitHeaderText: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  playersContainer: {
    gap: 16,
  },
  playerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  currentTotal: {
    fontSize: 14,
    opacity: 0.7,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'white',
    fontWeight: '500',
  },
  scoreInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
    borderColor: '#E5E7EB',
  },
  rummyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  rummyButtonActive: {
    backgroundColor: '#10B981',
  },
  rummyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  rummyButtonTextActive: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});