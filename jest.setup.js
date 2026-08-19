// Reanimated ships an official jest mode: worklets run on the JS thread and the
// native module is stubbed, so components using animations can render in tests.
require('react-native-reanimated').setUpTests();

// AsyncStorage is a native module; tests use its official in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// react-native's auto-mock leaves AppState.currentState as a jest.fn(), but the
// hooks under test read it as a status string. Provide a minimal faithful mock.
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  default: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Official mock: screens render without wrapping every test in a provider.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Haptics calls chain .catch() on the returned promise, so the mocks must
// resolve — jest's automock would return undefined and crash on press.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// expo-image is native; a View passthrough keeps props (onError etc.) reachable
// so tests can drive load-failure paths directly.
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props) => React.createElement(View, { testID: 'expo-image', ...props }),
  };
});
