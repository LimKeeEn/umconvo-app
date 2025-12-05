// File: AcademicAttireScreen.js

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Header Component
import Header from '../../NavigationBar/Header.jsx';

// --- CONSTANTS ---
const PURCHASE_FORM_LINK = 'https://forms.gle/your-academic-attire-purchase-form';
const REPRESENTATIVE_PDF_LINK = 'https://umconvo.um.edu.my/CONVO%202025/PPOG/DOKUMEN%20-%20IMPORTANT%20DATES/BORANG%20WAKIL%20AMBIL%20JUBAH.docx.pdf';
const API_URL = 'http://192.168.1.234:5000/api';

const sizeOptions = [
    { label: 'S (Small)', value: 'S' },
    { label: 'M (Medium)', value: 'M' },
    { label: 'L (Large)', value: 'L' },
    { label: 'XL (Extra Large)', value: 'XL' },
];

const YesAttendance = ({ route }) => {
    const navigation = useNavigation();
    const { email } = route.params;

    const [attireOption, setAttireOption] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [hasRepresentative, setHasRepresentative] = useState(null);

    // --- UI COMPONENTS ---
    const RadioButton = ({ label, value, selectedValue, onSelect }) => (
        <TouchableOpacity
            style={styles.radioRow}
            onPress={() => onSelect(value)}
        >
            <Ionicons
                name={selectedValue === value ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color="#192F59"
                style={styles.radioIcon}
            />
            <Text style={styles.radioLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const AttireCard = ({ title, children }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            {children}
        </View>
    );

    // --- SUBMISSION HANDLER ---
    const handleFinalSubmit = async () => {
        if (!attireOption) {
            Alert.alert('Incomplete Form', 'Please select Collect or Purchase.');
            return;
        }

        const submissionData = {
            email,
            attendance: 'attending',
            attireOption,
            attireSize: attireOption === 'collect' ? selectedSize : null,
            collectionRepresentative: attireOption === 'collect' ? hasRepresentative : null,
        };

        if (attireOption === 'collect' && (!selectedSize || hasRepresentative === null)) {
            Alert.alert('Incomplete Form', 'Please complete all fields.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/save-attendance-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            const result = await response.json();

            if (!result.success) {
                Alert.alert('Submission Failed', result.message);
                return;
            }

            const successMessage =
                attireOption === 'collect'
                    ? 'Your collection details have been saved.'
                    : 'Thank you. Please complete the purchase form.';

            Alert.alert(
                attireOption === 'collect' ? 'Collection Confirmed' : 'Purchase Acknowledged',
                successMessage,
                [
                    {
                        text: 'OK',
                        onPress: () =>
                            navigation.navigate('MainApp', {
                                screen: 'Confirmation',
                                params: { email },
                            }),
                    },
                ]
            );
        } catch (err) {
            Alert.alert('Error', 'An error occurred while submitting.');
        }
    };

    const renderCollectionDetails = () => (
        <>
            <AttireCard title="Select Attire Size">
                {sizeOptions.map(option => (
                    <RadioButton
                        key={option.value}
                        label={option.label}
                        value={option.value}
                        selectedValue={selectedSize}
                        onSelect={setSelectedSize}
                    />
                ))}
            </AttireCard>

            <AttireCard title="Collection Representative">
                <Text style={styles.subText}>
                    Will a representative collect the attire on your behalf?
                </Text>

                <View style={styles.rowBetween}>
                    <RadioButton
                        label="Yes"
                        value="yes"
                        selectedValue={hasRepresentative}
                        onSelect={setHasRepresentative}
                    />
                    <RadioButton
                        label="No"
                        value="no"
                        selectedValue={hasRepresentative}
                        onSelect={setHasRepresentative}
                    />
                </View>

                {hasRepresentative === 'yes' && (
                    <View style={styles.repBox}>
                        <Text style={styles.repTitle}>Representative Authorization Form</Text>
                        <Text style={styles.repDescription}>
                            Please download and complete this form. It must be presented during collection.
                        </Text>

                        <TouchableOpacity
                            style={styles.repButton}
                            onPress={() => Linking.openURL(REPRESENTATIVE_PDF_LINK)}
                        >
                            <Ionicons name="document-text" size={20} color="white" style={styles.repIcon} />
                            <Text style={styles.repButtonText}>
                                Download Authorization Form (PDF)
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </AttireCard>
        </>
    );

    const renderPurchaseDetails = () => (
        <AttireCard title="Academic Attire Purchase">
            <Text style={styles.subText}>
                Please complete your purchase using the form below.
            </Text>

            <TouchableOpacity
                style={styles.purchaseButton}
                onPress={() => Linking.openURL(PURCHASE_FORM_LINK)}
            >
                <Text style={styles.purchaseButtonText}>Open Purchase Order Form</Text>
            </TouchableOpacity>
        </AttireCard>
    );

    return (
        <View style={styles.container}>
            <Header title="Attendance & Academic Attire Confirmation" />

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* STEP INDICATORS */}
                <View style={styles.stepRow}>
                    <View style={styles.stepCompleted}>
                        <Ionicons name="checkmark" size={24} color="white" />
                    </View>

                    <View style={styles.stepLine} />

                    <View style={styles.stepActive}>
                        <Text style={styles.stepNumber}>2</Text>
                    </View>
                </View>

                {/* INFO BOX */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>Collection of Academic Attire</Text>
                    <Text style={styles.infoText}>
                        Academic attire can be collected using your generated QR ticket.
                    </Text>
                </View>

                {/* MAIN CHOICE */}
                <Text style={styles.sectionTitle}>Collect / Purchase Academic Attire</Text>

                <View style={styles.choiceBox}>
                    <RadioButton
                        label="I wish to collect the Academic Attire"
                        value="collect"
                        selectedValue={attireOption}
                        onSelect={setAttireOption}
                    />
                    <RadioButton
                        label="I wish to purchase the Academic Attire (Pre-Order)"
                        value="purchase"
                        selectedValue={attireOption}
                        onSelect={setAttireOption}
                    />
                </View>

                {attireOption === 'collect' && renderCollectionDetails()}
                {attireOption === 'purchase' && renderPurchaseDetails()}

                {attireOption && (
                    <TouchableOpacity style={styles.submitBtn} onPress={handleFinalSubmit}>
                        <Text style={styles.submitText}>Confirm Attire Details</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

export default YesAttendance;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },

    scroll: {
        paddingTop: 170,
        paddingHorizontal: 30,
        paddingBottom: 100,
    },

    // Step Indicator
    stepRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        paddingHorizontal: 50,
    },
    stepCompleted: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#28a745',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepLine: {
        height: 2,
        backgroundColor: '#ccc',
        flex: 1,
        marginHorizontal: 20,
        alignSelf: 'center',
    },
    stepActive: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#192F59',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumber: { color: 'white', fontWeight: 'bold' },

    // Info Box
    infoBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 15,
        borderRadius: 5,
        backgroundColor: 'white',
        marginBottom: 20,
    },
    infoTitle: { fontWeight: 'bold', marginBottom: 5 },
    infoText: { fontSize: 14 },

    // Section
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#192F59',
    },

    // Card Wrapper
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#192F59',
    },

    // Radio Button
    radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    radioIcon: { marginRight: 10 },
    radioLabel: { fontSize: 16 },

    // Representative Section
    rowBetween: { flexDirection: 'row', justifyContent: 'space-around' },
    repBox: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#f0f8ff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#192F59',
    },
    repTitle: { fontWeight: 'bold', marginBottom: 10, color: '#192F59' },
    repDescription: { marginBottom: 15, fontSize: 14 },

    repButton: {
        backgroundColor: '#192F59',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    repIcon: { marginRight: 8 },
    repButtonText: { color: 'white', fontWeight: 'bold' },

    // Purchase
    purchaseButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    purchaseButtonText: { color: 'white', fontWeight: 'bold' },

    // Choice Box
    choiceBox: {
        backgroundColor: 'white',
        padding: 15,
        paddingRight: 40,
        borderRadius: 8,
    },

    // Submit Button
    submitBtn: {
        backgroundColor: '#ffc107',
        padding: 15,
        borderRadius: 30,
        marginTop: 40,
        alignItems: 'center',
        width: "80%",
        alignSelf: "center"
    },
    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#192F59',
    },

    subText: {
        marginBottom: 10,
        fontSize: 14,
    },
});
