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
  Alert, // Keeping Alert for generic error messages/fallback
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// NOTE: These imports are required for the sign out functionality
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// NOTE: navigation will now be passed as a prop from HomePage/MainApp

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75; // 75% of screen width

// Menu items data structure
const menuItems = [
  { icon: 'person-circle-outline', label: 'Profile', screen: 'Profile' },
  { icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
  { icon: 'log-out-outline', label: 'Sign Out', screen: 'SignOut' },
];

// --- Custom Modal Component Definition ---
const LogoutConfirmationModal = ({ isVisible, onClose, onConfirm, styles }) => {
    if (!isVisible) return null;

    return (
        // Modal Backdrop
        <View style={styles.modalBackdrop}>
            {/* Modal Content Card */}
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Confirm Sign Out</Text>
                <Text style={styles.modalMessage}>Are you sure you want to sign out of your account?</Text>
                
                <View style={styles.modalButtonContainer}>
                    {/* Cancel Button */}
                    <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonCancel]}
                        onPress={onClose}
                    >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    {/* Confirm Sign Out Button */}
                    <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonConfirm]}
                        onPress={onConfirm} // Calls the handleSignOut function
                    >
                        <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
// ------------------------------------------


// Helper function to render menu items
const renderMenuItem = ({ item, toggleSidebar, showLogoutModal, navigation }) => (
  <TouchableOpacity key={item.screen} style={styles.menuItem} onPress={() => {
    // If the item is 'SignOut', open the custom modal
    if (item.screen === 'SignOut') {
      showLogoutModal();
    } else {
      // Standard navigation
      navigation.navigate(item.screen);
      toggleSidebar();
    }
  }}>
    <Ionicons name={item.icon} size={24} color="#333" style={styles.menuIcon} />
    <Text style={styles.menuItemText}>{item.label}</Text>
    <MaterialIcons name="chevron-right" size={24} color="#ccc" />
  </TouchableOpacity>
);


// Sidebar component now accepts 'navigation' prop
const Sidebar = ({ isVisible, toggleSidebar, slideAnim, navigation }) => { 
  
  // State to manage the custom logout confirmation modal visibility
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // LOGOUT HANDLER FUNCTION
  const handleSignOut = async () => {
    // 1. Close the modal and the sidebar
    setIsLogoutModalVisible(false); // Hide the modal
    toggleSidebar(); // Close the sidebar
    
    try {
      toggleSidebar(); // Close sidebar first
      await GoogleSignin.signOut();
      await signOut(auth);
      navigation.replace('GetStarted');
      console.log('Sign out successful')
      } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
  };
  
  // Function to show the modal (called by the Sign Out menu item)
  const showLogoutModal = () => setIsLogoutModalVisible(true);
  // Function to hide the modal (called by the Cancel button)
  const hideLogoutModal = () => setIsLogoutModalVisible(false);


  // Optimization: Only render the sidebar when fully open/closing
  if (!isVisible && slideAnim._value === -SIDEBAR_WIDTH) {
    return null;
  }

  return (
    <>
      {/* Backdrop for closing the menu when tapping outside */}
      {isVisible && (
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <View style={styles.sidebarBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Sliding Sidebar View */}
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
          {/* User Profile Header */}
          <View style={styles.sidebarHeader}>
            <Ionicons name="person-circle-outline" size={60} color="#fff" />
            <Text style={styles.sidebarUserName}>John Doe, Graduand</Text>
            <Text style={styles.sidebarUserEmail}>john.doe@siswamail.edu.my</Text>
          </View>

          {/* Menu Items: Pass the handler to open the modal */}
          {menuItems.map(item => renderMenuItem({ item, toggleSidebar, showLogoutModal, navigation }))}
          
        </ScrollView>
      </Animated.View>
      
      {/* Custom Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isVisible={isLogoutModalVisible}
        onClose={hideLogoutModal}
        onConfirm={handleSignOut} // <-- Calls the sign out logic
        styles={styles}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // --- Existing Styles (omitted for brevity) ---
  sidebarBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 999,
  },
  sidebar: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: 'white', zIndex: 1000,
  },
  menuContent: { paddingBottom: 20 },
  sidebarHeader: {
    height: 200, backgroundColor: '#192F59', padding: 20, 
    justifyContent: 'center', alignItems: 'flex-start', marginBottom: 10,
  },
  sidebarUserName: { fontSize: 18, fontWeight: 'bold', color: 'white', marginTop: 10 },
  sidebarUserEmail: { fontSize: 14, color: '#E0E0E0', marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 15,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  menuIcon: { marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 16, color: '#333' },
  
  // --- NEW Modal Styles (omitted for brevity) ---
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    zIndex: 2000, justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: {
    width: '80%', backgroundColor: 'white', borderRadius: 15, padding: 20,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#192F59', marginBottom: 10 },
  modalMessage: { fontSize: 16, color: '#555', marginBottom: 20 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#E0E0E0', marginRight: 10 },
  modalButtonConfirm: { backgroundColor: '#DC3545', marginLeft: 10 },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalButtonTextConfirm: { color: 'white' },
});

export default Sidebar;
