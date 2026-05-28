import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.capy}>🦫✨</Text>
          <Text style={styles.title}>Giới Hạn Cảnh Báo Free</Text>
          <Text style={styles.desc}>
            Tài khoản Free chỉ được bật tối đa 3 cảnh báo ngân sách. Hãy nâng cấp Premium để bật cảnh báo không giới hạn cho mọi mục chi tiêu!
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => alert('Nâng cấp thành công!')}>
            <Text style={styles.btnText}>Nâng Cấp Premium (12k/tháng)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Để sau</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(35, 25, 26, 0.4)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 28, padding: 24, width: 280, alignItems: 'center' },
  capy: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#864e5a', marginBottom: 8, fontFamily: 'Plus Jakarta Sans' },
  desc: { fontSize: 12, color: '#837375', textAlign: 'center', marginBottom: 16, lineHeight: 1.4, fontFamily: 'Plus Jakarta Sans' },
  btn: { backgroundColor: '#864e5a', borderRadius: 9999, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center', marginBottom: 8 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: 'Plus Jakarta Sans' },
  closeBtn: { marginTop: 4 },
  closeText: { fontSize: 11, color: '#837375', fontFamily: 'Plus Jakarta Sans' }
});
