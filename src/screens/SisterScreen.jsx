// src/screens/SisterScreen.jsx (Updated)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeModules, PermissionsAndroid, Platform, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const { SmsSender, SettingsModule } = NativeModules;

// Re-using helper functions
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
        const mapUrl = `http://google.com/maps?q=${latitude},${longitude}`;
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

const SisterScreen = ({ onClearMode }) => {
  const [trustedNumbers, setTrustedNumbers] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    const setupPermissions = async () => {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
      await requestPermissions(permissions);
    };
    setupPermissions();
    loadTrustedNumbers();
  }, []);

  const loadTrustedNumbers = async () => {
    const savedNumbers = await AsyncStorage.getItem('trustedNumbers');
    if (savedNumbers) {
      setTrustedNumbers(JSON.parse(savedNumbers));
    }
  };

  const saveTrustedNumbers = async (numbers) => {
    await AsyncStorage.setItem('trustedNumbers', JSON.stringify(numbers));
    setTrustedNumbers(numbers);
    
    // Pass the saved settings to the native module for the background service
    try {
      // The native module expects a comma-separated string for simplicity
      const numbersString = numbers.map(item => item.number).join(',');
      const keywordsString = numbers.map(item => item.keyword).join(',');
      SettingsModule.setTrustedNumbers(numbersString);
      SettingsModule.setSecretKeywords(keywordsString);
      Alert.alert('Settings Saved', 'Trusted numbers and keywords have been saved for the background service.');
    } catch (error) {
      console.error("Failed to save settings to native module:", error);
      Alert.alert('Error', 'Failed to save settings for background service.');
    }
  };

  const addTrustedNumber = () => {
    if (newNumber.trim() && newKeyword.trim()) {
      const newEntry = { id: Date.now().toString(), number: newNumber, keyword: newKeyword.toUpperCase() };
      const updatedNumbers = [...trustedNumbers, newEntry];
      saveTrustedNumbers(updatedNumbers);
      setNewNumber('');
      setNewKeyword('');
    } else {
      Alert.alert('Error', 'Please enter both phone number and keyword.');
    }
  };

  const deleteTrustedNumber = (id) => {
    const updatedNumbers = trustedNumbers.filter(item => item.id !== id);
    saveTrustedNumbers(updatedNumbers);
  };

  const renderItem = ({ item }) => (
    <View style={styles.trustedItem}>
      <View>
        <Text style={styles.trustedNumberText}>{item.number}</Text>
        <Text style={styles.trustedKeywordText}>Keyword: {item.keyword}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteTrustedNumber(item.id)}>
        <Icon name="trash-bin" size={24} color="#FF69B4" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Trusted Numbers" />
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Trusted Phone Number"
          value={newNumber}
          onChangeText={setNewNumber}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Secret Keyword"
          value={newKeyword}
          onChangeText={setNewKeyword}
          autoCapitalize="characters"
        />
        <Button title="Add Trusted Number" onPress={addTrustedNumber} color="#FF69B4" />
      </View>
      <FlatList
        data={trustedNumbers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      <View style={styles.bottomButtonContainer}>
        <Button title="Reset App Mode" onPress={onClearMode} color="#FF69B4" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  formContainer: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  list: { flex: 1 },
  trustedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  trustedNumberText: { fontSize: 18, fontWeight: 'bold' },
  trustedKeywordText: { fontSize: 14, color: '#666' },
  bottomButtonContainer: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
});

export default SisterScreen;