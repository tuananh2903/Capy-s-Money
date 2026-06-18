jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-secure-store with in-memory store for tests
const mockSecureStoreMap = new Map();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key) => Promise.resolve(mockSecureStoreMap.get(key) ?? null)),
  setItemAsync: jest.fn((key, value) => { mockSecureStoreMap.set(key, value); return Promise.resolve(); }),
  deleteItemAsync: jest.fn((key) => { mockSecureStoreMap.delete(key); return Promise.resolve(); }),
}));

