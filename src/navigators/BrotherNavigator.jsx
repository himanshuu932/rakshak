// src/navigators/BrotherNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Assuming you have this library installed

import BrotherHomeScreen from '../screens/BrotherHomeScreen';
import BrotherSettingsScreen from '../screens/BrotherSettingsScreen';

const Tab = createBottomTabNavigator();

const BrotherNavigator = ({ onClearMode }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF69B4', // Cute pink
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Home" component={BrotherHomeScreen} />
      <Tab.Screen name="Settings">
        {props => <BrotherSettingsScreen {...props} onClearMode={onClearMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 5,
    height: 60,
  },
});

export default BrotherNavigator;