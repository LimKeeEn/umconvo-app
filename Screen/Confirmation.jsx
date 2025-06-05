import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import styles from '../StyleSheet/confirmation.styles.js';

const tasks = [
  { title: 'Update Profile Information', status: 'pending' },
  { title: 'Completion of Graduate Tracer Study (SKPG)', status: 'pending' },
  { title: 'Attendance & Academic Attire Confirmation', status: 'pending' },
  { title: 'Collection of Academic Attire', status: 'pending' },
  { title: 'Attendance of Rehearsal Confirmation', status: 'pending' },
];

const Confirmation = () => {
  const progress = 0 / tasks.length; // Adjust logic as needed

  const handleTaskPress = (taskTitle) => {
    console.log(`Pressed: ${taskTitle}`);
    // You can navigate or open modals here
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
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

            <Text style={styles.headerText}>CONFIRMATION</Text>

            <TouchableOpacity style={styles.notOverlay}>
              <Ionicons name="notifications-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>0%</Text>
          <Text style={styles.pendingText}>Pending Update Profile Information</Text>
          <View style={styles.progressBar}>
            <View style={{ flex: progress, backgroundColor: '#192F59', height: 6, borderRadius: 3 }} />
            <View style={{ flex: 1 - progress, backgroundColor: '#ddd', height: 6, borderRadius: 3 }} />
          </View>
        </View>

        {/* Task Cards */}
        {tasks.map((task, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.taskCard, index === 0 && styles.activeCard]}
            onPress={() => handleTaskPress(task.title)}
          >
            <View style={styles.taskLeft}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#192F59" />
              <Text style={styles.taskText}>{task.title}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Ionicons name="home" size={24} color="white" />
        <Ionicons name="calendar" size={24} color="white" />
        <Ionicons name="document-text-outline" size={24} color="white" />
        <Ionicons name="camera" size={24} color="white" />
        <Ionicons name="settings" size={24} color="white" />
      </View>
    </View>
  );
};

export default Confirmation;