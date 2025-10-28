import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../NavigationBar/BottomNav';

const API_URL = 'http://10.0.2.2:5000/api';

const Profile = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showGuests, setShowGuests] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Example: Get user email from login (you may adjust based on how you store user info)
  const email = route?.params?.email || '22004886@siswa.um.edu.my';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/get-user/${email}`);
        const result = await response.json();

        if (result.success) {
          setUserData(result.user);
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Mock ticket data (you can later fetch from backend too)
  const tickets = [
    {
      id: '1',
      eventName: '64th Universiti Malaya Convocation Ceremony (Graduand)',
      date: '30 Nov 2024 (7.30am)',
      venue: 'Dewan Tunku Canselor',
      confirmationCode: '280100',
    },
  ];

  const guests = [
    {
      id: '1',
      guestNumber: 'Guest 1',
      eventName: '64th Universiti Malaya Convocation Ceremony (Guest)',
      date: '30 Nov 2024 (7.30am)',
      venue: 'Dewan Tunku Canselor',
      confirmationCode: '280100',
    },
  ];

  const handleTicketPress = (ticketData, type) => {
    navigation.navigate('TicketDetails', {
      ticketData: ticketData,
      ticketType: type,
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#192F59" />
        <Text style={{ marginTop: 10 }}>Loading Profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loaderContainer}>
        <Text>No user data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('MainApp')}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STUDENT PROFILE</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={26} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: userData.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userData.username || 'No Name'}</Text>
          <Text style={styles.studentId}>{userData.matricNo || 'N/A'}</Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile', { userData })}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('general')}
            style={[styles.tabButton, activeTab === 'general' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>
              General
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('ticket')}
            style={[styles.tabButton, activeTab === 'ticket' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'ticket' && styles.activeTabText]}>
              Ticket
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Ionicons name="mail-outline" size={22} color="#192F59" />
              <View style={styles.cardTextContainer}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{userData.email}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Ionicons name="school-outline" size={22} color="#192F59" />
              <View style={styles.cardTextContainer}>
                <Text style={styles.label}>Education Level</Text>
                <Text style={styles.value}>{userData.educationLevel || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Ionicons name="business-outline" size={22} color="#192F59" />
              <View style={styles.cardTextContainer}>
                <Text style={styles.label}>Faculty</Text>
                <Text style={styles.value}>{userData.faculty || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Ionicons name="book-outline" size={22} color="#192F59" />
              <View style={styles.cardTextContainer}>
                <Text style={styles.label}>Course</Text>
                <Text style={styles.value}>{userData.programme || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Ionicons name="call-outline" size={22} color="#192F59" />
              <View style={styles.cardTextContainer}>
                <Text style={styles.label}>Phone No.</Text>
                <Text style={styles.value}>{userData.phoneNo || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Ionicons name="calendar-outline" size={22} color="#192F59" />
              <View style={styles.cardTextContainer}>
                <Text style={styles.label}>Graduation Session</Text>
                <Text style={styles.value}>{userData.graduationSession || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'ticket' && (
          <View style={styles.ticketContainer}>
            {tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketWrapper}
                onPress={() => handleTicketPress(ticket, 'main')}
                activeOpacity={0.7}
              >
                <View style={[styles.colorStripe, { backgroundColor: '#FFD93D' }]} />
                <View style={styles.ticketContent}>
                  <View style={styles.ticketLeft}>
                    <Ionicons name="qr-code-outline" size={40} color="black" />
                  </View>

                  <View style={styles.ticketMiddle}>
                    <Text style={styles.ticketTitle}>{ticket.eventName}</Text>
                    <View style={styles.ticketRow}>
                      <Ionicons name="calendar-outline" size={16} color="#555" />
                      <Text style={styles.ticketDetail}>{ticket.date}</Text>
                    </View>
                    <View style={styles.ticketRow}>
                      <Ionicons name="location-outline" size={16} color="#555" />
                      <Text style={styles.ticketDetail}>{ticket.venue}</Text>
                    </View>
                  </View>

                  <View style={styles.ticketRight}>
                    <Ionicons name="chevron-forward-outline" size={22} color="#000" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowGuests((prev) => !prev)}
              style={styles.guestsToggle}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showGuests ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color="#000"
              />
              <Text style={styles.guestsTitle}>Guests</Text>
            </TouchableOpacity>

            {showGuests &&
              guests.map((guest) => (
                <TouchableOpacity
                  key={guest.id}
                  style={styles.ticketWrapper}
                  onPress={() => handleTicketPress(guest, 'guest')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorStripe, { backgroundColor: '#9B5DE5' }]} />
                  <View style={styles.ticketContent}>
                    <View style={styles.ticketLeft}>
                      <Ionicons name="qr-code-outline" size={40} color="black" />
                    </View>

                    <View style={styles.ticketMiddle}>
                      <Text style={styles.ticketTitle}>{guest.guestNumber}</Text>
                      <View style={styles.ticketRow}>
                        <Ionicons name="person-outline" size={16} color="#555" />
                        <Text style={styles.ticketDetail}>{guest.eventName}</Text>
                      </View>
                      <View style={styles.ticketRow}>
                        <Ionicons name="calendar-outline" size={16} color="#555" />
                        <Text style={styles.ticketDetail}>{guest.date}</Text>
                      </View>
                      <View style={styles.ticketRow}>
                        <Ionicons name="location-outline" size={16} color="#555" />
                        <Text style={styles.ticketDetail}>{guest.venue}</Text>
                      </View>
                      <Text style={styles.ticketCode}>
                        Confirmation No: {guest.confirmationCode}
                      </Text>
                    </View>

                    <View style={styles.ticketRight}>
                      <Ionicons name="chevron-forward-outline" size={22} color="#000" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  profileSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 30,
    marginBottom: 10,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#192F59' },
  studentId: { color: '#888', marginBottom: 15 },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#192F59',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: { color: 'white', fontWeight: 'bold', marginRight: 6 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#192F59' },
  tabText: { color: '#888', fontWeight: '600' },
  activeTabText: { color: '#192F59' },
  cardContainer: { paddingHorizontal: 20, paddingTop: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    paddingRight: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  cardTextContainer: { marginLeft: 15 },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 16, color: '#000', fontWeight: '500' },
  ticketContainer: { paddingHorizontal: 15, paddingTop: 10 },
  ticketWrapper: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  colorStripe: { width: 10 },
  ticketContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10 },
  ticketLeft: { width: 45, alignItems: 'center' },
  ticketMiddle: { flex: 1, paddingHorizontal: 10 },
  ticketRight: { width: 30, alignItems: 'center' },
  ticketTitle: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  ticketDetail: { fontSize: 13, color: '#333', marginLeft: 5 },
  ticketCode: { fontSize: 12, color: '#777', marginTop: 4, fontStyle: 'italic' },
  guestsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 5,
  },
  guestsTitle: { fontSize: 15, fontWeight: '600', marginLeft: 5, color: '#000' },
});

export default Profile;
