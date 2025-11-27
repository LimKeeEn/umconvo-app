import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity, 
    Linking, 
    SafeAreaView, 
    ScrollView,
    Alert
} from 'react-native';
// Assuming you use @expo/vector-icons or similar
import { Ionicons } from '@expo/vector-icons'; 

// NOTE: Set your Firebase Project ID here
const PROJECT_ID = 'umconvo-app'; 
const FIRESTORE_KEY_PEOPLE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/key_people`;

// --- Core Data Display Component ---
const KeyPersonCard = ({ title, website }) => {
    const getDisplayUrl = (url) => {
        try {
            const urlObject = new URL(url);
            return urlObject.hostname.replace(/^www\./, '') || urlObject.pathname;
        } catch (e) {
            return 'Website Link';
        }
    };

    const handlePress = () => {
        if (website) {
            Linking.openURL(website).catch(err => {
                console.error('Failed to open URL:', err);
                Alert.alert("Link Error", "Could not open the website link. Please check the URL format.");
            });
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.iconPlaceholder}>
                <Text style={styles.iconText}>💼</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.titleText}>{title || "Untitled Role"}</Text>
                
                <TouchableOpacity 
                    onPress={handlePress} 
                    disabled={!website}
                    style={styles.websiteLinkArea}
                >
                    <Text style={styles.websiteText}>
                        {website ? `🔗 ${getDisplayUrl(website)}` : "No website provided"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


/**
 * KeyPeoplePage Component
 * MODIFIED: Added a structured header mirroring the FAQ page.
 */
// NOTE: We assume 'navigation' is passed as a prop from a router/stack navigator.
const KeyPeoplePage = ({ navigation }) => {
    const [keyPeople, setKeyPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic (Using REST API via fetch) ---
    useEffect(() => {
        const fetchKeyPeople = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(FIRESTORE_KEY_PEOPLE_URL);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch Key People: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                
                const documents = data.documents || [];

                const formattedPeople = documents.map((doc) => {
                    const id = doc.name.split("/").pop();
                    const fields = doc.fields;

                    return {
                        id: id,
                        title: fields.title?.stringValue || 'N/A',
                        website: fields.website?.stringValue || '',
                    };
                });

                setKeyPeople(formattedPeople);

            } catch (err) {
                console.error("Error fetching Key People data:", err);
                setError(err.message || "An unknown error occurred while fetching data.");
            } finally {
                setLoading(false);
            }
        };

        fetchKeyPeople();
    }, []); 

    // --- Conditional Rendering for UI States ---

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#13274f" />
                    <Text style={styles.loadingText}>Loading Directory...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="#13274f" />
                </TouchableOpacity> 
                <Text style={styles.headerTitle}>Key People</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
                
                <Text style={styles.pageTitle}>Key People Directory</Text>
                <Text style={styles.subtitle}>
                    Official contact and resource links for key roles.
                </Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>🚨 {error}</Text>
                        <Text style={styles.errorDetail}>Please ensure the Firebase Project ID is correct and Firestore access rules allow reading this collection.</Text>
                    </View>
                )}

                {keyPeople.length === 0 && !error ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Directory is currently empty.</Text>
                        <Text style={styles.emptyDetail}>No key people roles found in the database.</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {keyPeople.map((person) => (
                            <KeyPersonCard 
                                key={person.id} 
                                title={person.title} 
                                website={person.website} 
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};


// --- StyleSheet Definition (Updated for Header) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
    },
    // Styles for the new fixed header component
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#ffffff', // White header background
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        position: 'absolute',
        left: 15,
        top: 50,
        zIndex: 1,
    },
    headerButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#13274f',
    },
    // Styles for the main page content area
    scrollContent: {
        padding: 20,
        paddingBottom: 40, 
    },
    pageTitle: {
        fontSize: 24, // Slightly smaller than the H1 header for content
        fontWeight: 'bold',
        color: '#13274f',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#13274f',
        fontSize: 16,
    },
    errorContainer: {
        padding: 15,
        marginBottom: 20,
        backgroundColor: '#f8d7da',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        borderRadius: 8,
    },
    errorText: {
        color: '#721c24',
        fontWeight: 'bold',
        fontSize: 14,
    },
    errorDetail: {
        fontSize: 12,
        color: '#721c24',
        marginTop: 5,
        textAlign: 'center',
    },
    emptyContainer: {
        padding: 40,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#343a40',
        marginBottom: 4,
    },
    emptyDetail: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
    listContainer: {
        gap: 15, 
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, 
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffc107',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        fontSize: 20,
    },
    textContainer: {
        flex: 1,
    },
    titleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#13274f',
        marginBottom: 4,
    },
    websiteLinkArea: {
        paddingVertical: 5, 
        paddingRight: 10,
        marginTop: -5, 
        alignSelf: 'flex-start',
    },
    websiteText: {
        fontSize: 14,
        color: '#007bff', 
        textDecorationLine: 'underline',
    },
});

export default KeyPeoplePage;