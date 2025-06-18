"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import styles from "../StyleSheet/dates.styles.js"

const Dates = () => {
  const [view, setView] = useState("upcoming")
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Fetch data from Firebase
  useEffect(() => {
    const fetchDates = async () => {
      try {
        setLoading(true)
        // Replace with your actual Firebase REST API endpoint
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/umconvo-app/databases/(default)/documents/importantDates?orderBy=createdAt`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch dates")
        }

        const data = await response.json()

        // Transform Firebase documents to our format
        const formattedDates = data.documents.map((doc) => ({
          id: doc.name.split("/").pop(),
          title: doc.fields.title.stringValue,
          date: doc.fields.date.stringValue,
          time: doc.fields.time?.stringValue || "",
          location: doc.fields.location.stringValue,
          pdfUrl: doc.fields.pdfUrl?.stringValue || "",
          pdfName: doc.fields.pdfName?.stringValue || "",
          status: doc.fields.status?.stringValue || "active",
          createdAt: doc.fields.createdAt?.timestampValue || "",
        }))

        setDates(formattedDates)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDates()
  }, [])

  // Filter dates based on current view (past/upcoming)
  const filterDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dates
      .filter((date) => {
        const startDate = new Date(date.date);
        startDate.setHours(0, 0, 0, 0);
        
        // For events with end time
        if (date.time) {
          const endTime = new Date(date.time);
          
          // Ongoing event (current date is between start and end)
          const isOngoing = today >= startDate && today <= endTime;
          
          // Past event (both start and end are in past)
          const isPast = today > endTime;
          
          // Future event (both start and end are in future)
          const isFuture = today < startDate;
          
          if (view === "past") {
            return isPast;
          } else { // upcoming view
            return isOngoing || isFuture;
          }
        } 
        // For all-day events (no end time)
        else {
          const isPast = today > startDate;
          const isToday = today.getTime() === startDate.getTime();
          
          if (view === "past") {
            return isPast && !isToday; // Exclude today from past
          } else { // upcoming view
            return !isPast || isToday; // Include today and future
          }
        }
      })
      .sort((a, b) => {
        // Sort upcoming dates in ascending order, past dates in descending
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return view === "upcoming" ? dateA - dateB : dateB - dateA;
      });
  };

  const currentDates = filterDates()

  // Format date display
  const formatDateDisplay = (dateString, timeString) => {
    if (!dateString) return ""

    const date = new Date(dateString)
    const options = { day: "numeric", month: "short", year: "numeric" }
    let formatted = date.toLocaleDateString("en-US", options)

    if (timeString) {
      const time = new Date(timeString)
      const timeFormatted = time.toLocaleDateString("en-US", options)
      formatted = `${formatted} - ${timeFormatted}`
    }

    return formatted
  }

  // Get color based on date
  const getDateColor = (dateString, timeString) => {
    const now = new Date();
    const startDate = new Date(dateString);
    startDate.setHours(0, 0, 0, 0);

    // For events with end time
    if (timeString) {
      const endTime = new Date(timeString);
      
      // Ongoing event (current time is between start and end)
      if (now >= startDate && now <= endTime) {
        return "#F44336"; // Red for ongoing
      }
      // Future event (both start and end are in future)
      else if (now < startDate) {
        const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 ? "#F44336" : "#FFC107"; // Red for ≤7 days, Yellow for >7
      }
      // Past event (both start and end are in past)
      else {
        return "#4CAF50"; // Green for past
      }
    } 
    // For all-day events (no end time)
    else {
      const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return "#4CAF50"; // Green for past
      } 
      else if (diffDays === 0) {
        return "#F44336"; // Red for today
      }
      else {
        return diffDays <= 7 ? "#F44336" : "#FFC107"; // Red for ≤7 days, Yellow for >7
      }
    }
  };

  // Handle date item press
  const handleDatePress = (date) => {
    setSelectedDate(date)
    setModalVisible(true)
  }

  // Handle PDF press
  const handlePDFPress = async (pdfUrl, pdfName) => {
    if (!pdfUrl) {
      Alert.alert("No PDF", "No PDF file is available for this date.")
      return
    }

    try {
      const supported = await Linking.canOpenURL(pdfUrl)
      if (supported) {
        await Linking.openURL(pdfUrl)
      } else {
        Alert.alert("Error", "Cannot open PDF file.")
      }
    } catch (error) {
      console.error("Error opening PDF:", error)
      Alert.alert("Error", "Failed to open PDF file.")
    }
  }

  // Close modal
  const closeModal = () => {
    setModalVisible(false)
    setSelectedDate(null)
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#13274f" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading important dates...</Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={{ color: "#F44336", fontSize: 16, marginTop: 10 }}>Error: {error}</Text>
        <TouchableOpacity
          style={{ marginTop: 20, padding: 10, backgroundColor: "#13274f", borderRadius: 5 }}
          onPress={() => window.location.reload()}
        >
          <Text style={{ color: "white" }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Fixed Header */}
      <View style={styles.HeaderContainer}>
        <ImageBackground source={require("../assets/Started_1.png")} style={styles.header} resizeMode="cover">
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
      <ScrollView style={[styles.container, { marginTop: 90 }]} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Toggle Buttons */}
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchButton, view === "past" && styles.activeSwitch]}
            onPress={() => setView("past")}
          >
            <Text style={[styles.switchText, view === "past" && styles.activeSwitchText]}>Past</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchButton, view === "upcoming" && styles.activeSwitch]}
            onPress={() => setView("upcoming")}
          >
            <Text style={[styles.switchText, view === "upcoming" && styles.activeSwitchText]}>Upcoming</Text>
          </TouchableOpacity>
        </View>

        {/* Dates Card List */}
        {currentDates.length > 0 ? (
          currentDates.map((item, index) => {
            const color = getDateColor(item.date, item.time)

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => handleDatePress(item)}
                activeOpacity={0.7}
              >
                {/* Sidebar with the same color */}
                <View style={[styles.sideBar, { backgroundColor: color }]} />
                
                <View style={styles.cardContent}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{formatDateDisplay(item.date, item.time)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                  {item.pdfUrl && (
                    <View style={styles.infoRow}>
                      <Ionicons name="document-outline" size={16} color="#1E88E5" />
                      <Text style={[styles.infoText, { color: "#1E88E5" }]}>PDF Available</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} style={styles.chevron} color="#666" />
              </TouchableOpacity>
            )
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No {view} dates found</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedDate && (
                <>
                  {/* Title Section */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>TITLE</Text>
                    <Text style={styles.detailValue}>{selectedDate.title}</Text>
                  </View>

                  {/* Date & Time Section */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>DATE & TIME</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color="#13274f" />
                      <Text style={styles.detailValue}>{formatDateDisplay(selectedDate.date, selectedDate.time)}</Text>
                    </View>
                  </View>

                  {/* Location Section */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>LOCATION</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={20} color="#13274f" />
                      <Text style={styles.detailValue}>{selectedDate.location}</Text>
                    </View>
                  </View>

                  {/* Status Section */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>STATUS</Text>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getDateColor(selectedDate.date, selectedDate.time) }]} />
                      <Text style={styles.statusText}>
                        {(() => {
                          const color = getDateColor(selectedDate.date, selectedDate.time);
                          if (color === "#F44336") {
                            const now = new Date();
                            const start = new Date(selectedDate.date);
                            const end = selectedDate.time ? new Date(selectedDate.time) : null;
                            
                            if (end && now >= start && now <= end) {
                              return "Ongoing Event";
                            }
                            return "Upcoming Soon (≤7 days)";
                          } else if (color === "#FFC107") {
                            return "Upcoming Later (>7 days)";
                          } else {
                            return "Past Event";
                          }
                        })()}
                      </Text>
                    </View>
                  </View>

                  {/* PDF Section */}
                  {selectedDate.pdfUrl && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>GUIDELINE DOCUMENT</Text>
                      <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => handlePDFPress(selectedDate.pdfUrl, selectedDate.pdfName)}
                      >
                        <Ionicons name="document-text" size={24} color="white" />
                        <View style={styles.pdfButtonContent}>
                          <Text style={styles.pdfButtonTitle}>View PDF Guideline</Text>
                          <Text style={styles.pdfButtonSubtitle}>{selectedDate.pdfName || "Tap to open document"}</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeModalButton} onPress={closeModal}>
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Dates