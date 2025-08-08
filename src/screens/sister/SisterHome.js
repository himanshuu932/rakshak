// screens/sister/SisterHome.js
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  Modal,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Platform,
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';
import { requestPermissions } from '../../utils/smsUtils';

const TRUSTED_LIST_KEY = 'trustedList'; // JS-side storage key
const { SettingsModule } = NativeModules; // native module you already have

export default function SisterHome({ resetMode }) {
  const [trustedList, setTrustedList] = useState([]); // [{ phone, keyword }]
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null => adding
  const [phoneInput, setPhoneInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    (async () => {
      // Request required permissions (RECEIVE_SMS, SEND_SMS, ACCESS_FINE_LOCATION)
      const perms = [
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      // requestPermissions in utils will return true on iOS by default
      const granted = await requestPermissions(perms);
      setLoadingStatus(granted ? 'Ready — listening in background.' : 'Permissions denied.');

      // Load saved list from AsyncStorage
      try {
        const raw = await AsyncStorage.getItem(TRUSTED_LIST_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setTrustedList(parsed);
        }
      } catch (e) {
        console.warn('Failed to load trustedList', e);
      }
    })();
  }, []);

  // Persist to AsyncStorage and to native SharedPreferences via SettingsModule
  const persistList = async (list) => {
    try {
      await AsyncStorage.setItem(TRUSTED_LIST_KEY, JSON.stringify(list));
      setTrustedList(list);
    } catch (e) {
      console.warn('Failed to save to AsyncStorage', e);
    }

    // Push to native SettingsModule so native SmsReceiver can read it
    try {
      if (SettingsModule && SettingsModule.setTrustedList) {
        await SettingsModule.setTrustedList(JSON.stringify(list));
      } else {
        // If native module not present, log quietly
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
      return Alert.alert('Both phone and keyword are required');
    }

    // Basic phone uniqueness check (you can change logic if you prefer duplicates)
    if (editingIndex === null) {
      // adding
      const exists = trustedList.some((e) => e.phone === phone);
      if (exists) {
        return Alert.alert('This phone is already in trusted list. Edit it instead.');
      }
      const next = [...trustedList, { phone, keyword }];
      await persistList(next);
    } else {
      // editing
      const next = trustedList.slice();
      next[editingIndex] = { phone, keyword };
      await persistList(next);
    }

    setModalVisible(false);
  };

  const handleRemove = (index) => {
    Alert.alert('Remove trusted sender', `Remove ${trustedList[index].phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const next = trustedList.filter((_, i) => i !== index);
          await persistList(next);
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.phone}>{item.phone}</Text>
        <Text style={styles.keyword}>Keyword: {item.keyword}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openEditModal(index)} style={styles.actionBtn}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemove(index)} style={[styles.actionBtn, styles.removeBtn]}>
          <Text style={[styles.actionText, { color: 'white' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Responder (Sister)</Text>
      <Text style={styles.sub}>{loadingStatus}</Text>

      <Text style={{ marginTop: 14, marginBottom: 6, fontWeight: '600' }}>Trusted Senders</Text>

      <FlatList
        data={trustedList}
        keyExtractor={(item, i) => `${item.phone}_${i}`}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ color: '#666' }}>No trusted senders yet — add one below.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={{ marginTop: 12 }}>
        <Button title="Add Trusted Sender" onPress={openAddModal} />
      </View>

      <View style={{ marginTop: 18 }}>
        <Button
          title="Reset Role / Back to Setup"
          color="#d9534f"
          onPress={() =>
            Alert.alert('Reset role', 'Go back to role selection?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes',
                style: 'destructive',
                onPress: async () => {
                  await AsyncStorage.removeItem('appMode');
                  if (resetMode) resetMode();
                },
              },
            ])
          }
        />
      </View>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
              {editingIndex === null ? 'Add Trusted Sender' : 'Edit Trusted Sender'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Phone (e.g., +91...)"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              editable={true}
            />

            <TextInput
              style={styles.input}
              placeholder="Secret Keyword (e.g., PETAL12)"
              value={keywordInput}
              onChangeText={setKeywordInput}
              autoCapitalize="characters"
            />

            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title={editingIndex === null ? 'Add' : 'Save'} onPress={handleSaveEntry} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { color: '#666' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 6,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  phone: { fontWeight: '700' },
  keyword: { color: '#555' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginLeft: 8 },
  removeBtn: { backgroundColor: '#ff6b6b', borderWidth: 0 },
  actionText: { color: '#333' },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
});
