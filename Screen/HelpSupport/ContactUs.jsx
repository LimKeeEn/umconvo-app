import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 🔧 Set your Firebase project ID
const PROJECT_ID = "umconvo-app";
const FIRESTORE_CONTACTS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/contacts`;

export default function ContactUs() {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch contacts from Firestore REST API
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(FIRESTORE_CONTACTS_URL);
        const data = await response.json();

        if (!data.documents) {
          console.error("No contact data found");
          setLoading(false);
          return;
        }

        // Format Firestore documents into clean objects
        const formattedContacts = data.documents.map((doc) => {
          const fields = doc.fields;
          return {
            title: fields.title?.stringValue || "Unknown",
            organization: fields.organization?.stringValue || "",
            role: fields.role?.stringValue || "",
            emails: fields.emails?.arrayValue?.values?.map((v) => v.stringValue) || [],
            phones: fields.phones?.arrayValue?.values?.map((v) => v.stringValue) || [],
          };
        });

        // Group contacts by title
        const grouped = formattedContacts.reduce((acc, item) => {
          if (!acc[item.title]) acc[item.title] = [];
          acc[item.title].push(item);
          return acc;
        }, {});

        setContacts(grouped);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {Object.keys(contacts).map((title, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {contacts[title].map((contact, idx) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.role}>{contact.role}</Text>
                <Text style={styles.org}>{contact.organization}</Text>

                {/* Email(s) */}
                {contact.emails.map((email, i) => (
                  <TouchableOpacity key={i} onPress={() => handleEmailPress(email)}>
                    <View style={styles.row}>
                      <Ionicons name="mail-outline" size={18} color="#007AFF" />
                      <Text style={styles.text}>{email}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Phone(s) */}
                {contact.phones.map((phone, i) => (
                  <TouchableOpacity key={i} onPress={() => handlePhonePress(phone)}>
                    <View style={styles.row}>
                      <Ionicons name="call-outline" size={18} color="#007AFF" />
                      <Text style={styles.text}>{phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    padding: 16,
  },
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#192F59",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  role: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  org: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  text: {
    marginLeft: 8,
    color: "#007AFF",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
