// screens/brother/BrotherHome.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { SisterSettingsModule } = NativeModules || {};

const SISTERS_KEY = 'sisters';

const blueTheme = {
  primary: '#1E90FF', // Dodger Blue
  secondary: '#ADD8E6', // Light Blue
  background: '#F0F8FF', // Alice Blue
  textPrimary: '#1a1a1a',
  textSecondary: '#555',
  buttonText: '#FFFFFF',
  danger: '#dc3545',
  inputBorder: '#B0C4DE', // Light Steel Blue
  cardBackground: '#FFFFFF',
  modalOverlay: 'rgba(0,0,0,0.5)',
};

const SisterListItem = ({ name, phone, onPress, onDelete }) => (
  <TouchableOpacity style={styles.wardItem} onPress={onPress}>
    <View style={styles.wardInfo}>
      <View style={styles.wardAvatar}>
        <Text style={styles.wardAvatarText}>👧</Text>
      </View>
      <View>
        <Text style={styles.wardName}>{name}</Text>
        <Text style={styles.wardPhone}>{phone}</Text>
      </View>
    </View>
    <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
      <Text style={styles.deleteButtonText}>🗑️</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function BrotherHome({ navigation }) {
  const [sisters, setSisters] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation]);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(SISTERS_KEY);
      setSisters(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.warn('Failed to load wards', e);
      setSisters([]);
    }
  }

  const persistToNative = async (list) => {
    try {
      if (SisterSettingsModule && SisterSettingsModule.setSisterList) {
        await SisterSettingsModule.setSisterList(JSON.stringify(list));
      }
    } catch (e) {
      console.warn('SisterSettingsModule.setSisterList failed', e);
    }
  };

  const saveList = async (list) => {
    try {
      await AsyncStorage.setItem(SISTERS_KEY, JSON.stringify(list));
      setSisters(list);
      await persistToNative(list);
    } catch (e) {
      console.warn('Failed to save wards', e);
      Alert.alert('Save Error', 'Could not save ward list.');
    }
  };

  const handleAdd = async () => {
    const nm = name.trim();
    const ph = phone.trim();
    const cd = code.trim();
    if (!nm || !ph) {
      Alert.alert('Validation', 'Please enter both name and phone.');
      return;
    }

    if (sisters.some((s) => s.phone === ph)) {
      Alert.alert('Duplicate', 'A ward with this phone number already exists.');
      return;
    }

    const next = [...sisters, { name: nm, phone: ph, code: cd }];
    await saveList(next);
    setName('');
    setPhone('');
    setCode('');
    setAdding(false);
  };

  const handleRemove = (index) => {
    Alert.alert('Remove Ward', `Remove ${sisters[index].name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const next = sisters.filter((_, i) => i !== index);
          await saveList(next);
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <SisterListItem
      name={item.name}
      phone={item.phone}
      onPress={() => navigation.navigate('SisterDetail', { sister: item })}
      onDelete={() => handleRemove(index)}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: blueTheme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: blueTheme.primary }]}>Your Wards</Text>
      </View>
      <FlatList
        data={sisters}
        keyExtractor={(item) => item.phone}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>➕</Text>
            <Text style={[styles.emptyStateText, { color: blueTheme.textSecondary }]}>
              You haven't added any wards yet.
            </Text>
            <Text style={{ color: blueTheme.textSecondary, textAlign: 'center' }}>
              Add a new family member to get started.
            </Text>
          </View>
        }
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
      />
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: blueTheme.primary }]}
        onPress={() => setAdding(true)}
      >
        <Text style={styles.addButtonIcon}>➕</Text>
        <Text style={styles.addButtonText}>Add New Ward</Text>
      </TouchableOpacity>

      <Modal visible={adding} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Ward</Text>
              <TouchableOpacity onPress={() => setAdding(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>✖️</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Name"
              value={name}
              onChangeText={setName}
              style={[styles.input, { borderColor: blueTheme.inputBorder }]}
              placeholderTextColor={blueTheme.textSecondary}
            />
            <TextInput
              placeholder="Phone (e.g., +91...)"
              value={phone}
              onChangeText={setPhone}
              style={[styles.input, { borderColor: blueTheme.inputBorder }]}
              keyboardType="phone-pad"
              placeholderTextColor={blueTheme.textSecondary}
            />
            <TextInput
              placeholder="Secret code (optional)"
              value={code}
              onChangeText={setCode}
              style={[styles.input, { borderColor: blueTheme.inputBorder }]}
              autoCapitalize="characters"
              placeholderTextColor={blueTheme.textSecondary}
            />
            <TouchableOpacity
              style={[styles.modalAddButton, { backgroundColor: blueTheme.primary }]}
              onPress={handleAdd}
            >
              <Text style={styles.modalAddButtonText}>Add Ward</Text>
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
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  wardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: blueTheme.cardBackground,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: blueTheme.placeholderBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  wardAvatarText: {
    fontSize: 24,
  },
  wardName: {
    fontSize: 18,
    fontWeight: '600',
    color: blueTheme.textPrimary,
  },
  wardPhone: {
    fontSize: 14,
    color: blueTheme.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
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
  addButtonIcon: {
    fontSize: 24,
    color: blueTheme.buttonText,
  },
  addButtonText: {
    color: blueTheme.buttonText,
    fontSize: 18,
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
  modalCloseButton: {
    padding: 5,
  },
  modalCloseButtonText: {
    fontSize: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: blueTheme.textPrimary,
  },
  modalAddButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalAddButtonText: {
    color: blueTheme.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});