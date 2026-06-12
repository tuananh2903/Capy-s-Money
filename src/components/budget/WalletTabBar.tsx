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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
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
  scrollView: { 
    flexGrow: 0, 
    marginVertical: 8,
    minHeight: 48,
  },
  contentContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 9999, 
    borderWidth: 1, 
    borderColor: '#FFDDE2', 
    marginRight: 8, 
    backgroundColor: '#fff',
    shadowColor: 'rgba(0,0,0,0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: { 
    backgroundColor: '#864e5a', 
    borderColor: '#864e5a' 
  },
  tabText: { 
    fontSize: 13, 
    color: '#837375', 
    fontFamily: 'Plus Jakarta Sans' 
  },
  activeTabText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  }
});

