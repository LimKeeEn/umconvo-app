import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import styles from "../../StyleSheet/services.styles.js";
import Header from './GuestHeader';

const GuestServices = () => {
  const [images, setImages] = useState([]);

  // Fetch images from REST API
  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Fetch metadata from Firestore REST API
        const response = await fetch(
          "https://firestore.googleapis.com/v1/projects/umconvo-app/databases/(default)/documents/images"
        );
        const data = await response.json();

        // Map image data
        const fetchedImages = data.documents.map((doc) => {
          const fields = doc.fields;
          return {
            id: doc.name.split("/").pop(),
            name: fields.name.stringValue,
            url: fields.url.stringValue,
          };
        });

        setImages(fetchedImages);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, []);

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
        style={[styles.container, { marginTop: 150 }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.Title}>
          [UMCONVO 64] CONVOCATION PHOTO REGISTRATION
        </Text>

        {/* Dynamic Photo Gallery */}
        {images.map((image) => (
          <View key={image.id} style={styles.Card}>
            <Image
              source={{ uri: image.url }}
              style={styles.Image}
            />
            {/* <Text style={styles.ImageTitle}>{image.name}</Text> */}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default GuestServices;