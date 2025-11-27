import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PROJECT_ID = "umconvo-app";
const FIRESTORE_CAMPUS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/aboutus_images/fovfJfoOZYnkUmUbY7C1`;

export default function CampusMapViewer({ navigation }) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  // --- Fetch Image from Firestore ---
  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        const response = await fetch(FIRESTORE_CAMPUS_URL);
        if (!response.ok) throw new Error("Failed to fetch Firestore document");

        const data = await response.json();
        const url = data.fields?.url?.stringValue;

        if (!url) throw new Error("Campus map URL not found in Firestore");

        setImageUrl(url);
        setError("");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load campus map";
        setError(msg);
        console.error("Error loading campus map:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, []);

  // --- PanResponder for drag ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setDragging(true);
        setStart({
          x: gestureState.x0 - position.x,
          y: gestureState.y0 - position.y,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!dragging) return;
        const newX = gestureState.moveX - start.x;
        const newY = gestureState.moveY - start.y;
        setPosition({ x: newX, y: newY });
      },
      onPanResponderRelease: () => setDragging(false),
    })
  ).current;

  // --- Zoom controls ---
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.8));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Map</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading campus map...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Error loading map</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError("");
                setLoading(true);
                setImageUrl("");
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          imageUrl && (
            <Image
              {...panResponder.panHandlers}
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { scale: scale },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          )
        )}

        {/* Controls */}
        {!loading && !error && (
          <>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleZoomIn}
              >
                <Ionicons name="add" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleZoomOut}
              >
                <Ionicons name="remove" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleReset}
              >
                <Ionicons name="refresh" size={22} color="white" />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Drag to pan • Tap buttons to zoom
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },

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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 50,
    zIndex: 1,
  },

  /* Map Area */
  mapContainer: {
    flex: 1,
    backgroundColor: "#020617",
    overflow: "hidden",
  },
  image: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },

  /* Status / Error */
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#94a3b8", marginTop: 10 },
  errorText: { color: "#f87171", fontWeight: "bold", fontSize: 16 },
  errorMessage: { color: "#cbd5e1", marginTop: 4, textAlign: "center" },
  retryButton: {
    backgroundColor: "#2563eb",
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "white", fontWeight: "bold" },

  /* Controls */
  controls: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  controlButton: {
    backgroundColor: "#334155",
    padding: 12,
    borderRadius: 12,
  },

  /* Instructions */
  instructions: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(30,41,59,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  instructionText: { color: "#cbd5e1", fontSize: 13 },
});
