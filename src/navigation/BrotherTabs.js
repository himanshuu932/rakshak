// navigation/BrotherTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import BrotherHome from '../screens/brother/BrotherHome';
import BrotherSettings from '../screens/brother/BrotherSettings';
import SisterDetail from '../screens/brother/SisterDetail';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeIcon = ({ color, size }) => (
  <Text style={{ color, fontSize: size }}>🏠</Text>
);
const SettingsIcon = ({ color, size }) => (
  <Text style={{ color, fontSize: size }}>⚙️</Text>
);

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BrotherHome" component={BrotherHome} />
      <Stack.Screen name="SisterDetail" component={SisterDetail} />
    </Stack.Navigator>
  );
}

export default function BrotherTabs({ resetMode }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E90FF', // Dodger Blue
        tabBarInactiveTintColor: '#888',
        tabBarShowLabel: false, // Hide the tab bar label
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      >
        {(props) => <BrotherSettings {...props} resetMode={resetMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles here if needed
});