import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, Text, View, Button, StyleSheet, PermissionsAndroid,
  Platform, Alert, Linking, NativeModules, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';

// Correctly get your native modules
const { SmsSender, SettingsModule } = NativeModules;

// --- Helper Functions ---
const sendSms = (phone, text) => {
  return new Promise((resolve, reject) => {
    if (!SmsSender || !SmsSender.sendSMS) {
      return reject('SmsSender native module not available');
    }
    SmsSender.sendSMS(String(phone), String(text), resolve, reject);
  });
};

const sendCurrentLocation = (recipient) => {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const message = `My current location: ${mapUrl}`;
        try {
          await sendSms(recipient, message);
          Alert.alert('Location Sent', `Sent to ${recipient}`);
          resolve(true);
        } catch (e) {
          Alert.alert('Error', `Failed to send location: ${String(e)}`);
          resolve(false);
        }
      },
      (error) => {
        Alert.alert('GPS Error', error.message);
        resolve(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
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

// --- Screens ---

const ControllerScreen = ({ clearMode }) => {
  const handlePress = async () => {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
    ];
    const granted = await requestPermissions(permissions);
    if (granted) {
      await sendCurrentLocation('+918299353053'); // Your test number
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controller Mode</Text>
      <View style={styles.buttonContainer}>
        <Button title="Test Send My Location" onPress={handlePress} />
      </View>
      <Button title="Reset App Mode" onPress={clearMode} />
    </View>
  );
};

const ResponderScreen = ({ clearMode }) => {
  const [status, setStatus] = useState('Initializing...');
  const [trustedNumber, setTrustedNumber] = useState('');
  const [secretKeyword, setSecretKeyword] = useState('');

  useEffect(() => {
    const setup = async () => {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
      const granted = await requestPermissions(permissions);
      setStatus(granted ? 'Ready. Listening in background.' : 'Permissions denied.');

      // Load saved settings from AsyncStorage to display in the input fields
      const savedNumber = await AsyncStorage.getItem('trustedNumber');
      const savedKeyword = await AsyncStorage.getItem('secretKeyword');
      if (savedNumber) setTrustedNumber(savedNumber);
      if (savedKeyword) setSecretKeyword(savedKeyword);
    };
    setup();
  }, []);

  const handleSaveSettings = async () => {
    if (!trustedNumber || !secretKeyword) {
      Alert.alert('Error', 'Please enter both a number and a keyword.');
      return;
    }
    
    // UPDATED: Added try...catch for error handling
    try {
      // Use your native module to save settings to SharedPreferences for the background service
      SettingsModule.setTrustedNumber(trustedNumber);
      SettingsModule.setSecretKeyword(secretKeyword);
      
      // Also save to AsyncStorage for the UI
      await AsyncStorage.setItem('trustedNumber', trustedNumber);
      await AsyncStorage.setItem('secretKeyword', secretKeyword);
      
      Alert.alert('Success', 'Settings saved! The app will now respond to this number and keyword.');
    } catch (error) {
      console.error("Failed to save settings:", error);
      Alert.alert('Save Error', 'An unexpected error occurred while saving settings.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Responder Mode</Text>
      <Text style={styles.statusText}>{status}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Trusted Phone Number (e.g., +91...)"
        value={trustedNumber}
        onChangeText={setTrustedNumber}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Secret Keyword"
        value={secretKeyword}
        onChangeText={setSecretKeyword}
        autoCapitalize="characters"
      />
      <View style={styles.buttonContainer}>
        <Button title="Save Settings" onPress={handleSaveSettings} />
      </View>
      <Button title="Reset App Mode" onPress={clearMode} />
    </View>
  );
};

const SetupScreen = ({ onSelectMode }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Choose Your Role</Text>
    <View style={styles.buttonContainer}>
      <Button title="I am the Controller (Brother)" onPress={() => onSelectMode('CONTROLLER')} />
    </View>
    <View style={styles.buttonContainer}>
      <Button title="I am the Responder (Sister)" onPress={() => onSelectMode('RESPONDER')} />
    </View>
  </View>
);

// --- Main App Component ---
const App = () => {
  const [appMode, setAppMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMode = async () => {
      const savedMode = await AsyncStorage.getItem('appMode');
      setAppMode(savedMode);
      setIsLoading(false);
    };
    loadMode();
  }, []);

  const handleSelectMode = async (mode) => {
    await AsyncStorage.setItem('appMode', mode);
    setAppMode(mode);
  };

  const handleClearMode = async () => {
    await AsyncStorage.removeItem('appMode');
    setAppMode(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {appMode === 'CONTROLLER' && <ControllerScreen clearMode={handleClearMode} />}
      {appMode === 'RESPONDER' && <ResponderScreen clearMode={handleClearMode} />}
      {appMode === null && <SetupScreen onSelectMode={handleSelectMode} />}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  buttonContainer: { marginVertical: 10, width: '90%' },
  input: {
    width: '90%',
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  statusText: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
});

export default App;
