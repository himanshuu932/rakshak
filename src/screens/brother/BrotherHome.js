// screens/brother/BrotherHome.js
import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StyleSheet, Alert, Button, TextInput, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SisterListItem from '../../components/SisterListItem';

const SISTERS_KEY = 'sisters'; // array of { name, phone }

export default function BrotherHome({ navigation }) {
  const [sisters, setSisters] = useState([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation]);

  async function load() {
    const raw = await AsyncStorage.getItem(SISTERS_KEY);
    setSisters(raw ? JSON.parse(raw) : []);
  }

  const saveList = async (list) => {
    await AsyncStorage.setItem(SISTERS_KEY, JSON.stringify(list));
    setSisters(list);
  };

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Please enter both name and phone');
      return;
    }
    const next = [...sisters, { name: name.trim(), phone: phone.trim() }];
    await saveList(next);
    setName(''); setPhone(''); setAdding(false);
  };

  const handleRemove = (index) => {
    Alert.alert('Remove sister', `Remove ${sisters[index].name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const next = sisters.filter((_, i) => i !== index);
          await saveList(next);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Sisters</Text>
      <FlatList
        data={sisters}
        keyExtractor={(item) => item.phone}
        ListEmptyComponent={<Text style={{ color: '#666' }}>No sisters yet — add one below.</Text>}
        renderItem={({ item, index }) => (
          <SisterListItem
            name={item.name}
            phone={item.phone}
            onPress={() => navigation.navigate('SisterDetail', { sister: item })}
            onDelete={() => handleRemove(index)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <View style={styles.addRow}>
        <Button title="Add Sister" onPress={() => setAdding(true)} />
      </View>

      <Modal visible={adding} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Add Sister</Text>
            <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Phone (e.g., +91...)" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Button title="Cancel" onPress={() => setAdding(false)} />
              <Button title="Add" onPress={handleAdd} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  addRow: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
});
