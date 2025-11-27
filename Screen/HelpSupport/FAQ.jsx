"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator, // Added for loading state
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// NOTE: Replace 'umconvo-app' with your actual Firebase Project ID if different.
const PROJECT_ID = 'umconvo-app'; 
const FIRESTORE_FAQ_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/faqs`;

export default function FAQPage({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null); // Initialize as null
  const [faqData, setFaqData] = useState([]); // State to hold fetched FAQ data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // --- Data Fetching Logic (useEffect) ---
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(FIRESTORE_FAQ_URL);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch FAQs: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Transform Firebase documents to local format
        const formattedFAQs = data.documents?.map((doc) => {
          // Extract fields and use the document name as the unique ID
          const id = doc.name.split("/").pop();
          const fields = doc.fields;

          return {
            id: id,
            // Access Firestore field values: .stringValue, .integerValue, etc.
            question: fields.question?.stringValue || 'No question',
            answer: fields.answer?.stringValue || 'No answer provided.',
          };
        }) || [];

        setFaqData(formattedFAQs);

        // Optionally, set the first item to be expanded on load
        if (formattedFAQs.length > 0) {
            setExpandedId(formattedFAQs[0].id);
        }

      } catch (err) {
        console.error("Error fetching FAQ data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []); // Empty dependency array runs once on mount

  // --- Search/Filtering Logic (useMemo) ---
  const filteredFAQs = useMemo(() => {
    if (!searchQuery) {
      return faqData;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    return faqData.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerCaseQuery) ||
        item.answer.toLowerCase().includes(lowerCaseQuery)
    );
  }, [searchQuery, faqData]);

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // --- UI Rendering ---

  // 1. Loading State
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#13274f" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading frequently asked questions...</Text>
      </SafeAreaView>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={{ color: "#F44336", fontSize: 16, marginTop: 10 }}>Error loading FAQs</Text>
        <Text style={{ color: "#666", fontSize: 14, marginTop: 5, textAlign: 'center', paddingHorizontal: 20 }}>
          {error}. Please check your network and Firebase configuration.
        </Text>
      </SafeAreaView>
    );
  }

  // 3. Main Content
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>

      {/* Scrollable FAQ Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search FAQ"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* FAQ List */}
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                onPress={() => toggleExpanded(item.id)}
                style={styles.faqHeader}
              >
                <Text style={styles.questionText}>{item.question}</Text>
                <Ionicons
                  name={expandedId === item.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              {expandedId === item.id && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              No FAQs found matching your search.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingTop: 50,
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  /* ===== Scroll and FAQ Styles ===== */
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  searchContainer: {
    position: "relative",
    marginBottom: 20,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 38,
    paddingRight: 16,
    height: 44,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    color: "#000",
  },
  faqItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  questionText: {
    fontWeight: "600",
    flex: 1,
    color: "#000",
    marginRight: 8,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  answerText: {
    color: "#555",
    lineHeight: 20,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#999",
    marginTop: 10,
  },
});