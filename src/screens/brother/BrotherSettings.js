// screens/brother/BrotherSettings.js
import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { SisterSettingsModule } = NativeModules || {};

const BROTHER_PROFILE_KEY = 'brotherProfile';
const SISTERS_KEY = 'sisters';
const APP_MODE_KEY = 'appMode';

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
  placeholderBackground: '#E6E6FA', // Lavender
  iconColor: '#4682B4', // Steel Blue
};

const UserPlaceholder = () => (
  <View style={styles.userPlaceholder}>
    <Text style={styles.userPlaceholderText}>👨‍🦱</Text>
  </View>
);

export default function BrotherSettings({ resetMode }) {
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [sisters, setSisters] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingWards, setEditingWards] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await AsyncStorage.getItem(BROTHER_PROFILE_KEY);
      const s = await AsyncStorage.getItem(SISTERS_KEY);
      if (p) setProfile(JSON.parse(p));
      if (s) setSisters(JSON.parse(s));
    })();
  }, []);

  const saveProfile = async () => {
    await AsyncStorage.setItem(BROTHER_PROFILE_KEY, JSON.stringify(profile));
    Alert.alert('Success', 'Guardian profile saved successfully!');
    setEditingProfile(false);
  };

  const saveWards = async (list) => {
    try {
      await AsyncStorage.setItem(SISTERS_KEY, JSON.stringify(list));
      setSisters(list);
      try {
        if (SisterSettingsModule && SisterSettingsModule.setSisterList) {
          await SisterSettingsModule.setSisterList(JSON.stringify(list));
        }
      } catch (e) {
        console.warn('SisterSettingsModule.setSisterList failed', e);
      }
      Alert.alert('Success', 'Wards saved successfully!');
      setEditingWards(false);
    } catch (e) {
      console.warn('Failed to save wards', e);
      Alert.alert('Error', 'Failed to save wards.');
    }
  };

  const updateCodeFor = (phone, code) => {
    setSisters((prev) => prev.map((s) => (s.phone === phone ? { ...s, code } : s)));
  };

  const removeWard = (phone) => {
    Alert.alert('Remove Ward', 'Are you sure you want to remove this ward?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updatedWards = sisters.filter((s) => s.phone !== phone);
          saveWards(updatedWards);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: blueTheme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.header, { color: blueTheme.primary }]}>Guardian Profile</Text>
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <UserPlaceholder />
              <View>
                <Text style={[styles.profileName, { color: blueTheme.textPrimary }]}>{profile.name || 'Set Your Name'}</Text>
                <View style={styles.profileDetail}>
                  <Text style={{ color: blueTheme.textSecondary }}>📞</Text>
                  <Text style={{ color: blueTheme.textSecondary }}>{profile.phone || 'Set Your Phone'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setEditingProfile(!editingProfile)} style={styles.editButton}>
              <Text style={{ color: blueTheme.primary, fontSize: 16 }}>{editingProfile ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          {editingProfile && (
            <View style={styles.editSection}>
              <Text style={[styles.label, { color: blueTheme.textPrimary }]}>Your Name</Text>
              <TextInput
                placeholder="Enter your name"
                value={profile.name}
                onChangeText={(t) => setProfile({ ...profile, name: t })}
                style={[styles.input, { borderColor: blueTheme.inputBorder, color: blueTheme.textPrimary }]}
                placeholderTextColor={blueTheme.textSecondary}
              />
              <Text style={[styles.label, { color: blueTheme.textPrimary }]}>Your Phone Number</Text>
              <TextInput
                placeholder="Enter your phone number"
                value={profile.phone}
                onChangeText={(t) => setProfile({ ...profile, phone: t })}
                style={[styles.input, { borderColor: blueTheme.inputBorder, color: blueTheme.textPrimary }]}
                keyboardType="phone-pad"
                placeholderTextColor={blueTheme.textSecondary}
              />
              <TouchableOpacity style={[styles.button, { backgroundColor: blueTheme.primary }]} onPress={saveProfile}>
                <Text style={styles.buttonText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.header, { marginTop: 30, color: blueTheme.primary }]}>
          Wards <Text style={{ color: blueTheme.textSecondary, fontSize: 16 }}>({sisters.length})</Text>
        </Text>
        <View style={styles.card}>
          <View style={styles.wardsHeader}>
            <Text style={[styles.wardsHeaderText, { color: blueTheme.textPrimary }]}>Manage Wards</Text>
            <TouchableOpacity onPress={() => setEditingWards(!editingWards)} style={styles.editButton}>
              <Text style={{ color: blueTheme.primary, fontSize: 16 }}>{editingWards ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          {sisters.length === 0 && <Text style={{ color: blueTheme.textSecondary, textAlign: 'center', marginTop: 10 }}>Add wards first from the home screen.</Text>}
          {sisters.map((s, index) => (
            <View key={s.phone} style={[styles.wardItem, { borderBottomWidth: index === sisters.length - 1 ? 0 : 1, borderBottomColor: blueTheme.inputBorder }]}>
              <View style={styles.wardInfo}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>👧</Text>
                <View>
                  <Text style={[styles.wardName, { color: blueTheme.textPrimary }]}>{s.name}</Text>
                  <Text style={{ color: blueTheme.textSecondary }}>{s.phone}</Text>
                </View>
              </View>
              {editingWards && (
                <View style={styles.wardActions}>
                  <TouchableOpacity onPress={() => removeWard(s.phone)} style={styles.actionButton}>
                    <Text style={{ color: blueTheme.danger, fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.label, { color: blueTheme.textPrimary, marginBottom: 5 }]}>Secret Code</Text>
                    <TextInput
                      placeholder="Secret code (optional)"
                      value={s.code || ''}
                      onChangeText={(t) => updateCodeFor(s.phone, t)}
                      style={[styles.input, { borderColor: blueTheme.inputBorder, color: blueTheme.textPrimary, marginBottom: 0 }]}
                      placeholderTextColor={blueTheme.textSecondary}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
          {sisters.length > 0 && editingWards && (
            <TouchableOpacity style={[styles.button, { backgroundColor: blueTheme.primary, marginTop: 20 }]} onPress={() => saveWards(sisters)}>
              <Text style={styles.buttonText}>Save Wards</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dangerZone}>
          <Text style={[styles.dangerText, { color: blueTheme.danger }]}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: blueTheme.danger }]}
            onPress={() => {
              Alert.alert('Reset App Role', 'Are you sure you want to switch back to the setup screen? This will erase your current role settings.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Reset',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.removeItem(APP_MODE_KEY);
                    resetMode();
                  },
                },
              ]);
            }}
          >
            <Text style={styles.buttonText}>Reset App Role</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    backgroundColor: blueTheme.cardBackground,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  userPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: blueTheme.placeholderBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPlaceholderText: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
  },
  editSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: blueTheme.inputBorder,
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
  button: {
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
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  wardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  wardsHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  wardItem: {
    paddingVertical: 15,
  },
  wardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wardName: {
    fontSize: 16,
    fontWeight: '600',
  },
  wardActions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f8d7da',
    borderRadius: 10,
  },
  dangerZone: {
    marginTop: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: blueTheme.danger,
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  dangerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    gap: 8,
  },
});