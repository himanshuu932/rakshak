// App.js
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator, View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';

import BrotherTabs from './navigation/BrotherTabs';
import SisterStack from './navigation/SisterStack';
import SetupScreen from './screens/SetupScreen';

const APP_MODE_KEY = 'appMode'; // 'CONTROLLER' = Brother, 'RESPONDER' = Sister

export default function App() {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const m = await AsyncStorage.getItem(APP_MODE_KEY);
        setMode(m);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelectMode = async (selectedMode) => {
    await AsyncStorage.setItem(APP_MODE_KEY, selectedMode);
    setMode(selectedMode);
  };

  const handleResetMode = async () => {
    await AsyncStorage.removeItem(APP_MODE_KEY);
    setMode(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Warming up...</Text>
      </SafeAreaView>
    );
  }

  if (!mode) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <SetupScreen onSelectMode={handleSelectMode} />
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      {mode === 'CONTROLLER' ? (
        <BrotherTabs resetMode={handleResetMode} />
      ) : (
        <SisterStack resetMode={handleResetMode} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
