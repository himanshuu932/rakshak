// screens/brother/SisterDetail.js
import React, { useEffect, useState, useRef } from 'react';
import { View, SafeAreaView, Text, Button, StyleSheet, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendSms, requestPermissions } from '../../utils/smsUtils';

const SECRET_CODES_KEY = 'secretCodes'; // object mapping phone -> code
// lastLocation_<phone> should be set by native receiver when sister replies with location

export default function SisterDetail({ route }) {
  const { sister } = route.params;
  const [status, setStatus] = useState('Idle');
  const [lastLocation, setLastLocation] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    loadLast();
    return () => clearInterval(pollRef.current);
  }, []);

  const loadLast = async () => {
    const raw = await AsyncStorage.getItem(`lastLocation_${sister.phone}`);
    if (raw) {
      setLastLocation(JSON.parse(raw));
    }
  };

  const pollForLocation = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const raw = await AsyncStorage.getItem(`lastLocation_${sister.phone}`);
      if (raw) {
        const data = JSON.parse(raw);
        setLastLocation(data);
        setStatus('Location received!');
        clearInterval(pollRef.current);
      }
    }, 2000);
  };

  const handleCheck = async () => {
    // get secret code for this sister
    const permissions = [
      'android.permission.SEND_SMS',
    ];
    const ok = await requestPermissions(permissions);
    if (!ok) {
      Alert.alert('Permission needed', 'SMS permission is required to send the check message.');
      return;
    }

    const rawCodes = await AsyncStorage.getItem(SECRET_CODES_KEY);
    const codes = rawCodes ? JSON.parse(rawCodes) : {};
    const code = codes[sister.phone] || 'CHECK'; // default keyword
    const message = `SECRET_CHECK:${code}`; // brother sends this; sister native listener should react
    setStatus('Sending check...');
    try {
      await sendSms(sister.phone, message);
      setStatus('Check sent — waiting for location...');
      pollForLocation();
    } catch (e) {
      setStatus('Send failed');
      Alert.alert('Error', `Failed to send check: ${String(e)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.name}>{sister.name}</Text>
      <Text style={styles.phone}>{sister.phone}</Text>

      <View style={{ marginVertical: 12 }}>
        <Button title="Check" onPress={handleCheck} />
      </View>

      <Text style={{ marginTop: 10 }}>Status: {status}</Text>

      {lastLocation ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '600' }}>Last known location</Text>
          <Text>{lastLocation.mapUrl || `${lastLocation.latitude}, ${lastLocation.longitude}`}</Text>
          <Text style={{ color: '#666', marginTop: 8 }}>{new Date(lastLocation.timestamp).toLocaleString()}</Text>
          <View style={{ marginTop: 12 }}>
            <Button title="Open in Maps" onPress={() => Linking.openURL(lastLocation.mapUrl)} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  name: { fontSize: 20, fontWeight: '700' },
  phone: { color: '#666', marginBottom: 8 },
});
