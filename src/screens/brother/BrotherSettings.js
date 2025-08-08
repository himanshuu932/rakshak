// screens/brother/BrotherSettings.js
import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, Text, Button, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
const { SisterSettingsModule } = NativeModules || {}; // optional native module

const BROTHER_PROFILE_KEY = 'brotherProfile';
const SISTERS_KEY = 'sisters';
const APP_MODE_KEY = 'appMode';

export default function BrotherSettings({ resetMode }) {
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [sisters, setSisters] = useState([]);

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
    Alert.alert('Saved', 'Brother profile saved.');
  };

  const saveSisters = async (list) => {
    try {
      await AsyncStorage.setItem(SISTERS_KEY, JSON.stringify(list));
      setSisters(list);
      // Push to native sister prefs so receivers can use it if desired
      try {
        if (SisterSettingsModule && SisterSettingsModule.setSisterList) {
          await SisterSettingsModule.setSisterList(JSON.stringify(list));
        }
      } catch (e) {
        console.warn('SisterSettingsModule.setSisterList failed', e);
      }
      Alert.alert('Saved', 'Sisters saved.');
    } catch (e) {
      console.warn('Failed to save sisters', e);
      Alert.alert('Error', 'Failed to save sisters.');
    }
  };

  const updateCodeFor = (phone, code) => {
    setSisters((prev) => prev.map((s) => (s.phone === phone ? { ...s, code } : s)));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Brother Profile</Text>
        <TextInput placeholder="Your name" value={profile.name} onChangeText={(t) => setProfile({ ...profile, name: t })} style={styles.input} />
        <TextInput placeholder="Your phone" value={profile.phone} onChangeText={(t) => setProfile({ ...profile, phone: t })} style={styles.input} keyboardType="phone-pad" />
        <View style={{ marginVertical: 8 }}>
          <Button title="Save Profile" onPress={saveProfile} />
        </View>

        <Text style={[styles.header, { marginTop: 18 }]}>Sisters & Secret Codes</Text>
        {sisters.length === 0 && <Text style={{ color: '#666' }}>Add sisters first from Home.</Text>}
        {sisters.map((s) => (
          <View key={s.phone} style={{ marginVertical: 8 }}>
            <Text style={{ fontWeight: '600' }}>{s.name}</Text>
            <TextInput placeholder="Secret code (optional)" value={s.code || ''} onChangeText={(t) => updateCodeFor(s.phone, t)} style={styles.input} />
          </View>
        ))}
        <View style={{ marginVertical: 8 }}>
          <Button title="Save Sisters" onPress={() => saveSisters(sisters)} />
        </View>

        <View style={{ marginVertical: 20 }}>
          <Text style={{ color: '#888', marginBottom: 8 }}>Danger zone</Text>
          <Button title="Reset App Role" color="#d9534f" onPress={() => {
            Alert.alert('Reset mode', 'Switch back to setup screen?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Yes', style: 'destructive', onPress: async () => {
                await AsyncStorage.removeItem(APP_MODE_KEY);
                resetMode();
              } }
            ]);
          }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 8 },
});
