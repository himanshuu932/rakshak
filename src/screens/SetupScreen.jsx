// src/screens/SetupScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SetupScreen = ({ onSelectMode }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Welcome to Safeguard</Text>
    <Text style={styles.subtitle}>Choose Your Role</Text>
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onSelectMode('CONTROLLER')}
      >
        <Text style={styles.buttonText}>I am the Controller (Brother)</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onSelectMode('RESPONDER')}
      >
        <Text style={styles.buttonText}>I am the Responder (Sister)</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '90%',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#FF69B4', // Cute pink color
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SetupScreen;