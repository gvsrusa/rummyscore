import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { GameProvider } from '@/src/context/GameContext';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GameProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
        <StatusBar style="auto" />
      </ThemeProvider>
    </GameProvider>
  );
}
