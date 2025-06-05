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

const NavigationPage = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Fixed Header */}
      <View style={styles.headerContainer}>
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

            <Text style={styles.headerText}>NAVIGATION</Text>

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