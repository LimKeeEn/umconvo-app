import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import styles from '../../StyleSheet/homepage.styles.js';
import Header from './GuestHeader';

// Get screen width for full-screen image display
const { width, height } = Dimensions.get('window');

// --- Custom Countdown Hook ---
const useCountdown = (targetDateMs) => {
    const [timeRemaining, setTimeRemaining] = useState(null);

    useEffect(() => {
        if (!targetDateMs || isNaN(targetDateMs)) {
            setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const calculateTime = () => {
            const now = new Date().getTime();
            const difference = targetDateMs - now;

            if (difference <= 0) {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(interval);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval);
    }, [targetDateMs]);

    return timeRemaining;
};

// --- HomePage Component ---
const GuestHomePage = () => {
    // Countdown State
    const [targetDateMs, setTargetDateMs] = useState(null);
    const timeRemaining = useCountdown(targetDateMs);
    
    // News State
    const [news, setNews] = useState([]);
    
    // Global Loading/Error State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedNews, setSelectedNews] = useState(null);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const projectID = 'umconvo-app'; 

                // 1. Fetch Countdown Data
                const countdownResponse = await fetch(
                    `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default)/documents/settings/countdown`,
                );
                if (!countdownResponse.ok) throw new Error('Failed to fetch countdown data');
                const countdownData = await countdownResponse.json();
                
                const dateMs = countdownData.fields.targetDateMs.integerValue;
                setTargetDateMs(parseInt(dateMs));

                // 2. Fetch News Data (Ordered by creation time descending)
                const newsResponse = await fetch(
                    `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default)/documents/news?orderBy=createdAt%20desc`,
                );
                if (!newsResponse.ok) throw new Error('Failed to fetch news data');
                const newsData = await newsResponse.json();

                // Transform Firebase documents to local format
                const formattedNews = newsData.documents?.map((doc) => ({
                    id: doc.name.split("/").pop(),
                    title: doc.fields.title.stringValue,
                    imageUrl: doc.fields.url.stringValue,
                    info: doc.fields.info?.stringValue || '',
                    createdAt: doc.fields.createdAt?.integerValue || Date.now(),
                })) || [];

                setNews(formattedNews);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const handleNotificationPress = () => {
        console.log('Notification pressed');
        // Add your notification logic here
    };

    const handleNewsPress = (item) => {
        setSelectedImage(item.imageUrl);
        setSelectedNews(item);
        setModalVisible(true);
    };

    // --- UI Rendering ---

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#13274f" />
                <Text style={{ marginTop: 10, color: "#666" }}>Loading home screen data...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
                <Text style={{ color: "#F44336", fontSize: 16, marginTop: 10 }}>Error: {error}</Text>
                <Text style={{ color: "#666", fontSize: 14, marginTop: 5 }}>Could not load data. Check your network and Firebase configuration.</Text>
            </SafeAreaView>
        );
    }

    const formatTime = (value) => (value < 10 ? `0${value}` : `${value}`);

    const countdownItems = [
        { label: 'Days', value: timeRemaining ? formatTime(timeRemaining.days) : '00' },
        { label: 'Hours', value: timeRemaining ? formatTime(timeRemaining.hours) : '00' },
        { label: 'Minutes', value: timeRemaining ? formatTime(timeRemaining.minutes) : '00' },
        { label: 'Seconds', value: timeRemaining ? formatTime(timeRemaining.seconds) : '00' },
    ];

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Header
                title="HOME"
                onNotificationPress={handleNotificationPress}
            />

            <ScrollView
                style={[styles.container, { marginTop: 150 }]}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Countdown Timer */}
                <View style={styles.countdownSection}>                    
                    <View style={styles.timerContainer}>
                        {countdownItems.map((item, index) => (
                            <View key={index} style={styles.timerBox}>
                                <Text style={styles.timerDigit}>{item.value}</Text>
                                <Text style={styles.timerLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* News Section */}
                <Text style={styles.newsTitle}>NEWS</Text>

                {news.length > 0 ? (
                    news.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.newsCard}
                            activeOpacity={0.7}
                            onPress={() => handleNewsPress(item)}
                        >
                            <Image
                                source={{ uri: item.imageUrl }} 
                                style={styles.newsImage}
                                resizeMode="cover" 
                            />
                            <Text style={styles.newsText} numberOfLines={2}>
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="newspaper-outline" size={32} color="#ccc" />
                        <Text style={styles.emptyText}>No news available.</Text>
                    </View>
                )}

            </ScrollView>

            {/* Image Popup Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                    setSelectedImage(null);
                    setSelectedNews(null);
                }}
            >
                <View style={styles.modalCenteredView}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => {
                            setModalVisible(false);
                            setSelectedNews(null);
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="close-circle" size={36} color="#FFF" />
                    </TouchableOpacity>

                    <ScrollView 
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={true}
                    >
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.modalFullScreenImage}
                                resizeMode="contain"
                            />
                        )}
                        
                        {selectedNews && selectedNews.info && (
                            <View style={styles.modalInfoContainer}>
                                <Text style={styles.modalInfoTitle}>{selectedNews.title}</Text>
                                <Text style={styles.modalInfoText}>{selectedNews.info}</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default GuestHomePage;