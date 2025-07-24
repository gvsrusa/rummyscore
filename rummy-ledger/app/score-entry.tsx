import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGame } from '@/src/context/GameContext';
import { PlayerScore } from '@/src/types';

export default function ScoreEntryScreen() {
  const { currentGame, addRound } = useGame();
  const [scores, setScores] = useState<{ [playerId: string]: string }>({});
  const [rummyPlayers, setRummyPlayers] = useState<Set<string>>(new Set());

  if (!currentGame) {
    router.replace('/');
    return null;
  }

  const updateScore = (playerId: string, score: string) => {
    // Remove from rummy if manually entering score
    if (score && rummyPlayers.has(playerId)) {
      const newRummyPlayers = new Set(rummyPlayers);
      newRummyPlayers.delete(playerId);
      setRummyPlayers(newRummyPlayers);
    }

    setScores(prev => ({
      ...prev,
      [playerId]: score,
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

    for (const player of currentGame.players) {
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

    // Submit scores
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addRound(playerScores);
    router.back();
  };

  const handleCancel = () => {
    if (Object.keys(scores).length > 0 || rummyPlayers.size > 0) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard the entered scores?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Round {currentGame.rounds.length + 1} Scores
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter scores for each player
          </ThemedText>
        </View>

        <View style={styles.playersContainer}>
          {currentGame.players.map((player) => {
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
                    value={isRummy ? '0' : scoreValue}
                    onChangeText={(text) => updateScore(player.id, text)}
                    keyboardType="numeric"
                    maxLength={3}
                    editable={!isRummy}
                  />
                  
                  <TouchableOpacity
                    style={[
                      styles.rummyButton,
                      isRummy && styles.rummyButtonActive,
                    ]}
                    onPress={() => toggleRummy(player.id)}
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

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={validateAndSubmit}
        >
          <ThemedText style={styles.submitButtonText}>
            Add Scores
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  playersContainer: {
    gap: 20,
  },
  playerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
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
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  scoreInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
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