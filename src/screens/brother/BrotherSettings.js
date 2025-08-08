// screens/brother/BrotherSettings.js
import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, Text, Button, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BROTHER_PROFILE_KEY = 'brotherProfile';
const SISTERS_KEY = 'sisters';
const SECRET_CODES_KEY = 'secretCodes';
const APP_MODE_KEY = 'appMode';

export default function BrotherSettings({ resetMode }) {
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [sisters, setSisters] = useState([]);
  const [secretCodes, setSecretCodes] = useState({});

  useEffect(() => {
    (async () => {
      const p = await AsyncStorage.getItem(BROTHER_PROFILE_KEY);
      const s = await AsyncStorage.getItem(SISTERS_KEY);
      const sc = await AsyncStorage.getItem(SECRET_CODES_KEY);
      if (p) setProfile(JSON.parse(p));
      if (s) setSisters(JSON.parse(s));
      if (sc) setSecretCodes(JSON.parse(sc));
    })();
  }, []);

  const saveProfile = async () => {
    await AsyncStorage.setItem(BROTHER_PROFILE_KEY, JSON.stringify(profile));
    Alert.alert('Saved', 'Brother profile saved.');
  };

  const saveSecretCodes = async () => {
    await AsyncStorage.setItem(SECRET_CODES_KEY, JSON.stringify(secretCodes));
    Alert.alert('Saved', 'Secret codes saved.');
  };

  const updateCodeFor = (phone, code) => {
    setSecretCodes((prev) => ({ ...prev, [phone]: code }));
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

        <Text style={[styles.header, { marginTop: 18 }]}>Secret Codes (per sister)</Text>
        {sisters.length === 0 && <Text style={{ color: '#666' }}>Add sisters first from Home.</Text>}
        {sisters.map((s) => (
          <View key={s.phone} style={{ marginVertical: 8 }}>
            <Text style={{ fontWeight: '600' }}>{s.name}</Text>
            <TextInput placeholder="Secret code (e.g., PETAL12)" value={secretCodes[s.phone] || ''} onChangeText={(t) => updateCodeFor(s.phone, t)} style={styles.input} />
          </View>
        ))}
        <View style={{ marginVertical: 8 }}>
          <Button title="Save Secret Codes" onPress={saveSecretCodes} />
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
