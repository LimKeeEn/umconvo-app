import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import styles from '../StyleSheet/confirmation.styles.js';
import Header from '../NavigationBar/Header';

const tasks = [
  { title: 'Update Profile Information', status: 'pending' },
  { title: 'Completion of Graduate Tracer Study (SKPG)', status: 'pending' },
  { title: 'Attendance & Academic Attire Confirmation', status: 'pending' },
  { title: 'Collection of Academic Attire', status: 'pending' },
  { title: 'Attendance of Rehearsal Confirmation', status: 'pending' },
];

const Confirmation = () => {
  const progress = 0 / tasks.length;

  const handleTaskPress = (taskTitle) => {
    console.log(`Pressed: ${taskTitle}`);
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Add your notification logic here
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <Header 
        title="IMPORTANT DATES"
        onNotificationPress={handleNotificationPress}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.container, { marginTop: 150 }]} // Same height as header
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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