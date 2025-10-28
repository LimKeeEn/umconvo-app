import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Helper component for displaying a single detail row.
 */
const DetailItem = ({ icon, label, value }) => (
    <View style={detailStyles.row}>
        <Ionicons name={icon} size={20} color="#6B7280" style={detailStyles.icon} />
        <View style={detailStyles.textContainer}>
            <Text style={detailStyles.label}>{label}</Text>
            <Text style={detailStyles.value}>{value}</Text>
        </View>
    </View>
);

/**
 * The main screen component for displaying ticket details.
 * It receives ticketData and ticketType via route.params.
 */
export default function TicketDetailsScreen({ route, navigation }) {
    // Safely extract parameters passed from the previous screen
    // Defaults are used in case navigation.navigate was called without params
    const { ticketData = {}, ticketType = 'main' } = route.params || {}; 

    if (!ticketData || !ticketData.eventName) {
        // Handle case where no valid ticket data was passed
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#DC3545', fontSize: 18 }}>
                    Error: Ticket data not found.
                </Text>
                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#192F59', fontSize: 16 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    // Determine colors based on ticket type
    const color = ticketType === 'main' ? '#192F59' : '#9B5DE5';
    const accentColor = ticketType === 'main' ? '#FFD93D' : '#9B5DE5';

    const handleRefreshPress = () => {
        Alert.alert("QR Code Refreshed", "The QR code has been successfully refreshed for security.", [{ text: "OK" }]);
    }
    
    // Determine which name/identifier to show
    const passHolder = ticketData.guestNumber || ticketData.studentId || ticketData.name || 'N/A';
    const passLabel = ticketData.guestNumber ? 'Pass Holder' : 'Graduand';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: color }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {ticketType === 'main' ? 'MAIN TICKET' : 'GUEST PASS'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Main Event Title */}
                <Text style={[styles.mainTitle, { color: color }]}>{ticketData.eventName}</Text>
                
                {/* QR Code Section */}
                <View style={[styles.qrCodeSection, { borderColor: accentColor }]}>
                    <Ionicons name="qr-code-outline" size={120} color={color} />
                    <Text style={styles.qrCodeLabel}>Scan this code at the venue entrance</Text>
                    {ticketData.confirmationCode && (
                        <Text style={styles.confirmationNumber}>
                            Confirmation Number: {ticketData.confirmationCode}
                        </Text>
                    )}
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <DetailItem 
                        icon="person-outline" 
                        label={passLabel} 
                        value={passHolder} 
                    />
                    <DetailItem 
                        icon="calendar-outline" 
                        label="Event Date & Time" 
                        value={ticketData.date} 
                    />
                    <DetailItem 
                        icon="location-outline" 
                        label="Venue" 
                        value={ticketData.venue} 
                    />
                    <DetailItem 
                        icon="information-circle-outline" 
                        label="Ticket Type" 
                        value={ticketType === 'main' ? 'Main Graduand Ticket' : 'Guest Attendance Pass'} 
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.refreshButton, { backgroundColor: color }]}
                    onPress={handleRefreshPress}
                    activeOpacity={0.8}
                >
                    <Ionicons name="sync-outline" size={24} color="white" />
                    <Text style={styles.refreshButtonText}>Refresh QR Code</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const detailStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    icon: {
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#6B7280',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 2,
    },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: {
        height: 100,
        paddingTop: 40,
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
        // boxShadow/shadow is provided by the parent navigator typically
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    backButton: {
        position: 'absolute',
        left: 15,
        top: 55,
        zIndex: 10,
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 25,
    },
    qrCodeSection: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 15,
        borderWidth: 4,
        borderStyle: 'dashed',
        alignItems: 'center',
        marginBottom: 30,
        width: '100%',
    },
    qrCodeLabel: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 15,
    },
    confirmationNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 5,
    },
    detailsCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 20,
        width: '100%',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        gap: 10,
    },
    refreshButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
