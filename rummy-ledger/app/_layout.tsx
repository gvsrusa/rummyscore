import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { GameProvider } from '@/src/context/GameContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { accessibilityService } from '@/src/services/AccessibilityService';
import { appStateService } from '@/src/services/AppStateService';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colorScheme, colors } = useTheme();
  
  // Create navigation theme based on our theme
  const navigationTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <GameProvider>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen 
            name="game-setup" 
            options={{ 
              title: 'New Game',
              headerShown: true,
              presentation: 'card'
            }} 
          />
          <Stack.Screen 
            name="game-play" 
            options={{ 
              title: 'Game in Progress',
              headerShown: true,
              headerBackVisible: false,
              presentation: 'card'
            }} 
          />
          <Stack.Screen 
            name="history" 
            options={{ 
              title: 'Game History',
              headerShown: true,
              presentation: 'card'
            }} 
          />
          <Stack.Screen 
            name="score-entry" 
            options={{ 
              title: 'Enter Scores',
              presentation: 'modal',
              headerShown: true
            }} 
          />
          <Stack.Screen 
            name="game-details" 
            options={{ 
              title: 'Game Details',
              presentation: 'modal',
              headerShown: true
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </GameProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await accessibilityService.initialize();
        appStateService.initialize();
      } catch (error) {
        console.warn('Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      appStateService.cleanup();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
