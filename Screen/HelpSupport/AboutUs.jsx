"use client";

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { MaterialCommunityIcons } from "@expo/vector-icons"; 
import { Feather } from "@expo/vector-icons"; 

const AboutScreen = ({ navigation }) => {
  // Define features with specific icons and colors as per the design
  const features = [
    { id: 1, title: "Background", iconComponent: MaterialCommunityIcons, iconName: "account-group", iconColor: "#7C5CFF", navigateTo: "Background" },
    { id: 2, title: "Key People", iconComponent: Feather, iconName: "key", iconColor: "#FFC857", navigateTo: "KeyPeople" },
    { id: 3, title: "Campus Map", iconComponent: Feather, iconName: "map-pin", iconColor: "#1A1A1A", navigateTo: "CampusMap" },
    { id: 4, title: "Contact Us", iconComponent: Feather, iconName: "phone", iconColor: "#2563EB", navigateTo: "ContactUs" },
  ];

  // Custom inline card component
  const RenderCard = ({ title, iconComponent: Icon, iconName, iconColor, navigateTo }) => (
    <TouchableOpacity
      style={styles.card} 
      onPress={() => {
        navigation.navigate(navigateTo); 
      }}
    >
      <Icon name={iconName} size={30} color={iconColor} /> 
      <Text style={styles.cardText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Set status bar style */}
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
      </View>

      {/* Scrollable Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* UMConvo Intro Section */}
        <View style={styles.umConvoIntro}>
          <Text style={styles.umConvoTitle}>WE ARE UMConvo</Text>
          <Text style={styles.umConvoSubtitle}>
            Simplifying your convocation journey with seamless
            step — all in one app
          </Text>
        </View>

        {/* Feature Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <RenderCard {...features[0]} />
            <RenderCard {...features[1]} />
          </View>
          <View style={styles.gridRow}>
            <RenderCard {...features[2]} />
            <RenderCard {...features[3]} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50, 
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  umConvoIntro: {
    paddingVertical: 24, 
    marginBottom: 16,
  },
  umConvoTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#13274f",
    marginBottom: 8,
  },
  umConvoSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  gridContainer: {
    gap: 16,
  },
  gridRow: {
    flexDirection: "row",
    gap: 16,
  },
  card: {
    flex: 1,
    height: 140, 
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
});

export default AboutScreen;