import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../NavigationBar/Header.jsx'; 

const API_URL = 'http://192.168.1.231:5000/api'; //rnm
// const API_URL = 'http://172.20.10.2:5000/api'; //phone
// const API_URL = 'https://drifty-floretta-autoeciously.ngrok-free.dev/api';
// const API_URL = 'https://theoretical-logs-exhibit-north.trycloudflare.com/api';

const NonAttendance = ({ route }) => {
    const navigation = useNavigation();
    const { email } = route.params;

    const [selectedReason, setSelectedReason] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const reasonOptions = [
        { label: 'Health Reasons', value: 'Health Reasons' },
        { label: 'Travel Constraints', value: 'Travel Constraints' },
        { label: 'Personal Commitments', value: 'Personal Commitments' },
        { label: 'Work Obligations', value: 'Work Obligations' },
        { label: 'Financial Difficulties', value: 'Financial Difficulties' },
    ];

    const handleSubmitReason = async () => {
        // Validate selection
        if (!selectedReason) {
            setError('Please select a reason for non-attendance');
            Alert.alert(
                'Selection Required',
                'Please select a reason for not attending the ceremony.'
            );
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/save-attendance-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    attendance: 'not-attending',
                    reason: selectedReason 
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Unable to save non-attendance details');
            }

            Alert.alert(
                'Non-Attendance Confirmed',
                `Your reason for not attending (${selectedReason}) has been recorded successfully. The process is now complete.`,
                [
                    { 
                        text: 'OK', 
                        onPress: () => {
                            navigation.navigate('MainApp', {
                                screen: 'Confirmation',
                                params: { email }
                            });
                        } 
                    },
                ]
            );

        } catch (error) {
            console.error('Error submitting non-attendance:', error);
            Alert.alert(
                'Submission Error',
                error.message || 'An error occurred during submission. Please check your connection and try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const RadioButton = ({ label, value, selectedValue, onSelect }) => (
        <TouchableOpacity 
            style={[
                styles.radioButton,
                { borderColor: selectedValue === value ? '#192F59' : '#e0e0e0' }
            ]}
            onPress={() => {
                onSelect(value);
                setError(''); // Clear error when user selects
            }}
        >
            <Text style={styles.radioLabel}>{label}</Text>
            <Ionicons 
                name={selectedValue === value ? 'radio-button-on' : 'radio-button-off'} 
                size={24} 
                color="#192F59" 
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header title="Attendance & Academic Attire Confirmation" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Step Indicators */}
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="black" />
                    </TouchableOpacity>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepCompleted}>
                            <Ionicons name="checkmark" size={24} color="white" />
                        </View>
                        <View style={styles.stepLine} />
                        <View style={styles.stepPending}>
                            <Text style={styles.stepText}>2</Text>
                        </View>
                    </View>
                </View>
                
                {/* Sad Face and Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.sadFace}>😔</Text>
                    <Text style={styles.titleText}>
                        Please list your reasons for not attending the ceremony
                    </Text>
                </View>

                {/* Reason Selection */}
                <View>
                    {reasonOptions.map((option) => (
                        <RadioButton
                            key={option.value}
                            label={option.label}
                            value={option.value}
                            selectedValue={selectedReason}
                            onSelect={setSelectedReason}
                        />
                    ))}
                </View>

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#DC2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity 
                    style={[
                        styles.submitButton,
                        (!selectedReason || submitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitReason}
                    disabled={!selectedReason || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#192F59" />
                    ) : (
                        <Text style={[
                            styles.submitText,
                            (!selectedReason || submitting) && styles.submitTextDisabled
                        ]}>
                            Submit Reason
                        </Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0'
    },
    scrollContent: {
        paddingTop: 170,
        paddingHorizontal: 30,
        paddingBottom: 50
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 50
    },
    stepCompleted: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#28a745',
        justifyContent: 'center',
        alignItems: 'center'
    },
    stepLine: {
        height: 2,
        backgroundColor: '#ccc',
        flex: 1,
        marginHorizontal: 20,
        alignSelf: 'center'
    },
    stepPending: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center'
    },
    stepText: {
        color: 'white',
        fontWeight: 'bold'
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 20
    },
    sadFace: {
        fontSize: 40,
        marginBottom: 10
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#192F59',
        textAlign: 'center'
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 2
    },
    radioLabel: {
        flex: 1,
        fontSize: 16
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        paddingHorizontal: 4,
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#ffc107',
        padding: 15,
        borderRadius: 30,
        marginTop: 40,
        alignItems: 'center',
        marginHorizontal: 30
    },
    submitButtonDisabled: {
        backgroundColor: '#e0e0e0',
        opacity: 0.6,
    },
    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#192F59'
    },
    submitTextDisabled: {
        color: '#999',
    }
});

export default NonAttendance;