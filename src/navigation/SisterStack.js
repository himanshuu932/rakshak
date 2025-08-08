// navigation/SisterStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SisterHome from '../screens/sister/SisterHome';

const Stack = createStackNavigator();

export default function SisterStack({ resetMode }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Rakshak">
        {(props) => <SisterHome {...props} resetMode={resetMode} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
