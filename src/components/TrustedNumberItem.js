// components/TrustedNumberItem.js
// (Optional small component — not required if you used inline row like above)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TrustedNumberItem({ phone, onSend, onRemove }) {
  return (
    <View style={styles.card}>
      <Text style={styles.phone}>{phone}</Text>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={onSend} style={styles.send}><Text>Send</Text></TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={styles.remove}><Text style={{ color: 'white' }}>Remove</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginVertical: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phone: { fontWeight: '600' },
  send: { marginRight: 8 },
  remove: { backgroundColor: '#ff6b6b', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
});
