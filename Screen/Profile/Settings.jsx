import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

const API_URL = 'http://192.168.0.162:5000/api';

// Logout Confirmation Modal Component
const LogoutConfirmationModal = ({ isVisible, onClose, onConfirm }) => {
  if (!isVisible) return null;
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalBackdrop}>
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.modalTitle}>Confirm Sign Out</Text>
          <Text style={modalStyles.modalMessage}>
            Are you sure you want to sign out of your account?
          </Text>

          <View style={modalStyles.modalButtonContainer}>
            <TouchableOpacity
              style={[modalStyles.modalButton, modalStyles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={modalStyles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.modalButton, modalStyles.modalButtonConfirm]}
              onPress={onConfirm}
            >
              <Text
                style={[modalStyles.modalButtonText, modalStyles.modalButtonTextConfirm]}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function Settings({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // Fetch user email and data
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setEmail(user.email);
        fetchUserData(user.email);
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserData = async (userEmail) => {
    try {
      const response = await fetch(`${API_URL}/get-user/${userEmail}`);
      const result = await response.json();

      if (result.success) {
        setUserData(result.user);
      } else {
        console.log('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    setIsLogoutModalVisible(false);

    try {
      await GoogleSignin.signOut();
      await signOut(auth);
      navigation.replace('GetStarted');
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const showLogoutModal = () => setIsLogoutModalVisible(true);
  const hideLogoutModal = () => setIsLogoutModalVisible(false);

  const handlePress = (label) => {
    Alert.alert(label, `You tapped on "${label}"`);
  };

  // Dynamic colors based on theme
  const themeStyles = {
    backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    textColor: isDarkMode ? '#F9FAFB' : '#111827',
    cardColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    secondaryText: isDarkMode ? '#D1D5DB' : '#6B7280',
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#192F59" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* --- General Section --- */}
      <View style={[styles.section, { backgroundColor: themeStyles.cardColor }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.secondaryText }]}>General</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('EditProfile', { userData })}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="person-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>

        {/* Notifications Toggle */}
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="notifications-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#ccc', true: '#FFD93D' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </TouchableOpacity>

        {/* Dark Mode Toggle */}
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="moon-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#ccc', true: '#FFD93D' }}
            thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
          />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.item} onPress={showLogoutModal}>
          <View style={styles.itemLeft}>
            <Ionicons name="log-out-outline" size={22} color="#E63946" />
            <Text style={[styles.itemText, { color: '#E63946' }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* --- Support Section --- */}
      <View style={[styles.section, { backgroundColor: themeStyles.cardColor }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.secondaryText }]}>Help & Support</Text>

        <TouchableOpacity style={styles.item} onPress={() => handlePress('HelpDesk')}>
          <View style={styles.itemLeft}>
            <Ionicons name="headset-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>HelpDesk</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('FAQ')}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="help-circle-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>FAQ</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => handlePress('Feedback Form')}>
          <View style={styles.itemLeft}>
            <Ionicons name="document-text-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>Feedback Form</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate('AboutUs')}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="information-circle-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>About Us</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={[styles.version, { color: themeStyles.secondaryText }]}>
        App Version 1.0.0
      </Text>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isVisible={isLogoutModalVisible}
        onClose={hideLogoutModal}
        onConfirm={handleSignOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  section: {
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
    marginTop: 15,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 15,
    marginLeft: 10,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 30,
  },
});

// Modal Styles
const modalStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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