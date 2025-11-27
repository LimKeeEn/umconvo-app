"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Get screen width for dynamic sizing
const { width } = Dimensions.get('window');

// Firestore REST API endpoint
const PROJECT_ID = "umconvo-app";
const FIRESTORE_ABOUT_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/aboutus_images`;

export default function BackgroundScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("maze");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Background</Text>
      </View>

      {/* Tabs */}
      <View style={styles.navbar}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            onPress={() => setActiveTab("maze")}
            style={[styles.navButton, activeTab === "maze" ? styles.navButtonActive : styles.navButtonInactive]}
          >
            <Text
              style={[styles.navButtonText, activeTab === "maze" ? styles.navButtonTextActive : styles.navButtonTextInactive]}
            >
              The Maze
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("regalia")}
            style={[styles.navButton, activeTab === "regalia" ? styles.navButtonActive : styles.navButtonInactive]}
          >
            <Text
              style={[styles.navButtonText, activeTab === "regalia" ? styles.navButtonTextActive : styles.navButtonTextInactive]}
            >
              Academic Regalia
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Renders TheMaze or AcademicRegalia based on activeTab */}
        {activeTab === "maze" ? <TheMaze /> : <AcademicRegalia />}
      </ScrollView>
    </SafeAreaView>
  );
}

/* --------------------------- THE MAZE SECTION --------------------------- */
function TheMaze() {
  // Ensure all Hooks are called at the top level and in the same order
  const [mazeData, setMazeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchMazeImage = async () => {
      try {
        setLoading(true);
        const response = await fetch(FIRESTORE_ABOUT_URL);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);

        const data = await response.json();
        const docs = data.documents || [];
        const mazeDoc = docs.find((doc) => doc.fields?.category?.stringValue === "maze");

        if (mazeDoc) {
          const url = mazeDoc.fields.url?.stringValue || "";
          setMazeData({
            title: mazeDoc.fields.title?.stringValue || "Untitled",
            url: url,
            // category and other fields can be added here
          });

          // Fetch image dimensions to calculate aspect ratio
          if (url) {
            Image.getSize(url, (w, h) => {
              setImageSize({ width: w, height: h });
              setLoading(false);
            }, (e) => {
              console.error("Image.getSize error:", e);
              setError("Could not get image dimensions.");
              setLoading(false);
            });
          } else {
            setError("Image URL not found in Firestore document.");
            setLoading(false);
          }
        } else {
          throw new Error("No 'maze' category document found in Firestore.");
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMazeImage();
  }, []);

  // Calculate the aspect ratio for the image style
  const aspectRatio = imageSize.width > 0 && imageSize.height > 0
    ? imageSize.width / imageSize.height
    : 16 / 9;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F3B5C" />
        <Text style={styles.loadingText}>Loading The Maze...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
        <Text style={styles.errorTextBold}>Error loading image</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{mazeData?.title}</Text>
        <View style={styles.cardGrid}>
          {/* Dynamically loaded image from Firestore */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: mazeData?.url }}
              style={[
                styles.image,
                { aspectRatio: aspectRatio }
              ]}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ----------------------- ACADEMIC REGALIA SECTION ----------------------- */
function AcademicRegalia() {
  // --- HOOKS: All Hooks called at the top level ---
  const [regaliaData, setRegaliaData] = useState([]); // Array to hold multiple regalia items
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // NEW: State to track the expanded item

  // Function to toggle the expanded state
  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  useEffect(() => {
    const fetchRegaliaImages = async () => {
      try {
        setLoading(true);
        const response = await fetch(FIRESTORE_ABOUT_URL);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);

        const data = await response.json();
        const docs = data.documents || [];

        // 1. Filter documents by category "regalia"
        const regaliaDocs = docs.filter((doc) => doc.fields?.category?.stringValue === "regalia");

        // 2. Map and format the documents
        const formattedRegalia = regaliaDocs.map((doc) => ({
          id: doc.name.split("/").pop(),
          title: doc.fields.title?.stringValue || "Untitled Regalia Item",
          url: doc.fields.url?.stringValue || "",
        }));

        setRegaliaData(formattedRegalia);
        
        // Optional: Expand the first item on load
        if (formattedRegalia.length > 0) {
            setExpandedId(formattedRegalia[0].id);
        }

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRegaliaImages();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F3B5C" />
        <Text style={styles.loadingText}>Loading Academic Regalia...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
        <Text style={styles.errorTextBold}>Error loading regalia</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {regaliaData.length > 0 ? (
        regaliaData.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <View key={item.id} style={[styles.faqCard, { marginBottom: 16 }]}>
              {/* Accordion Header (The 'Question' or 'Title' part) */}
              <TouchableOpacity
                onPress={() => toggleExpanded(item.id)}
                style={styles.faqHeader}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#0F3B5C"
                />
              </TouchableOpacity>

              {/* Accordion Content (Conditionally rendered) */}
              {isExpanded && (
                <View style={styles.faqContent}>
                  <View style={styles.cardGrid}>
                    {/* Image (The 'Answer' or 'Image' part) */}
                    <View style={styles.imageContainer}>
                      {item.url ? (
                        <Image
                          source={{ uri: item.url }}
                          // Set a minimum height or better aspect ratio for large images
                          style={[styles.image, { aspectRatio: 1.5, minHeight: 150 }]}
                          resizeMode="contain" // Changed to 'contain' to ensure full image is visible
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Ionicons name="image-outline" size={40} color="#ccc" />
                          <Text style={{ color: '#999', marginTop: 5 }}>No Image URL</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardTextContainer}>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="sad-outline" size={48} color="#ccc" />
          <Text style={{ color: '#666', marginTop: 10 }}>No regalia items found in Firestore.</Text>
        </View>
      )}
    </View>
  );
}


/* ------------------------------- STYLES ------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  
  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },

  /* Tabs */
  navbar: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  navButtons: {
    flexDirection: "row",
    gap: 10,
  },
  navButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navButtonActive: {
    backgroundColor: "#0F3B5C",
  },
  navButtonInactive: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  navButtonTextActive: {
    color: "#fff",
  },
  navButtonTextInactive: {
    color: "#374151",
  },

  /* Main content */
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16, 
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  card: { // Kept for TheMaze component
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: undefined,
    borderRadius: 12,
  },
  imageContainer: {
    marginBottom: 10,
  },
  placeholderImage: {
    width: '100%',
    height: 150, // Fixed height for placeholder
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F3B5C',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  cardGrid: {
    // style for layout if needed
  },
  cardTextContainer: {
    // style for text
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  linkText: {
    color: '#0F3B5C',
    fontWeight: '600',
    fontSize: 14,
  },

  /* Loading/Error common styles */
  loadingContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: { 
    color: "#666", 
    marginTop: 10 
  },
  errorContainer: { 
    alignItems: "center", 
    marginTop: 40 
  },
  errorTextBold: { 
    color: "#D32F2F", 
    fontWeight: "bold", 
    marginTop: 10 
  },
  errorText: { 
    color: "#666", 
    marginTop: 5, 
    textAlign: 'center' 
  },
});