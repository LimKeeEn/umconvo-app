import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

// Guest menu items (Settings and Sign Out)
const guestMenuItems = [
  { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
  { icon: 'log-out-outline', label: 'Sign Out', screen: 'SignOut' },
];

const LogoutConfirmationModal = ({ isVisible, onClose, onConfirm, styles }) => {
  if (!isVisible) return null;
  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Confirm Sign Out</Text>
        <Text style={styles.modalMessage}>
          Are you sure you want to sign out?
        </Text>

        <View style={styles.modalButtonContainer}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonCancel]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonConfirm]}
            onPress={onConfirm}
          >
            <Text
              style={[styles.modalButtonText, styles.modalButtonTextConfirm]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const renderMenuItem = ({ item, toggleSidebar, showLogoutModal, navigation }) => (
  <TouchableOpacity
    key={item.screen}
    style={styles.menuItem}
    onPress={() => {
      if (item.screen === 'SignOut') {
        showLogoutModal();
      } else {
        navigation.navigate(item.screen);
        toggleSidebar();
      }
    }}
  >
    <Ionicons name={item.icon} size={24} color="#333" style={styles.menuIcon} />
    <Text style={styles.menuItemText}>{item.label}</Text>
    <MaterialIcons name="chevron-right" size={24} color="#ccc" />
  </TouchableOpacity>
);

const GuestSidebar = ({ isVisible, toggleSidebar, slideAnim, navigation }) => {
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Handle Sign Out for Guest
  const handleSignOut = () => {
    setIsLogoutModalVisible(false);
    toggleSidebar();

    // Navigate back to GetStarted page
    navigation.replace('GetStarted');
    console.log('Guest sign out successful');
  };

  const showLogoutModal = () => setIsLogoutModalVisible(true);
  const hideLogoutModal = () => setIsLogoutModalVisible(false);

  if (!isVisible && slideAnim._value === -SIDEBAR_WIDTH) {
    return null;
  }

  return (
    <>
      {isVisible && (
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <View style={styles.sidebarBackdrop} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: slideAnim }],
            zIndex: 1000,
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.menuContent}>
          {/* Guest Header */}
          <View style={styles.sidebarHeader}>
            <Ionicons name="person-circle-outline" size={70} color="#fff" />
            <Text style={styles.sidebarUserName}>Guest</Text>
            <Text style={styles.sidebarUserEmail}>guest@umconvo.app</Text>
          </View>

          {/* Guest Menu Items */}
          {guestMenuItems.map((item) =>
            renderMenuItem({ item, toggleSidebar, showLogoutModal, navigation })
          )}
        </ScrollView>
      </Animated.View>

      <LogoutConfirmationModal
        isVisible={isLogoutModalVisible}
        onClose={hideLogoutModal}
        onConfirm={handleSignOut}
        styles={styles}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  menuContent: { paddingBottom: 20 },
  sidebarHeader: {
    height: 200,
    backgroundColor: '#192F59',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sidebarUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  sidebarUserEmail: { fontSize: 14, color: '#E0E0E0', marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuIcon: { marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 16, color: '#333' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#192F59',
    marginBottom: 10,
  },
  modalMessage: { fontSize: 16, color: '#555', marginBottom: 20 },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: { backgroundColor: '#E0E0E0', marginRight: 10 },
  modalButtonConfirm: { backgroundColor: '#DC3545', marginLeft: 10 },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalButtonTextConfirm: { color: 'white' },
});

export default GuestSidebar;