import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../StyleSheet/navigation.styles.js';
import Header from '../NavigationBar/Header';

const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Add your notification logic here
  };

const NavigationPage = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <Header 
        title="IMPORTANT DATES"
        onNotificationPress={handleNotificationPress}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.container, { marginTop: 150 }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.sectionTitle}>Navigation Options</Text>

        {/* Parking Lots Navigation Card */}
        <View style={styles.cardContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/Started_2.png')}
              style={styles.cardImage}
            />
            <Text style={[styles.iconOverlay, styles.iconText]}>P</Text>
          </View>
          <Text style={styles.cardDescription}>
            The system will guide you to the parking lot
          </Text>
          <TouchableOpacity style={styles.cardButtonBlue}>
            <Text style={styles.buttonText}>Parking Lots Navigation</Text>
          </TouchableOpacity>
        </View>

        {/* Hall Navigation Card */}
        <View style={styles.cardContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/Started_3.png')}
              style={styles.cardImage}
            />
            <Text style={[styles.iconOverlay, styles.iconText]}>H</Text>
          </View>
          <Text style={styles.cardDescription}>
            A VR simulator to guide you through the convocation process
          </Text>
          <TouchableOpacity style={styles.cardButtonYellow}>
            <Text style={styles.buttonText}>Hall Navigation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NavigationPage;