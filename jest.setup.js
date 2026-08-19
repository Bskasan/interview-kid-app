/* eslint-env jest */
// Reanimated ships an official jest mode: worklets run on the JS thread and the
// native module is stubbed, so components using animations can render in tests.
require('react-native-reanimated').setUpTests();

// AsyncStorage is a native module; tests use its official in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
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
