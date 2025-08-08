// src/screens/BrotherHomeScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Button } from 'react-native';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const initialSisters = [
  { id: '1', name: 'Sister A', phone: '+919876543210' },
  { id: '2', name: 'Sister B', phone: '+919988776655' },
];

const BrotherHomeScreen = () => {
  const [sisters, setSisters] = useState(initialSisters);
  const [newSisterName, setNewSisterName] = useState('');
  const [newSisterPhone, setNewSisterPhone] = useState('');

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.sisterItem} onPress={() => Alert.alert('Sister Selected', `Opening chat for ${item.name}`)}>
      <View style={styles.itemContent}>
        <Text style={styles.sisterName}>{item.name}</Text>
        <Text style={styles.sisterPhone}>{item.phone}</Text>
      </View>
      <TouchableOpacity onPress={() => removeSister(item.id)}>
        <Icon name="close-circle" size={24} color="#FF69B4" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const addSister = () => {
    if (newSisterName.trim() && newSisterPhone.trim()) {
      const newId = (sisters.length + 1).toString();
      setSisters([...sisters, { id: newId, name: newSisterName, phone: newSisterPhone }]);
      setNewSisterName('');
      setNewSisterPhone('');
    } else {
      Alert.alert('Error', 'Please enter both name and phone number.');
    }
  };

  const removeSister = (id) => {
    setSisters(sisters.filter(sister => sister.id !== id));
  };

  return (
    <View style={styles.container}>
      <Header title="My Sisters" />
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Sister's Name"
          value={newSisterName}
          onChangeText={setNewSisterName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={newSisterPhone}
          onChangeText={setNewSisterPhone}
          keyboardType="phone-pad"
        />
        <Button title="Add Sister" onPress={addSister} color="#FF69B4" />
      </View>
      <FlatList
        data={sisters}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
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
  sisterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  itemContent: { flex: 1 },
  sisterName: { fontSize: 18, fontWeight: 'bold' },
  sisterPhone: { fontSize: 14, color: '#666' },
});

export default BrotherHomeScreen;