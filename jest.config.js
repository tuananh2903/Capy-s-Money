module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ['/node_modules/', '/claude-mem/', '/everything-claude-code/', '/superpowers/', '/tests/e2e/'],
  testTimeout: 15000,
  setupFiles: ["<rootDir>/tests/jestSetup.js"],
  moduleNameMapper: {
    // Mock @expo/vector-icons — native icon font không resolve được trong Jest environment
    '@expo/vector-icons': '<rootDir>/tests/__mocks__/expo-vector-icons.js',
  },
};

