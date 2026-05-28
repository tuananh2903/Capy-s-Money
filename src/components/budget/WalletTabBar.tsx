import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Wallet {
  id: string;
  name: string;
}

interface WalletTabBarProps {
  wallets: Wallet[];
  activeWalletId: string;
  onChangeWallet: (id: string) => void;
}

export const WalletTabBar: React.FC<WalletTabBarProps> = ({ wallets, activeWalletId, onChangeWallet }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {wallets.map((wallet) => (
        <TouchableOpacity
          key={wallet.id}
          style={[styles.tab, activeWalletId === wallet.id && styles.activeTab]}
          onPress={() => onChangeWallet(wallet.id)}
        >
          <Text style={[styles.tabText, activeWalletId === wallet.id && styles.activeTabText]}>
            {wallet.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginVertical: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999, borderWidth: 1, borderColor: '#FFDDE2', marginRight: 8, backgroundColor: '#fff' },
  activeTab: { backgroundColor: '#864e5a', borderColor: '#864e5a' },
  tabText: { fontSize: 13, color: '#837375', fontFamily: 'Plus Jakarta Sans' },
  activeTabText: { color: '#fff', fontWeight: 'bold' }
});
