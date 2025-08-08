// navigation/BrotherTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import BrotherHome from '../screens/brother/BrotherHome';
import BrotherSettings from '../screens/brother/BrotherSettings';
import SisterDetail from '../screens/brother/SisterDetail';
import { TouchableOpacity, Text, View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BrotherHome" component={BrotherHome} options={{ title: 'Sisters' }} />
      <Stack.Screen name="SisterDetail" component={SisterDetail} options={{ title: 'Sister' }} />
    </Stack.Navigator>
  );
}

export default function BrotherTabs({ resetMode }) {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="Settings"
        options={{ tabBarLabel: 'Settings' }}
      >
        {(props) => <BrotherSettings {...props} resetMode={resetMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
