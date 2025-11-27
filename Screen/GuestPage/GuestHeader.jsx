import React, { useState, useRef, useEffect } from 'react';
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
import GuestSidebar from './GuestSidebar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;
const STORAGE_KEY = '@read_notifications';

const Header = ({ 
  title = 'HOME', 
  onNotificationPress,
  backgroundImage = require('../../assets/Started_1.png'),
  showMenu = true,
  showNotification = true,
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const navigation = useNavigation();

  const projectID = "umconvo-app";

  const fetchUnreadCount = async () => {
    try {
      // Fetch all notifications
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default)/documents/notifications?orderBy=createdAt%20desc`
      );

      const json = await response.json();

      if (!json.documents) {
        setUnreadCount(0);
        return;
      }

      const notificationIds = json.documents.map((doc) => doc.name.split("/").pop());

      // Get read notifications from storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const readNotifications = stored ? new Set(JSON.parse(stored)) : new Set();

      // Count unread
      const unread = notificationIds.filter(id => !readNotifications.has(id)).length;
      setUnreadCount(unread);
    } catch (error) {
      console.log("Error fetching unread count:", error);
    }
  };

  // Fetch unread count when component mounts
  useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [])
  );

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
    navigation.navigate('Notification');
  };

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

            {/* Notification Button with Badge */}
            {showNotification && (
              <TouchableOpacity 
                style={styles.notOverlay}
                onPress={handleNotificationPress}
              >
                <Ionicons name="notifications-outline" size={28} color="white" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ImageBackground>
      </View>

      {/* Sidebar Component - Integrated into Header */}
      <GuestSidebar
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
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default Header;