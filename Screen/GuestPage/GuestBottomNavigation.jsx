import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GuestHomePage from './GuestHomePage';
import Dates from './Guestdates'; 
import Services from './GuestServices'; 
import Feed from './GuestFeed';

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
            case 'Services':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'Feed':
              iconName = focused ? 'albums' : 'albums-outline';
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
      <Tab.Screen name="Home" component={GuestHomePage} />
      <Tab.Screen name="Dates" component={Dates} />
      <Tab.Screen name="Services" component={Services} />
      <Tab.Screen name="Feed" component={Feed} />
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
