// src/screens/BrotherSettingsScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import Header from '../components/Header';

const BrotherSettingsScreen = ({ onClearMode }) => {
  return (
    <View style={styles.container}>
      <Header title="Settings" />
      <View style={styles.content}>
        <Text style={styles.profileText}>Brother's Profile</Text>
        <Text style={styles.settingText}>Manage secret codes for sisters will be here.</Text>
        <Button title="Reset App Mode" onPress={onClearMode} color="#FF69B4" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 20, alignItems: 'center' },
  profileText: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  settingText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
});

export default BrotherSettingsScreen;