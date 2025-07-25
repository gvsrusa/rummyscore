import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useGame } from '@/src/context/GameContext';
import { Game } from '@/src/types';

type FilterType = 'all' | 'completed' | 'with-target' | 'recent';

export default function HistoryScreen() {
  const { gameHistory } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleGamePress = (game: Game) => {
    router.push({
      pathname: '/game-details',
      params: { gameId: game.id },
    });
  };

  // Filter and search logic
  const filteredGames = useMemo(() => {
    let filtered = [...gameHistory];

    // Apply filter
    switch (filterType) {
      case 'completed':
        filtered = filtered.filter(game => game.status === 'completed');
        break;
      case 'with-target':
        filtered = filtered.filter(game => game.targetScore !== undefined);
        break;
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(game => new Date(game.createdAt) >= oneWeekAgo);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(game => 
        game.players.some(player => 
          player.name.toLowerCase().includes(query)
        ) ||
        (game.winner && game.winner.toLowerCase().includes(query)) ||
        new Date(game.createdAt).toLocaleDateString().includes(query)
      );
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [gameHistory, searchQuery, filterType]);

  const getFilterLabel = (type: FilterType): string => {
    switch (type) {
      case 'all': return 'All Games';
      case 'completed': return 'Completed';
      case 'with-target': return 'With Target';
      case 'recent': return 'Recent (7 days)';
      default: return 'All Games';
    }
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

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <ThemedText style={styles.filterModalTitle}>Filter Games</ThemedText>
          
          {(['all', 'completed', 'with-target', 'recent'] as FilterType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterOption,
                filterType === type && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilterType(type);
                setShowFilterModal(false);
              }}
            >
              <ThemedText
                style={[
                  styles.filterOptionText,
                  filterType === type && styles.filterOptionTextSelected,
                ]}
              >
                {getFilterLabel(type)}
              </ThemedText>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.filterCancelButton}
            onPress={() => setShowFilterModal(false)}
          >
            <ThemedText style={styles.filterCancelText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      {gameHistory.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Search and Filter Header */}
          <View style={styles.searchHeader}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by player name, winner, or date..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <ThemedText style={styles.filterButtonText}>
                {getFilterLabel(filterType)}
              </ThemedText>
              <ThemedText style={styles.filterButtonIcon}>▼</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Results Summary */}
          <View style={styles.resultsHeader}>
            <ThemedText style={styles.resultsText}>
              {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found
            </ThemedText>
          </View>

          {filteredGames.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <ThemedText style={styles.noResultsTitle}>No Games Found</ThemedText>
              <ThemedText style={styles.noResultsMessage}>
                Try adjusting your search or filter criteria
              </ThemedText>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
              >
                <ThemedText style={styles.clearFiltersText}>Clear All Filters</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredGames}
              renderItem={renderGameItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}

          {renderFilterModal()}
        </>
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
  searchHeader: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonIcon: {
    fontSize: 12,
    opacity: 0.6,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  resultsText: {
    fontSize: 14,
    opacity: 0.6,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  noResultsMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  clearFiltersButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    minWidth: 250,
    maxWidth: 300,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#1E3A8A',
  },
  filterOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  filterOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  filterCancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterCancelText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
  },
});