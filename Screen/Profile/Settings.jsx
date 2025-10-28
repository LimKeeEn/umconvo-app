import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Settings({ navigation }) {
  const handlePress = (label) => {
    Alert.alert(label, `You tapped on "${label}"`);
  };

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic colors based on theme
  const themeStyles = {
    backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
    textColor: isDarkMode ? '#F9FAFB' : '#111827',
    cardColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    secondaryText: isDarkMode ? '#D1D5DB' : '#6B7280',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
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

        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EditProfile')}>
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

        <TouchableOpacity style={styles.item} onPress={() => handlePress('Logout')}>
          <View style={styles.itemLeft}>
            <Ionicons name="log-out-outline" size={22} color="#E63946" />
            <Text style={[styles.itemText, { color: '#E63946' }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* --- Support Section --- */}
      <View style={[styles.section, { backgroundColor: themeStyles.cardColor }]}>
        <Text style={[styles.sectionTitle, { color: themeStyles.secondaryText }]}>Help & Support</Text>

        <TouchableOpacity style={styles.item} onPress={() => handlePress('Help Center')}>
          <View style={styles.itemLeft}>
            <Ionicons name="headset-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>HelpDesk</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => handlePress('About')}>
          <View style={styles.itemLeft}>
            <Ionicons name="help-circle-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>FAQ</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => handlePress('About')}>
          <View style={styles.itemLeft}>
            <Ionicons name="document-text-outline" size={22} color={themeStyles.textColor} />
            <Text style={[styles.itemText, { color: themeStyles.textColor }]}>Feedback Form</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => handlePress('About')}>
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
