import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import GetStarted from './Screen/getStarted'; // Import your Get Started file
import BottomNav from './NavigationBar/BottomNav'; // Import your Bottom Navigation

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="GetStarted">
        {/* Get Started Page */}
        <Stack.Screen
          name="GetStarted"
          component={GetStarted}
          options={{ headerShown: false }}
        />
        
        {/* Main App Screens (Bottom Navigation) */}
        <Stack.Screen
          name="MainApp"
          component={BottomNav}
          options={{ headerShown: false }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};