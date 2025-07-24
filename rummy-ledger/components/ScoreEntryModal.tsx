import React, { useState, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Player, PlayerScore } from '@/src/types';

interface ScoreEntryModalProps {
  visible: boolean;
  players: Player[];
  roundNumber: number;
  onSubmit: (scores: PlayerScore[]) => void;
  onCancel: () => void;
}

export default function ScoreEntryModal({
  visible,
  players,
  roundNumber,
  onSubmit,
  onCancel,
}: ScoreEntryModalProps) {
  const [scores, setScores] = useState<{ [playerId: string]: string }>({});
  const [rummyPlayers, setRummyPlayers] = useState<Set<string>>(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setScores({});
      setRummyPlayers(new Set());
    }
  }, [visible]);

  const updateScore = (playerId: string, score: string) => {
    // Only allow numeric input
    const numericScore = score.replace(/[^0-9]/g, '');
    
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
  };

  const toggleRummy = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newRummyPlayers = new Set(rummyPlayers);
    if (newRummyPlayers.has(playerId)) {
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
  };

  const validateAndSubmit = () => {
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
      Alert.alert(
        'Missing Scores',
        `Please enter scores for: ${missingScores.join(', ')}`
      );
      return;
    }

    // Submit scores with haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <ThemedText type="subtitle" style={styles.title}>
                Round {roundNumber} Scores
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Enter scores for each player
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
              {players.map((player) => {
                const isRummy = rummyPlayers.has(player.id);
                const scoreValue = scores[player.id] || '';

                return (
                  <View key={player.id} style={styles.playerContainer}>
                    <View style={styles.playerHeader}>
                      <ThemedText style={styles.playerName}>
                        {player.name}
                      </ThemedText>
                      <ThemedText style={styles.currentTotal}>
                        Current: {player.totalScore}
                      </ThemedText>
                    </View>

                    <View style={styles.scoreInputContainer}>
                      <TextInput
                        style={[
                          styles.scoreInput,
                          isRummy && styles.scoreInputDisabled,
                        ]}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        value={isRummy ? '0' : scoreValue}
                        onChangeText={(text) => updateScore(player.id, text)}
                        keyboardType="numeric"
                        maxLength={3}
                        editable={!isRummy}
                        selectTextOnFocus
                      />
                      
                      <TouchableOpacity
                        style={[
                          styles.rummyButton,
                          isRummy && styles.rummyButtonActive,
                        ]}
                        onPress={() => toggleRummy(player.id)}
                        activeOpacity={0.7}
                      >
                        <ThemedText
                          style={[
                            styles.rummyButtonText,
                            isRummy && styles.rummyButtonTextActive,
                          ]}
                        >
                          RUMMY
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={validateAndSubmit}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.submitButtonText}>
                Add Scores
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
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