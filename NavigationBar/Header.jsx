import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from './Sidebar';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

const Header = ({ 
  title = 'HOME', 
  onNotificationPress,
  backgroundImage = require('../assets/Started_1.png'),
  showMenu = true,
  showNotification = true,
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  const toggleSidebar = () => {
    const toValue = isSidebarVisible ? -SIDEBAR_WIDTH : 0;

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      console.log('Notification pressed');
    }
  };

  const navigation = useNavigation();

  return (
    <>
      <View style={styles.HeaderContainer}>
        <ImageBackground
          source={backgroundImage}
          style={styles.header}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerBackground} />

            {/* Menu Button */}
            {showMenu && (
              <TouchableOpacity 
                style={styles.menuOverlay} 
                onPress={toggleSidebar}
              >
                <Ionicons name="menu" size={28} color="white" />
              </TouchableOpacity>
            )}

            {/* Title */}
            <Text style={styles.headerText}>{title}</Text>

            {/* Notification Button */}
            {showNotification && (
              <TouchableOpacity 
                style={styles.notOverlay}
                onPress={handleNotificationPress}
              >
                <Ionicons name="notifications-outline" size={28} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </ImageBackground>
      </View>

      {/* Sidebar Component - Integrated into Header */}
      <Sidebar
        isVisible={isSidebarVisible}
        toggleSidebar={toggleSidebar}
        slideAnim={slideAnim}
        navigation={navigation}
      />
    </>
  );
};

const styles = StyleSheet.create({
  HeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    height: 150,
  },
  header: {
    height: 150,
    justifyContent: 'center',
  },
  headerOverlay: {
    height: 150,
    position: 'relative',
    justifyContent: 'center',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#192F59',
    opacity: 0.8,
    zIndex: 0,
  },
  menuOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 1,
  },
  notOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1,
  },
  headerText: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 1,
  },
});

export default Header;