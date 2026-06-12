import React from 'react';
import { render } from '@testing-library/react-native';
import DashboardScreen from '../../src/screens/DashboardScreen';
import { fetchWallets, fetchJars } from '../../src/services/dashboardService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: ({ name }: any) => <View testID={`icon-ionicons-${name}`} />,
    MaterialIcons: ({ name }: any) => <View testID={`icon-material-${name}`} />,
    MaterialCommunityIcons: ({ name }: any) => <View testID={`icon-material-community-${name}`} />,
  };
}, { virtual: true });

jest.mock('../../src/services/dashboardService', () => ({
  fetchWallets: jest.fn(),
  fetchJars: jest.fn(),
  createTransaction: jest.fn(),
  fetchWalletIncome: jest.fn(() => Promise.resolve({ success: true, data: 2500000 })),
  fetchWalletExpense: jest.fn(() => Promise.resolve({ success: true, data: 1500000 })),
  ensureJarsExist: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../../src/services/profileService', () => ({
  fetchProfile: jest.fn(() => Promise.resolve({ success: true, data: { id: 'u1', display_name: 'Capy User' } })),
  updateProfileName: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { email: 'test@example.com', phone: '0123456789' } }, error: null })),
    },
  },
}));

jest.mock('../../src/components/CapyMascot', () => {
  const { View, Text } = require('react-native');
  return function MockCapyMascot() {
    return <View><Text>Mascot</Text></View>;
  };
});

jest.mock('../../src/components/QuickAddBottomSheet', () => {
  const { View, Text } = require('react-native');
  return function MockSheet({ visible }: any) {
    if (!visible) return null;
    return <View><Text>Sheet</Text></View>;
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

describe('DashboardScreen smoke test', () => {
  it('renders without crashing in loading state', () => {
    (fetchWallets as jest.Mock).mockReturnValue(new Promise(() => {}));
    (fetchJars as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    expect(() => {
      render(<DashboardScreen userId="u1" onSignOut={jest.fn()} />);
    }).not.toThrow();
  });
});
