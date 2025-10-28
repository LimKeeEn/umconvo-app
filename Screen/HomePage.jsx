import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import styles from '../StyleSheet/homepage.styles.js';
import Header from '../NavigationBar/Header';

const HomePage = () => {
  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Add your notification logic here
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <Header 
        title="HOME"
        onNotificationPress={handleNotificationPress}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.container, { marginTop: 150 }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Countdown Timer */}
        <View style={styles.timerContainer}>
          {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, index) => (
            <View key={index} style={styles.timerBox}>
              <Text style={styles.timerDigit}>00</Text>
              <Text style={styles.timerLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* News Section */}
        <Text style={styles.newsTitle}>NEWS</Text>

        {/* News Card 1 */}
        <View style={styles.newsCard}>
          <Image
            source={require('../assets/Started_1.png')}
            style={styles.newsImage}
          />
          <Text style={styles.newsText}>
            [IMPORTANT] CONVOCATION PHOTO INFO (AFTER 13 DEC 2024)
          </Text>
        </View>

        {/* News Card 2 */}
        <View style={styles.newsCard}>
          <Image
            source={require('../assets/Started_2.png')}
            style={styles.newsImage}
          />
          <Text style={styles.newsText}>
            BURSARY & ACADEMIC ATTIRE RETURN DEADLINE
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;