import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../StyleSheet/services.styles.js';

const Services = () => {
  return (
    <View style={{ flex: 1 }}>
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
      <ScrollView style={[styles.container, { marginTop: 150 }]} 
      contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Title */}
        <Text style={styles.Title}>[UMCONVO 64] CONVOCATION PHOTO REGISTRATION</Text>

        {/* Photo Card */}
        <View style={styles.Card}>
          <Image
            source={require('../assets/packages.png')}
            style={styles.Image}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Services;