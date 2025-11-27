import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
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
 * It receives ticketData via route.params.
 * Uses QR API instead of package to avoid installation issues.
 */
export default function TicketDetailsScreen({ route, navigation }) {
    const { ticketData = {} } = route.params || {}; 

    if (!ticketData || !ticketData.eventName) {
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
    
    // Determine ticket type and colors
    const ticketType = ticketData.type || 'attendance';
    const isAttendance = ticketType === 'attendance';
    const isGown = ticketType === 'gown';
    const isGuest = ticketType === 'guest';
    
    // Color scheme based on ticket type
    let color, accentColor, headerTitle;
    if (isAttendance) {
        color = '#192F59';
        accentColor = '#FFD93D';
        headerTitle = 'CONVOCATION ATTENDANCE TICKET';
    } else if (isGown) {
        color = '#4CAF50';
        accentColor = '#4CAF50';
        headerTitle = 'GOWN COLLECTION TICKET';
    } else if (isGuest) {
        color = '#9B5DE5';
        accentColor = '#9B5DE5';
        headerTitle = 'GUEST PASS';
    } else {
        color = '#192F59';
        accentColor = '#FFD93D';
        headerTitle = 'TICKET';
    }

    // Generate QR code data
    const generateQRData = () => {
        const qrData = {
            type: ticketType,
            confirmationCode: ticketData.confirmationCode,
            matricNo: ticketData.matricNo,
            name: ticketData.studentName || ticketData.guestNumber,
            timestamp: new Date().toISOString(),
        };
        
        if (isGown) {
            qrData.attireSize = ticketData.attireSize;
            qrData.hasRepresentative = ticketData.hasRepresentative;
            if (ticketData.hasRepresentative) {
                qrData.representativeName = ticketData.representativeName;
                qrData.representativeID = ticketData.representativeID;
            }
        }
        
        return JSON.stringify(qrData);
    };

    // Generate QR code URL using API (No package installation needed!)
    const getQRCodeUrl = () => {
        const qrData = generateQRData();
        // Using QR Server API - free and reliable
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&margin=10`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: color }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Main Event Title */}
                <Text style={[styles.mainTitle, { color: color }]}>
                    {ticketData.eventName}
                </Text>
                
                {/* QR Code Section */}
                <View style={[styles.qrCodeSection, { borderColor: accentColor }]}>
                    <View style={styles.qrCodeContainer}>
                        {/* QR Code using API - No installation needed! */}
                        <Image
                            source={{ uri: getQRCodeUrl() }}
                            style={styles.qrCodeImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.qrCodeLabel}>
                        {isGown 
                            ? 'Scan this code at the collection counter' 
                            : 'Scan this code at the venue entrance'}
                    </Text>
                    {ticketData.confirmationCode && (
                        <View style={styles.confirmationContainer}>
                            <Text style={styles.confirmationLabel}>Confirmation Number</Text>
                            <Text style={styles.confirmationNumber}>
                                {ticketData.confirmationCode}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    {/* Graduand/Guest Name */}
                    <DetailItem 
                        icon="person-outline" 
                        label={isGuest ? 'Guest' : 'Graduand Name'} 
                        value={ticketData.studentName || ticketData.guestNumber || 'N/A'} 
                    />
                    
                    {/* Matric Number (if not guest) */}
                    {!isGuest && ticketData.matricNo && (
                        <DetailItem 
                            icon="id-card-outline" 
                            label="Matric Number" 
                            value={ticketData.matricNo} 
                        />
                    )}
                    
                    {/* Faculty (if available) */}
                    {ticketData.faculty && (
                        <DetailItem 
                            icon="business-outline" 
                            label="Faculty" 
                            value={ticketData.faculty} 
                        />
                    )}
                    
                    {/* Programme (if available) */}
                    {ticketData.programme && (
                        <DetailItem 
                            icon="book-outline" 
                            label="Programme" 
                            value={ticketData.programme} 
                        />
                    )}
                    
                    {/* Event Date & Time */}
                    <DetailItem 
                        icon="calendar-outline" 
                        label="Date & Time" 
                        value={ticketData.date} 
                    />
                    
                    {/* Venue */}
                    <DetailItem 
                        icon="location-outline" 
                        label="Venue" 
                        value={ticketData.venue} 
                    />
                    
                    {/* Gown-specific details */}
                    {isGown && ticketData.attireSize && (
                        <DetailItem 
                            icon="shirt-outline" 
                            label="Attire Size" 
                            value={ticketData.attireSize} 
                        />
                    )}
                    
                    {isGown && ticketData.hasRepresentative && (
                        <>
                            <DetailItem 
                                icon="people-outline" 
                                label="Representative Name" 
                                value={ticketData.representativeName || 'N/A'} 
                            />
                            <DetailItem 
                                icon="card-outline" 
                                label="Representative ID" 
                                value={ticketData.representativeID || 'N/A'} 
                            />
                        </>
                    )}
                    
                    {/* Ticket Type */}
                    <DetailItem 
                        icon="information-circle-outline" 
                        label="Ticket Type" 
                        value={
                            isAttendance ? 'Convocation Attendance' : 
                            isGown ? 'Academic Attire Collection' : 
                            'Guest Pass'
                        } 
                    />
                </View>

                {/* Important Notes Section */}
                {isGown && (
                    <View style={styles.notesCard}>
                        <View style={styles.notesHeader}>
                            <Ionicons name="alert-circle-outline" size={20} color="#ff9800" />
                            <Text style={styles.notesTitle}>Collection Guidelines</Text>
                        </View>
                        <Text style={styles.notesText}>
                            • Present this QR code at the collection counter{'\n'}
                            • {ticketData.hasRepresentative 
                                ? 'Your representative must bring their ID card' 
                                : 'Bring your student ID card'}{'\n'}
                            • Collection hours: 9:00 AM - 5:00 PM{'\n'}
                            • Academic attire must be returned after ceremony
                        </Text>
                    </View>
                )}

                {isAttendance && (
                    <View style={styles.notesCard}>
                        <View style={styles.notesHeader}>
                            <Ionicons name="alert-circle-outline" size={20} color="#ff9800" />
                            <Text style={styles.notesTitle}>Important Reminder</Text>
                        </View>
                        <Text style={styles.notesText}>
                            • Please arrive at least 1 hour before ceremony{'\n'}
                            • Bring your student ID card{'\n'}
                            • Dress in full academic attire{'\n'}
                            • Follow the assigned seating arrangement
                        </Text>
                    </View>
                )}
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        paddingHorizontal: 17
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
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 25,
    },
    qrCodeSection: {
        backgroundColor: 'white',
        padding: 25,
        borderRadius: 15,
        borderWidth: 3,
        borderStyle: 'dashed',
        alignItems: 'center',
        marginBottom: 25,
        width: '100%',
    },
    qrCodeContainer: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    qrCodeImage: {
        width: 200,
        height: 200,
    },
    qrCodeLabel: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 15,
        textAlign: 'center',
    },
    confirmationContainer: {
        marginTop: 15,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        width: '100%',
    },
    confirmationLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    confirmationNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        letterSpacing: 2,
    },
    detailsCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 20,
        width: '100%',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    notesCard: {
        backgroundColor: '#FFF9E6',
        borderRadius: 12,
        padding: 15,
        width: '100%',
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    notesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    notesText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
    },
});