import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomePage from '../Screen/HomePage'; 
import Dates from '../Screen/Dates'; 
import Confirmation from '../Screen/Confirmation'; 
import Services from '../Screen/Services'; 

const Navigation = () => 
  <View style={styles.screen}>
    <Text>Navigation</Text>
  </View>;

const Tab = createBottomTabNavigator();

const BottomNav = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Dates':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Confirmation':
              iconName = focused ? 'clipboard' : 'clipboard-outline';
              break;
            case 'Services':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Navigation':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#d1d1d1',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Dates" component={Dates} />
      <Tab.Screen name="Confirmation" component={Confirmation} />
      <Tab.Screen name="Services" component={Services} />
      <Tab.Screen name="Navigation" component={Navigation} />
    </Tab.Navigator>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#192F59', // Navy blue background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 80,
    position: 'absolute', // Floating effect
    left: 10,
    right: 10,
    bottom: 0,
    paddingBottom: 5,
    paddingTop: 10
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
