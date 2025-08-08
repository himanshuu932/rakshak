// screens/SetupScreen.js
import React from 'react';
import { View, Text, SafeAreaView, Button, StyleSheet } from 'react-native';

export default function SetupScreen({ onSelectMode }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.appTitle}>LittleGuardian</Text>
      <Text style={styles.subtitle}>Choose the role for this device</Text>

      <View style={styles.btn}>
        <Button title="I am the Brother (Controller)" onPress={() => onSelectMode('CONTROLLER')} />
      </View>

      <View style={styles.btn}>
        <Button title="I am the Sister (Responder)" onPress={() => onSelectMode('RESPONDER')} />
      </View>

      <Text style={styles.note}>You can change this later in Settings.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, justifyContent: 'center' },
  appTitle: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 24 },
  btn: { width: '90%', marginVertical: 8 },
  note: { marginTop: 20, color: '#888', textAlign: 'center' },
});
