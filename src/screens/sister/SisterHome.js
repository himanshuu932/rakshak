// screens/sister/SisterHome.js
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  Modal,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Platform,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';
import { requestPermissions } from '../../utils/smsUtils';

// Import custom icons or use emojis
const CloseIcon = () => <Text style={{ fontSize: 24 }}>✖️</Text>;
const EditIcon = () => <Text style={{ fontSize: 20 }}>✏️</Text>;
const TrashIcon = () => <Text style={{ fontSize: 20 }}>🗑️</Text>;
const AddIcon = () => <Text style={{ fontSize: 24, color: 'white' }}>➕</Text>;
const SaveIcon = () => <Text style={{ fontSize: 20, color: 'white' }}>✔️</Text>;
const ResetIcon = () => <Text style={{ fontSize: 20, color: '#FFFFFF' }}>🔄</Text>;

const TRUSTED_LIST_KEY = 'trustedList';
const { SettingsModule } = NativeModules;

const blueTheme = {
  primary: '#1E90FF',
  secondary: '#ADD8E6',
  background: '#F0F8FF',
  textPrimary: '#1a1a1a',
  textSecondary: '#555',
  buttonText: '#FFFFFF',
  danger: '#dc3545',
  inputBorder: '#B0C4DE',
  cardBackground: '#FFFFFF',
  modalOverlay: 'rgba(0,0,0,0.5)',
};

export default function SisterHome({ resetMode }) {
  const [trustedList, setTrustedList] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const perms = [
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const granted = await requestPermissions(perms);
      setLoadingStatus(granted ? 'Ready — listening in background.' : 'Permissions denied.');

      try {
        const raw = await AsyncStorage.getItem(TRUSTED_LIST_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setTrustedList(parsed);
        }
      } catch (e) {
        console.warn('Failed to load trustedList', e);
      }
      setIsLoading(false);
    })();
  }, []);

  const persistList = async (list) => {
    try {
      await AsyncStorage.setItem(TRUSTED_LIST_KEY, JSON.stringify(list));
      setTrustedList(list);
    } catch (e) {
      console.warn('Failed to save to AsyncStorage', e);
    }

    try {
      if (SettingsModule && SettingsModule.setTrustedList) {
        await SettingsModule.setTrustedList(JSON.stringify(list));
      } else {
        console.warn('SettingsModule.setTrustedList not available');
      }
    } catch (e) {
      console.warn('Failed to call SettingsModule.setTrustedList', e);
    }
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setPhoneInput('');
    setKeywordInput('');
    setModalVisible(true);
  };

  const openEditModal = (index) => {
    const entry = trustedList[index];
    setEditingIndex(index);
    setPhoneInput(entry.phone);
    setKeywordInput(entry.keyword);
    setModalVisible(true);
  };

  const handleSaveEntry = async () => {
    const phone = phoneInput.trim();
    const keyword = keywordInput.trim();
    if (!phone || !keyword) {
      return Alert.alert('Error', 'Both phone and keyword are required.');
    }

    if (editingIndex === null) {
      const exists = trustedList.some((e) => e.phone === phone);
      if (exists) {
        return Alert.alert('Error', 'This phone is already in your trusted list. Please edit the existing entry.');
      }
      const next = [...trustedList, { phone, keyword }];
      await persistList(next);
      Alert.alert('Success', 'Trusted sender added successfully!');
    } else {
      const next = trustedList.slice();
      next[editingIndex] = { phone, keyword };
      await persistList(next);
      Alert.alert('Success', 'Trusted sender updated successfully!');
    }

    setModalVisible(false);
  };

  const handleRemove = (index) => {
    Alert.alert('Remove Trusted Sender', `Are you sure you want to remove ${trustedList[index].phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const next = trustedList.filter((_, i) => i !== index);
          await persistList(next);
          Alert.alert('Removed', 'Trusted sender removed.');
        },
      },
    ]);
  };

  const handleResetRole = () => {
    Alert.alert('Reset role', 'Are you sure you want to go back to role selection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('appMode');
          if (resetMode) resetMode();
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🧑‍🤝‍🧑</Text>
        </View>
        <View style={{ marginLeft: 15 }}>
          <Text style={[styles.phone, { color: blueTheme.textPrimary }]}>{item.phone}</Text>
          <Text style={[styles.keyword, { color: blueTheme.textSecondary }]}>Keyword: {item.keyword}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openEditModal(index)} style={[styles.actionButton, { backgroundColor: blueTheme.secondary }]}>
          <EditIcon />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemove(index)} style={[styles.actionButton, { backgroundColor: blueTheme.danger }]}>
          <TrashIcon />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: blueTheme.background }]}>
      <View style={styles.topBar}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: blueTheme.primary }]}>Trusted Senders</Text>
          <Text style={[styles.sub, { color: blueTheme.textSecondary }]}>({trustedList.length})</Text>
        </View>
        <TouchableOpacity onPress={handleResetRole} style={[styles.resetButton, { backgroundColor: blueTheme.danger }]}>
          <ResetIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: blueTheme.textPrimary }]}></Text>
        <Text style={[styles.listCount, { color: blueTheme.textSecondary }]}></Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={blueTheme.primary} />
        </View>
      ) : (
        <FlatList
          data={trustedList}
          keyExtractor={(item, i) => `${item.phone}_${i}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={[styles.emptyStateText, { color: blueTheme.textSecondary }]}>No trusted senders yet.</Text>
              <Text style={{ textAlign: 'center', color: blueTheme.textSecondary }}>Add family members who can request your location.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: blueTheme.primary }]}
        onPress={openAddModal}
      >
        <AddIcon />
        <Text style={styles.addButtonText}>Add Trusted Sender</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex === null ? 'Add Trusted Sender' : 'Edit Trusted Sender'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: blueTheme.textPrimary }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { borderColor: blueTheme.inputBorder }]}
              placeholder="e.g., +91..."
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
            />
            <Text style={[styles.label, { color: blueTheme.textPrimary }]}>Secret Keyword</Text>
            <TextInput
              style={[styles.input, { borderColor: blueTheme.inputBorder }]}
              placeholder="e.g., PETAL12"
              value={keywordInput}
              onChangeText={setKeywordInput}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.modalSaveButton, { backgroundColor: blueTheme.primary }]}
              onPress={handleSaveEntry}
            >
              <SaveIcon />
              <Text style={styles.modalSaveButtonText}>
                {editingIndex === null ? 'Add Sender' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sub: {
    fontSize: 14,
    marginTop: 5,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listCount: {
    fontSize: 16,
    marginLeft: 10,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: blueTheme.cardBackground,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: blueTheme.placeholderBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  phone: {
    fontSize: 16,
    fontWeight: '600',
  },
  keyword: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 10,
  },
  addButtonText: {
    color: blueTheme.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dangerZone: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
  },
  dangerButton: {
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: blueTheme.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: blueTheme.cardBackground,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: blueTheme.textPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    gap: 8,
  },
  modalSaveButtonText: {
    color: blueTheme.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});