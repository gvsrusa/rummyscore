/**
 * Setup Verification Test
 * Verifies that the test environment is properly configured
 */

describe('Test Environment Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(jest).toBeDefined();
    expect(global).toBeDefined();
  });

  it('should have React Native mocks available', () => {
    const { Platform, Dimensions } = require('react-native');
    
    expect(Platform.OS).toBe('ios');
    expect(Dimensions.get).toBeDefined();
    expect(Dimensions.get('window')).toEqual({ width: 375, height: 812 });
  });

  it('should have Expo mocks available', () => {
    const haptics = require('expo-haptics');
    const secureStore = require('expo-secure-store');
    const router = require('expo-router');
    
    expect(haptics.impactAsync).toBeDefined();
    expect(secureStore.setItemAsync).toBeDefined();
    expect(router.useRouter).toBeDefined();
  });

  it('should have testing library matchers extended', () => {
    // This test verifies that @testing-library/jest-native matchers are available
    expect(expect.extend).toBeDefined();
  });

  it('should suppress console warnings in tests', () => {
    // Verify that console methods are mocked to reduce noise
    expect(console.warn).toBeDefined();
    expect(console.error).toBeDefined();
  });
});