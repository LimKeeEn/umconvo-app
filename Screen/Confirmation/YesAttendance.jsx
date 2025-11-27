// File: AcademicAttireScreen.js

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// Assuming your Header and styles are accessible
import Header from '../../NavigationBar/Header.jsx'; 

// --- CONSTANTS ---
const PURCHASE_FORM_LINK = 'https://forms.gle/your-academic-attire-purchase-form';
const API_URL = 'http://192.168.0.162:5000/api';

const sizeOptions = [
    { label: 'S (Small)', value: 'S' },
    { label: 'M (Medium)', value: 'M' },
    { label: 'L (Large)', value: 'L' },
    { label: 'XL (Extra Large)', value: 'XL' },
];

const YesAttendance = ({ route }) => {
    const navigation = useNavigation();
    const { email, updateTaskStatus } = route.params;

    // Main choice: 'collect' or 'purchase'
    const [attireOption, setAttireOption] = useState(null); 

    // Collection States (if attireOption is 'collect')
    const [selectedSize, setSelectedSize] = useState(null);
    const [hasRepresentative, setHasRepresentative] = useState(null); // 'yes' or 'no'
    const [representativeName, setRepresentativeName] = useState('');
    const [representativeID, setRepresentativeID] = useState('');

    // --- UI HELPERS ---

    const RadioButton = ({ label, value, selectedValue, onSelect }) => (
        <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}
            onPress={() => onSelect(value)}
        >
            <Ionicons 
                name={selectedValue === value ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color="#192F59" 
                style={{ marginRight: 10 }}
            />
            <Text style={{ fontSize: 16 }}>{label}</Text>
        </TouchableOpacity>
    );

    const AttireCard = ({ children, title }) => (
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: '#ccc' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#192F59' }}>{title}</Text>
            {children}
        </View>
    );


    const handleFinalSubmit = async () => {
        if (!attireOption) {
            Alert.alert('Incomplete Form', 'Please select whether you wish to Collect or Purchase the academic attire.');
            return;
        }
        
        // Data payload structure
        const submissionData = {
            email,
            attendance: 'attending', // Key change
            attireOption: attireOption,
            attireSize: attireOption === 'collect' ? selectedSize : null,
            representative: attireOption === 'collect' ? hasRepresentative : null,
            representativeDetails: 
                attireOption === 'collect' && hasRepresentative === 'yes' 
                    ? { name: representativeName, id: representativeID } 
                    : null,
        };
        
        // Validation check for 'collect' option
        if (attireOption === 'collect') {
            if (!selectedSize || hasRepresentative === null || (hasRepresentative === 'yes' && (!representativeName || !representativeID))) {
                Alert.alert('Incomplete Form', 'Please complete all required fields for Academic Attire Collection.');
                return;
            }
        }
        
        try {
            // ✅ STEP 1: Call the new consolidated API to save all details
            const response = await fetch(`${API_URL}/save-attendance-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });
            const result = await response.json();

            if (!result.success) {
                Alert.alert('Submission Failed', result.message || 'Unable to save attendance and attire details.');
                return;
            }

            // Success Alert (Tailored to the option)
            const successMessage = attireOption === 'collect'
                ? 'Your collection details have been successfully recorded. You can view your QR ticket on the main page.'
                : 'Thank you for confirming your intention to purchase. Please ensure you have completed the external form.';

            Alert.alert(
                attireOption === 'collect' ? 'Attire Collection Confirmed' : 'Purchase Acknowledged',
                successMessage,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // The task status is updated on the server, we just need to navigate back.
                            navigation.navigate('MainApp', {
                                screen: 'Confirmation',
                                params: { email }
                            });
                        },
                    },
                ]
            );

        } catch (error) {
            console.error('Error submitting attire details:', error);
            Alert.alert('Error', 'An error occurred during submission.');
        }
    };
    
    // Renders the size selection and representative options
    const renderCollectionDetails = () => (
        <>
            <AttireCard title="Select Attire Size">
                {sizeOptions.map((option) => (
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
                <Text style={{ marginBottom: 10 }}>Will a representative collect the attire on your behalf?</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
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
                    <View style={{ marginTop: 15, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 5 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Representative Details</Text>
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 10 }}
                            placeholder="Representative Full Name"
                            value={representativeName}
                            onChangeText={setRepresentativeName}
                        />
                        <TextInput
                            style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5 }}
                            placeholder="Representative ID / Passport No."
                            value={representativeID}
                            onChangeText={setRepresentativeID}
                        />
                    </View>
                )}
            </AttireCard>
        </>
    );

    // Renders the purchase link
    const renderPurchaseDetails = () => (
        <AttireCard title="Academic Attire Purchase">
            <Text style={{ marginBottom: 15 }}>
                To purchase your academic attire, please complete the required details via the external form link below.
            </Text>
            <TouchableOpacity 
                style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' }}
                onPress={() => Linking.openURL(PURCHASE_FORM_LINK)}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    Open Purchase Order Form (Google Forms)
                </Text>
            </TouchableOpacity>
        </AttireCard>
    );


    return (
        <View style={{ flex: 1, backgroundColor: '#f0f0f0' }}>
            <Header title="Attendance & Academic Attire Confirmation" />

            <ScrollView contentContainerStyle={{ paddingTop: 170, paddingHorizontal: 30, paddingBottom: 100 }}>
                
                {/* Step Indicators (Highlighting Step 2) */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20, paddingHorizontal: 50 }}>
                    <View style={{ 
                        width: 40, height: 40, borderRadius: 20, 
                        backgroundColor: '#28a745', justifyContent: 'center', alignItems: 'center' 
                    }}>
                        <Ionicons name="checkmark" size={24} color="white" />
                    </View>
                    <View style={{ height: 2, backgroundColor: '#ccc', flex: 1, marginHorizontal: 20, alignSelf: 'center' }} />
                    <View style={{ 
                        width: 40, height: 40, borderRadius: 20, 
                        backgroundColor: '#192F59', justifyContent: 'center', alignItems: 'center' 
                    }}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>2</Text>
                    </View>
                </View>

                {/* Information Box */}
                <View style={{ 
                    borderWidth: 1, 
                    borderColor: '#ccc', 
                    padding: 15, 
                    borderRadius: 5, 
                    backgroundColor: 'white',
                    marginBottom: 20
                }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Collection of the Academic Attire</Text>
                    <Text style={{ fontSize: 14 }}>
                        Academic Attire can be collected using generated QR ticket according to scheduled sessions without any deposit fee payment.
                    </Text>
                </View>

                {/* Main Choice Section */}
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#192F59' }}>
                    Collect / Purchase Academic Attire
                </Text>

                <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8 }}>
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
                
                {/* Conditional Details Sections */}
                {attireOption === 'collect' && renderCollectionDetails()}
                {attireOption === 'purchase' && renderPurchaseDetails()}

                {/* Final Submit Button - Only visible after a choice is made */}
                {attireOption && (
                    <TouchableOpacity 
                        style={{ 
                            backgroundColor: '#ffc107', 
                            padding: 15,
                            borderRadius: 30,
                            marginTop: 40,
                            alignItems: 'center'
                        }}
                        onPress={handleFinalSubmit}
                    >
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#192F59' }}>
                            Confirm Attire Details
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

export default YesAttendance;