// screens/SetupScreen.js
import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';

const blueTheme = {
  primary: '#1E90FF', // Dodger Blue
  secondary: '#87CEFA', // Light Sky Blue
  background: '#F0F8FF', // Alice Blue
  textPrimary: '#FFFFFF',
  textSecondary: '#555',
  buttonText: '#FFFFFF',
  noteText: '#888',
};

export default function SetupScreen({ onSelectMode }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: blueTheme.background }]}>
      <Text style={[styles.appTitle, { color: blueTheme.primary }]}>LittleGuardian</Text>
      <Text style={[styles.subtitle, { color: blueTheme.textSecondary }]}>Choose the role for this device</Text>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: blueTheme.primary }]}
        onPress={() => onSelectMode('CONTROLLER')}
      >
        <Text style={[styles.btnText, { color: blueTheme.buttonText }]}>Family Member (Watching)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: blueTheme.secondary }]}
        onPress={() => onSelectMode('RESPONDER')}
      >
        <Text style={[styles.btnText, { color: blueTheme.buttonText }]}>Family Member (Being Watched)</Text>
      </TouchableOpacity>

      <Text style={[styles.note, { color: blueTheme.noteText }]}>You can change this later in Settings.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  btn: {
    width: '90%',
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    marginTop: 30,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});