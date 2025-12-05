import React, { useState, useEffect, useRef } from 'react';
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
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const API_URL = 'http://192.168.1.234:5000/api';

const taskDisplayNames = {
  'update-profile': 'Update Profile Information',
  'graduate-tracer': 'Completion of Graduate Tracer Study (SKPG)',
  'attire-confirmation': 'Attendance & Academic Attire Confirmation',
  'attire-collection': 'Collection of Academic Attire',
  'rehearsal-confirmation': 'Attendance of Rehearsal Confirmation',
};

const Profile = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showGuests, setShowGuests] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);
  const [token, setToken] = useState(null);
  const [googlePhotoURL, setGooglePhotoURL] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [statusText, setStatusText] = useState('Loading...');
  const [tickets, setTickets] = useState([]);
  const [guests, setGuests] = useState([]);
  const [convocationData, setConvocationData] = useState(null); 
  const [attireSchedule, setAttireSchedule] = useState(null); 
  const [loadingConvocation, setLoadingConvocation] = useState(false);
  const [loadingAttire, setLoadingAttire] = useState(false);

  const scrollViewRef = useRef(null);
  const gownTicketRef = useRef(null);

  // Handle navigation parameters to open ticket tab
  useEffect(() => {
    if (route.params?.openTab === 'ticket') {
      setActiveTab('ticket');
    }
  }, [route.params]);

  // Scroll to gown ticket after tickets are rendered
  useEffect(() => {
    if (route.params?.scrollToGown && activeTab === 'ticket' && tickets.length > 0) {
      setTimeout(() => {
        if (gownTicketRef.current && scrollViewRef.current) {
          gownTicketRef.current.measureLayout(
            scrollViewRef.current,
            (x, y) => {
              scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
            }
          );
        }
      }, 500);
    }
  }, [route.params, activeTab, tickets]);

  // 1. Fetch Auth Token and Google Photo on Mount
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        setEmail(user.email);
        if (user.photoURL) {
          setGooglePhotoURL(user.photoURL);
        }
        try {
            const idToken = await user.getIdToken();
            setToken(idToken);
        } catch (error) {
            console.error("Failed to get ID Token:", error);
            Alert.alert('Error', 'Failed to authenticate user token.');
            setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch User Data (Requires email)
  useEffect(() => {
    if (!email) return;

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
      } 
    };

    fetchUserData();
  }, [email]);

  // --- ATTIRE SCHEDULE FETCH FUNCTION ---
  const fetchAttireScheduleData = async (idToken) => {
    setLoadingAttire(true);
    try {
        const response = await fetch(`${API_URL}/get-attire`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }), 
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const errorText = await response.text();
            console.error('Server returned non-JSON response for attire:', errorText);
            setAttireSchedule(null);
            return;
        }

        const result = await response.json();

        if (result.success && result.attireSchedule) {
            setAttireSchedule(result.attireSchedule);
        } else {
            console.log(result.message || 'No attire schedule found.');
            setAttireSchedule(null);
        }
    } catch (error) {
        console.error('Error fetching attire schedule:', error);
        setAttireSchedule(null);
    } finally {
        setLoadingAttire(false);
    }
  };

  const fetchConvocationScheduleData = async (idToken) => {
    setLoadingConvocation(true);
    try {
        const response = await fetch(`${API_URL}/get-convocation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }), 
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const errorText = await response.text();
            console.error('Server returned non-JSON response for convo:', errorText);
            setConvocationData(null);
            return;
        }

        const result = await response.json();

        if (result.success && result.convocation) {
            setConvocationData(result.convocation);
        } else {
            console.log(result.message || 'No convocation schedule found.');
            setConvocationData(null);
        }
    } catch (error) {
        console.error('Error fetching convocation schedule:', error);
        setConvocationData(null);
    } finally {
        setLoadingConvocation(false);
    }
  };

  // 3. Fetch all data dependent on token/email
  useEffect(() => {
    if (!email || !token) return;

    const fetchData = async () => {
        try {
            const response = await fetch(`${API_URL}/get-tasks/${email}`);
            const result = await response.json();

            if (result.success && result.tasks) {
                setTaskStatus(result.tasks);
                calculateStatusText(result.tasks);
            } else {
                setStatusText('No tasks found');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setStatusText('Unable to fetch status');
        }
        
        await Promise.all([
          fetchConvocationScheduleData(token),
          fetchAttireScheduleData(token) 
        ]);

        setLoading(false);
    };

    fetchData();
  }, [email, token]);

  // Fetch dynamic tickets based on student's confirmation
  useEffect(() => {
    if (!email) return;
    
    const generateTickets = () => {
        const studentData = userData;
        if (!studentData) return;
        
        const generatedTickets = [];

        let convocationDate = 'Not Available'; 
        let convocationTimeSlot = '';
        let convocationLocation = 'Not Available';

        if (convocationData) {
            convocationDate = convocationData.date;
            convocationTimeSlot = convocationData.timeSlot;
            convocationLocation = convocationData.location || convocationLocation;
        }

        if (studentData.attendanceStatus === 'attending') {
          generatedTickets.push({
            id: 'attendance-main',
            type: 'attendance',
            eventName: '65th Universiti Malaya Convocation Ceremony (Graduand)',
            date: convocationDate,
            timeSlot: convocationTimeSlot,
            venue: convocationLocation,
            confirmationCode: studentData.attendanceConfirmationCode || generateConfirmationCode(),
            studentName: studentData.username,
            matricNo: studentData.matricNo,
            faculty: studentData.faculty,
            programme: studentData.programme,
          });

          if (studentData.attireOption === 'collect') {
            let attireDate = 'Not Available';
            let attireVenue = 'Not Available';
            
            if (attireSchedule) {
                attireDate = `${attireSchedule.date} (${attireSchedule.timeSlot})`;
                attireVenue = attireSchedule.location;
            }

            generatedTickets.push({
              id: 'gown-collection',
              type: 'gown',
              eventName: 'Academic Attire Collection',
              date: attireDate,
              venue: attireVenue,
              confirmationCode: studentData.gownConfirmationCode || generateConfirmationCode(),
              studentName: studentData.username,
              matricNo: studentData.matricNo,
              attireSize: studentData.attireSize,
              hasRepresentative: studentData.representative === 'yes',
              representativeName: studentData.representativeDetails?.name,
              representativeID: studentData.representativeDetails?.id,
            });
          }
        }

        setTickets(generatedTickets);
    };

    if (userData) {
      generateTickets();
    }
  }, [email, userData, convocationData, attireSchedule]);

  const generateConfirmationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const calculateStatusText = (tasks) => {
    const taskOrder = [
      'update-profile',
      'graduate-tracer',
      'attire-confirmation',
      'attire-collection',
      'rehearsal-confirmation',
    ];

    const completedCount = taskOrder.filter(taskId => tasks[taskId] === 'completed').length;
    const totalTasks = taskOrder.length;

    if (completedCount === totalTasks) {
      setStatusText('All Tasks Completed ✓');
      return;
    }

    const nextPendingTask = taskOrder.find(taskId => tasks[taskId] !== 'completed');

    if (nextPendingTask) {
      const taskName = taskDisplayNames[nextPendingTask] || nextPendingTask;
      setStatusText(`Pending: ${taskName}`);
    } else {
      setStatusText(`${completedCount}/${totalTasks} Tasks Completed`);
    }
  };

  const getStatusColor = () => {
    if (statusText.includes('All Tasks Completed')) return '#28a745';
    if (statusText.includes('Pending')) return '#ff9800';
    return '#192F59';
  };

  const getStatusIcon = () => {
    if (statusText.includes('All Tasks Completed')) return 'checkmark-circle';
    if (statusText.includes('Pending')) return 'time-outline';
    return 'ellipse-outline';
  };

  const handleTicketPress = (ticketData) => {
    navigation.navigate('TicketDetails', {
      ticketData: ticketData,
    });
  };

  const handleStatusPress = () => {
    navigation.navigate('MainApp', {
      screen: 'Confirmation',
      params: { email }
    });
  };

  if (loading || !userData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#192F59" />
        <Text style={{ marginTop: 10 }}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STUDENT PROFILE</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={26} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: googlePhotoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
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
            <TouchableOpacity
              style={[styles.card, styles.statusCard]}
              onPress={handleStatusPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={getStatusIcon()} 
                size={22} 
                color={getStatusColor()} 
              />
              <View style={styles.cardTextContainer}>
                <Text style={styles.label}>Status</Text>
                <Text style={[styles.value, { color: getStatusColor() }]}>
                  {statusText}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {/* Convocation Schedule Card */}
            {loadingConvocation ? (
              <View style={[styles.card]}>
                <Ionicons name="calendar-outline" size={22} color="#192F59" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.label}>Convocation Schedule</Text>
                  <ActivityIndicator size="small" color="#192F59" />
                </View>
              </View>
            ) : convocationData ? (
              <View style={[styles.card]}>
                <Ionicons name="calendar-outline" size={22} color="#192F59" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.label}>Convocation Ceremony</Text>
                  <View style={styles.convocationDetails}>
                    <View style={styles.convocationRow}>
                      <Ionicons name="calendar-outline" size={16} color="#555" />
                      <Text style={styles.convocationText}>
                        {convocationData.date || 'TBA'}
                      </Text>
                    </View>
                    <View style={styles.convocationRow}>
                      <Ionicons name="time-outline" size={16} color="#555" />
                      <Text style={styles.convocationText}>
                        {convocationData.timeSlot || 'TBA'}
                      </Text>
                    </View>
                    <View style={styles.convocationRow}>
                      <Ionicons name="location-outline" size={16} color="#555" />
                      <Text style={styles.convocationText}>
                        {convocationData.location || 'TBA'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.card]}>
                <Ionicons name="calendar-outline" size={22} color="#999" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.label}>Convocation Schedule</Text>
                  <Text style={[styles.value, { color: '#999' }]}>
                    Not available for your faculty
                  </Text>
                </View>
              </View>
            )}

            {/* Attire Schedule Card */}
            {loadingAttire ? (
              <View style={[styles.card]}>
                <Ionicons name="shirt-outline" size={22} color="#192F59" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.label}>Attire Collection Schedule</Text>
                  <ActivityIndicator size="small" color="#192F59" />
                </View>
              </View>
            ) : attireSchedule ? (
              <View style={[styles.card]}>
                <Ionicons name="shirt-outline" size={22} color="#192F59" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.label}>Academic Attire Collection</Text>
                  <View style={styles.convocationDetails}>
                    <View style={styles.convocationRow}>
                      <Ionicons name="calendar-outline" size={16} color="#555" />
                      <Text style={styles.convocationText}>
                        {attireSchedule.date || 'TBA'}
                      </Text>
                    </View>
                    <View style={styles.convocationRow}>
                      <Ionicons name="time-outline" size={16} color="#555" />
                      <Text style={styles.convocationText}>
                        {attireSchedule.timeSlot || 'TBA'}
                      </Text>
                    </View>
                    <View style={styles.convocationRow}>
                      <Ionicons name="location-outline" size={16} color="#555" />
                      <Text style={styles.convocationText}>
                        {attireSchedule.location || 'TBA'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.card]}>
                <Ionicons name="shirt-outline" size={22} color="#999" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.label}>Attire Collection Schedule</Text>
                  <Text style={[styles.value, { color: '#999' }]}>
                    Not available for your faculty
                  </Text>
                </View>
              </View>
            )}
            
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
            {tickets.length === 0 ? (
              <View style={styles.emptyTicketState}>
                <Ionicons name="ticket-outline" size={60} color="#ccc" />
                <Text style={styles.emptyTicketText}>No tickets available</Text>
                <Text style={styles.emptyTicketSubtext}>
                  Complete your attendance confirmation to generate tickets
                </Text>
              </View>
            ) : (
              tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  ref={ticket.type === 'gown' ? gownTicketRef : null}
                  style={styles.ticketWrapper}
                  onPress={() => handleTicketPress(ticket)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.colorStripe, 
                    { backgroundColor: ticket.type === 'attendance' ? '#FFD93D' : '#4CAF50' }
                  ]} />
                  <View style={styles.ticketContent}>
                    <View style={styles.ticketLeft}>
                      <Ionicons name="qr-code-outline" size={40} color="black" />
                    </View>

                    <View style={styles.ticketMiddle}>
                      <Text style={styles.ticketTitle}>{ticket.eventName}</Text>
                      <View style={styles.ticketRow}>
                        <Ionicons name="calendar-outline" size={16} color="#555" />
                        <Text style={styles.ticketDetail}>
                            {ticket.type === 'attendance' && ticket.timeSlot
                                ? `${ticket.date} (${ticket.timeSlot})` 
                                : ticket.date
                            }
                        </Text>
                      </View>
                      <View style={styles.ticketRow}>
                        <Ionicons name="location-outline" size={16} color="#555" />
                        <Text style={styles.ticketDetail}>{ticket.venue}</Text>
                      </View>
                      {ticket.type === 'gown' && ticket.attireSize && (
                        <View style={styles.ticketRow}>
                          <Ionicons name="shirt-outline" size={16} color="#555" />
                          <Text style={styles.ticketDetail}>Size: {ticket.attireSize}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.ticketRight}>
                      <Ionicons name="chevron-forward-outline" size={22} color="#000" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {guests.length > 0 && (
              <>
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
                      onPress={() => handleTicketPress(guest)}
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
                        </View>

                        <View style={styles.ticketRight}>
                          <Ionicons name="chevron-forward-outline" size={22} color="#000" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
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
  avatar: { width: 80, height: 80, borderRadius: 50, marginBottom: 10 },
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
    alignItems: 'flex-start',
    marginBottom: 10,
    elevation: 1,
  },
  statusCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#192F59',
  },
  convocationTitle: {
    fontSize: 16,
    color: '#192F59',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
  },
  convocationDetails: {
    marginTop: 4,
  },
  convocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  convocationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 8,
  },
  cardTextContainer: { marginLeft: 15, flex: 1 },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 16, color: '#000', fontWeight: '500' },
  ticketContainer: { paddingHorizontal: 15, paddingTop: 10 },
  emptyTicketState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTicketText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptyTicketSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
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
  guestsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 5,
  },
  guestsTitle: { fontSize: 15, fontWeight: '600', marginLeft: 5, color: '#000' },
});

export default Profile;