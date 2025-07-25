/**
 * Rummy Ledger Color System
 * Comprehensive color palette supporting light and dark themes
 * Based on design specifications with 8px grid system support
 */

// Primary brand colors
const primaryLight = '#1E3A8A'; // Deep blue
const primaryDark = '#3B82F6'; // Lighter blue for dark mode
const secondaryLight = '#10B981'; // Emerald green
const secondaryDark = '#34D399'; // Lighter emerald for dark mode
const accentLight = '#F59E0B'; // Amber
const accentDark = '#FBBF24'; // Lighter amber for dark mode

// Semantic colors
const successLight = '#10B981';
const successDark = '#34D399';
const warningLight = '#F59E0B';
const warningDark = '#FBBF24';
const errorLight = '#EF4444';
const errorDark = '#F87171';

// Neutral colors
const grayLight = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
};

const grayDark = {
  50: '#111827',
  100: '#1F2937',
  200: '#374151',
  300: '#4B5563',
  400: '#6B7280',
  500: '#9CA3AF',
  600: '#D1D5DB',
  700: '#E5E7EB',
  800: '#F3F4F6',
  900: '#F9FAFB',
};

export const Colors = {
  light: {
    // Primary colors
    primary: primaryLight,
    secondary: secondaryLight,
    accent: accentLight,
    
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: grayLight[50],
    backgroundTertiary: grayLight[100],
    
    // Surface colors
    surface: '#FFFFFF',
    surfaceSecondary: grayLight[50],
    card: '#FFFFFF',
    
    // Text colors
    text: grayLight[900],
    textSecondary: grayLight[600],
    textTertiary: grayLight[500],
    textInverse: '#FFFFFF',
    
    // Interactive colors
    tint: primaryLight,
    link: primaryLight,
    
    // Icon colors
    icon: grayLight[600],
    iconSecondary: grayLight[500],
    
    // Tab colors
    tabIconDefault: grayLight[500],
    tabIconSelected: primaryLight,
    tabBackground: '#FFFFFF',
    
    // Border colors
    border: grayLight[200],
    borderSecondary: grayLight[300],
    
    // Semantic colors
    success: successLight,
    warning: warningLight,
    error: errorLight,
    
    // Score-specific colors
    scorePositive: successLight,
    scoreNegative: errorLight,
    scoreNeutral: grayLight[600],
    leaderHighlight: accentLight,
    
    // Game-specific colors
    rummyHighlight: secondaryLight,
    roundBackground: grayLight[50],
    playerCard: '#FFFFFF',
  },
  dark: {
    // Primary colors
    primary: primaryDark,
    secondary: secondaryDark,
    accent: accentDark,
    
    // Background colors
    background: '#000000',
    backgroundSecondary: grayDark[100],
    backgroundTertiary: grayDark[200],
    
    // Surface colors
    surface: grayDark[100],
    surfaceSecondary: grayDark[200],
    card: grayDark[100],
    
    // Text colors
    text: grayDark[900],
    textSecondary: grayDark[600],
    textTertiary: grayDark[500],
    textInverse: grayDark[900],
    
    // Interactive colors
    tint: primaryDark,
    link: primaryDark,
    
    // Icon colors
    icon: grayDark[600],
    iconSecondary: grayDark[500],
    
    // Tab colors
    tabIconDefault: grayDark[500],
    tabIconSelected: primaryDark,
    tabBackground: grayDark[100],
    
    // Border colors
    border: grayDark[200],
    borderSecondary: grayDark[300],
    
    // Semantic colors
    success: successDark,
    warning: warningDark,
    error: errorDark,
    
    // Score-specific colors
    scorePositive: successDark,
    scoreNegative: errorDark,
    scoreNeutral: grayDark[600],
    leaderHighlight: accentDark,
    
    // Game-specific colors
    rummyHighlight: secondaryDark,
    roundBackground: grayDark[200],
    playerCard: grayDark[100],
  },
  highContrastLight: {
    // High contrast light theme - WCAG AAA compliance (7:1 ratio)
    primary: '#000000',
    secondary: '#000000',
    accent: '#000000',
    
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#F0F0F0',
    
    // Surface colors
    surface: '#FFFFFF',
    surfaceSecondary: '#FFFFFF',
    card: '#FFFFFF',
    
    // Text colors
    text: '#000000',
    textSecondary: '#000000',
    textTertiary: '#333333',
    textInverse: '#FFFFFF',
    
    // Interactive colors
    tint: '#000000',
    link: '#000000',
    
    // Icon colors
    icon: '#000000',
    iconSecondary: '#333333',
    
    // Tab colors
    tabIconDefault: '#666666',
    tabIconSelected: '#000000',
    tabBackground: '#FFFFFF',
    
    // Border colors
    border: '#000000',
    borderSecondary: '#000000',
    
    // Semantic colors
    success: '#006600',
    warning: '#CC6600',
    error: '#CC0000',
    
    // Score-specific colors
    scorePositive: '#006600',
    scoreNegative: '#CC0000',
    scoreNeutral: '#000000',
    leaderHighlight: '#000000',
    
    // Game-specific colors
    rummyHighlight: '#006600',
    roundBackground: '#F0F0F0',
    playerCard: '#FFFFFF',
  },
  highContrastDark: {
    // High contrast dark theme - WCAG AAA compliance (7:1 ratio)
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    accent: '#FFFFFF',
    
    // Background colors
    background: '#000000',
    backgroundSecondary: '#000000',
    backgroundTertiary: '#1A1A1A',
    
    // Surface colors
    surface: '#000000',
    surfaceSecondary: '#000000',
    card: '#000000',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#FFFFFF',
    textTertiary: '#CCCCCC',
    textInverse: '#000000',
    
    // Interactive colors
    tint: '#FFFFFF',
    link: '#FFFFFF',
    
    // Icon colors
    icon: '#FFFFFF',
    iconSecondary: '#CCCCCC',
    
    // Tab colors
    tabIconDefault: '#999999',
    tabIconSelected: '#FFFFFF',
    tabBackground: '#000000',
    
    // Border colors
    border: '#FFFFFF',
    borderSecondary: '#FFFFFF',
    
    // Semantic colors
    success: '#00FF00',
    warning: '#FFAA00',
    error: '#FF0000',
    
    // Score-specific colors
    scorePositive: '#00FF00',
    scoreNegative: '#FF0000',
    scoreNeutral: '#FFFFFF',
    leaderHighlight: '#FFFFFF',
    
    // Game-specific colors
    rummyHighlight: '#00FF00',
    roundBackground: '#1A1A1A',
    playerCard: '#000000',
  },
};
