// components/SisterListItem.js
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

export default function SisterListItem({ name, phone, onPress, onDelete }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.delete}>
        <Text style={{ color: 'white' }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginVertical: 6, backgroundColor: '#fff', borderRadius: 10, elevation: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  phone: { color: '#666' },
  delete: { backgroundColor: '#ff6b6b', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
});
