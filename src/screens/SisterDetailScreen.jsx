// src/screens/SisterDetailScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, Button, Alert, PermissionsAndroid, Linking } from 'react-native';
import Header from '../components/Header';
import Geolocation from 'react-native-geolocation-service';
import { NativeModules } from 'react-native';

const { SmsSender } = NativeModules;

// Re-using helper functions from original App.jsx
const sendSms = (phone, text) => {
  return new Promise((resolve, reject) => {
    if (!SmsSender || !SmsSender.sendSMS) {
      return reject('SmsSender native module not available');
    }
    SmsSender.sendSMS(String(phone), String(text), resolve, reject);
  });
};

const requestPermissions = async (permissions) => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        Alert.alert(
          'Permissions Required',
          'This app needs all requested permissions to function. Please grant them in your phone settings.',
          [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
        );
      }
      return allGranted;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

const SisterDetailScreen = ({ route }) => {
  const { sister } = route.params;

  const handleCheckLocation = async () => {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
    ];
    const granted = await requestPermissions(permissions);
    if (granted) {
      const secretKeyword = 'SOS_LOCATION'; // This should be managed in settings
      const message = secretKeyword;
      try {
        await sendSms(sister.phone, message);
        Alert.alert('Message Sent', `Secret message sent to ${sister.name}. Awaiting location...`);
      } catch (e) {
        Alert.alert('Error', `Failed to send message: ${String(e)}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Header title={sister.name} />
      <View style={styles.content}>
        <Text style={styles.infoText}>Phone: {sister.phone}</Text>
        <Button
          title={`Check on ${sister.name}`}
          onPress={handleCheckLocation}
          color="#FF69B4"
        />
        <Text style={styles.locationInfo}>
          Her location will be shown here after she replies.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, alignItems: 'center' },
  infoText: { fontSize: 18, marginBottom: 20, color: '#333' },
  locationInfo: { marginTop: 20, fontStyle: 'italic', color: '#666' },
});

export default SisterDetailScreen;