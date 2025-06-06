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
import styles from '../StyleSheet/homepage.styles.js';

const HomePage = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Fixed Header */}
      <View style={styles.HeaderContainer}>
        <ImageBackground
          source={require('../assets/Started_1.png')}
          style={styles.header}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerBackground} />

            <TouchableOpacity style={styles.menuOverlay}>
              <Ionicons name="menu" size={28} color="white" />
            </TouchableOpacity>

            <Text style={styles.headerText}>HOME</Text>

            <TouchableOpacity style={styles.notOverlay}>
              <Ionicons name="notifications-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.container, { marginTop: 90 }]} // Push content below fixed header
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
          <Text style={styles.newsText}>BURSARY & ACADEMIC ATTIRE RETURN DEADLINE</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;