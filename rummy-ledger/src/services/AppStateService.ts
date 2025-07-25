import { AppState, AppStateStatus } from 'react-native';
import { StorageService } from './StorageService';

export class AppStateService {
  private static instance: AppStateService;
  private storageService: StorageService;
  private appStateSubscription: any;
  private lastActiveTime: number = Date.now();

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  static getInstance(): AppStateService {
    if (!AppStateService.instance) {
      AppStateService.instance = new AppStateService();
    }
    return AppStateService.instance;
  }

  initialize(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
    
    // Restore app state on initialization
    this.restoreAppState();
  }

  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    try {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background, save current state
        await this.saveAppState();
      } else if (nextAppState === 'active') {
        // App is becoming active, check if we need to restore state
        const timeSinceBackground = Date.now() - this.lastActiveTime;
        
        // If app was in background for more than 5 minutes, consider it a fresh start
        if (timeSinceBackground > 5 * 60 * 1000) {
          await this.handleLongBackgroundReturn();
        } else {
          await this.restoreAppState();
        }
        
        this.lastActiveTime = Date.now();
      }
    } catch (error) {
      console.error('Error handling app state change:', error);
    }
  };

  private async saveAppState(): Promise<void> {
    try {
      const appState = {
        lastActiveTime: Date.now(),
        timestamp: new Date().toISOString(),
      };
      
      await this.storageService.saveData('@RummyLedger:appState', appState);
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  }

  private async restoreAppState(): Promise<void> {
    try {
      const appState = await this.storageService.loadData('@RummyLedger:appState');
      
      if (appState && appState.lastActiveTime) {
        this.lastActiveTime = appState.lastActiveTime;
      }
    } catch (error) {
      console.error('Error restoring app state:', error);
    }
  }

  private async handleLongBackgroundReturn(): Promise<void> {
    try {
      // For long background returns, we might want to:
      // 1. Refresh any cached data
      // 2. Check for data consistency
      // 3. Clear sensitive information if needed
      
      console.log('App returned from long background, performing cleanup...');
      
      // Verify current game state integrity
      const currentGame = await this.storageService.loadCurrentGame();
      if (currentGame) {
        // Validate game state and fix any inconsistencies
        await this.validateAndFixGameState(currentGame);
      }
    } catch (error) {
      console.error('Error handling long background return:', error);
    }
  }

  private async validateAndFixGameState(game: any): Promise<void> {
    try {
      // Basic validation of game state
      if (!game.id || !game.players || !Array.isArray(game.rounds)) {
        console.warn('Invalid game state detected, clearing...');
        await this.storageService.clearCurrentGame();
        return;
      }

      // Recalculate totals to ensure consistency
      let hasInconsistency = false;
      
      for (const player of game.players) {
        const calculatedTotal = game.rounds.reduce((total: number, round: any) => {
          const playerScore = round.scores.find((s: any) => s.playerId === player.id);
          return total + (playerScore ? playerScore.score : 0);
        }, 0);
        
        if (player.totalScore !== calculatedTotal) {
          player.totalScore = calculatedTotal;
          hasInconsistency = true;
        }
      }

      if (hasInconsistency) {
        console.log('Fixed game state inconsistencies');
        await this.storageService.saveCurrentGame(game);
      }
    } catch (error) {
      console.error('Error validating game state:', error);
    }
  }

  async getAppMetrics(): Promise<{
    lastActiveTime: number;
    sessionDuration: number;
    backgroundTime: number;
  }> {
    const now = Date.now();
    const backgroundTime = now - this.lastActiveTime;
    
    return {
      lastActiveTime: this.lastActiveTime,
      sessionDuration: now - this.lastActiveTime,
      backgroundTime,
    };
  }
}

export const appStateService = AppStateService.getInstance();