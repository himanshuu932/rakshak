import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ResponderHomeScreen from '../screens/responder/ResponderHomeScreen';
import AppHeader from '../components/Header';

const Stack = createNativeStackNavigator();

const ResponderNavigator = () => {
  return (
    <>
      <AppHeader title="Suraksha Link (Responder)" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ResponderHome" component={ResponderHomeScreen} />
      </Stack.Navigator>
    </>
  );
};

export default ResponderNavigator;