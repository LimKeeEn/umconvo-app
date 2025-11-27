import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../NavigationBar/Header.jsx';

const AttendanceConfirmation = ({ route }) => {
    const navigation = useNavigation();
    const { email, updateTaskStatus } = route.params;

    const [attendanceOption, setAttendanceOption] = useState(null);

    const radioOptions = [
        { label: 'I will attend the convocation ceremony', value: 'attending' },
        { label: 'I am unable to attend the convocation ceremony', value: 'not-attending' },
    ];

    const handleSubmit = async () => {
        if (attendanceOption === 'not-attending') {
            navigation.navigate('NonAttendance', { 
                email, 
                updateTaskStatus 
            });
        } else if (attendanceOption === 'attending') {
            navigation.navigate('YesAttendance', { 
                email, 
                updateTaskStatus 
            });
        }
    };

    const RadioButton = ({ label, value, selectedValue, onSelect }) => (
        <TouchableOpacity 
            style={styles.radioContainer}
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

    return (
        <View style={styles.container}>
            <Header title="Attendance & Academic Attire Confirmation" />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="black" />
                    </TouchableOpacity>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepActive}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>

                        <View style={styles.stepLine} />

                        <View style={styles.stepInactive}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                    </View>
                </View>

                {/* Information Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        *Please be informed that all travel arrangements are solely managed by the graduands, and the University will not be held responsible for any inconvenience or costs that may be incurred
                    </Text>
                </View>

                {/* Title */}
                <Text style={styles.sectionTitle}>
                    Attendance to Convocation Ceremony Confirmation
                </Text>

                {/* Radio Section */}
                <View style={styles.radioWrapper}>
                    {radioOptions.map((option) => (
                        <RadioButton
                            key={option.value}
                            label={option.label}
                            value={option.value}
                            selectedValue={attendanceOption}
                            onSelect={setAttendanceOption}
                        />
                    ))}
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

export default AttendanceConfirmation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },

    scrollContent: {
        paddingTop: 170,
        paddingHorizontal: 30,
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

    stepActive: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#192F59',
        justifyContent: 'center',
        alignItems: 'center',
    },

    stepInactive: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },

    stepNumber: {
        color: 'white',
        fontWeight: 'bold',
    },

    stepLine: {
        height: 2,
        backgroundColor: '#ccc',
        flex: 1,
        marginHorizontal: 20,
        alignSelf: 'center',
    },

    /* Info Box */
    infoBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 15,
        borderRadius: 5,
        backgroundColor: 'white',
        marginBottom: 20,
    },

    infoText: {
        fontStyle: 'italic',
        fontSize: 14,
    },

    /* Section Title */
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#192F59',
    },

    /* Radio Section */
    radioWrapper: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
    },

    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },

    radioIcon: {
        marginRight: 10,
    },

    radioLabel: {
        fontSize: 16,
    },

    /* Submit Button */
    submitButton: {
        backgroundColor: '#ffc107',
        padding: 15,
        borderRadius: 30,
        marginTop: 30,
        alignItems: 'center',
        width: "60%",
        alignSelf: "center"
    },

    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#192F59',
    },
});
