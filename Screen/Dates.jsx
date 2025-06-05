import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../StyleSheet/dates.styles.js';

const Dates = () => {
  const [view, setView] = useState('past');

  const pastDates = [
    {
      title: 'Update graduate profile information',
      date: 'Before Sep 2024',
      location: 'Profile Tab',
    },
    {
      title: 'Completion of Graduate Tracer Study (SKPG) 2024',
      date: '24 Oct - 15 Nov 2024',
      location: 'SKPG Official Website',
    },
    {
      title: 'Email invitation to attend Convocation Ceremony',
      date: '21 Oct 2024',
      location: 'Siswa Mail',
    },
  ];

  const upcomingDates = [
    {
      title: 'Attendance Confirmation by UM Graduates',
      date: '1 Nov - 17 Nov 2024',
      location: 'Confirmation Tab',
    },
    {
      title: 'Collection of Academic Attire (Gown)',
      date: '16 - 17 Nov 2024\n9.00am - 6.00pm',
      location: 'Examination Building, UM / *UMCCed Cyberjaya Campus, UM',
    },
    {
      title: 'Convocation Rehearsal for Graduates',
      date: '28 Nov 2024\n2.30pm - 4.30pm',
      location: 'Dewan Tunku Canselor, UM',
    },
  ];

  const currentDates = view === 'past' ? pastDates : upcomingDates;

  return (
    <SafeAreaView style={{ flex: 1 }}>
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

            <Text style={styles.headerText}>IMPORTANT DATES</Text>

            <TouchableOpacity style={styles.notOverlay}>
              <Ionicons name="notifications-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.container, { marginTop: 90 }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Toggle Buttons */}
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchButton, view === 'past' && styles.activeSwitch]}
            onPress={() => setView('past')}
          >
            <Text style={styles.switchText}>Past</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchButton, view === 'upcoming' && styles.activeSwitch]}
            onPress={() => setView('upcoming')}
          >
            <Text style={styles.switchText}>Upcoming</Text>
          </TouchableOpacity>
        </View>

        {/* Dates Card List */}
        {currentDates.map((item, index) => {
          const color =
            view === 'past'
              ? '#4CAF50'
              : index === 0
              ? '#F44336'
              : '#FFEB3B';

          return (
            <View key={index} style={styles.card}>
              <View style={[styles.sideBar, { backgroundColor: color }]} />
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} />
                  <Text style={styles.infoText}>{item.date}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} />
                  <Text style={styles.infoText}>{item.location}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} style={styles.chevron} />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dates;