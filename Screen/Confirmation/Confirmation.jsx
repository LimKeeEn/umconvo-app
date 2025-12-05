import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Image, // Added for QR Code display
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
// Import local styles/components
import styles from '../../StyleSheet/confirmation.styles.js'; // Assuming this stylesheet exists
import Header from '../../NavigationBar/Header.jsx'; // Assuming this component exists
import { useNavigation, useRoute } from '@react-navigation/native';
import { Linking } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import * as DocumentPicker from 'expo-document-picker'; 

const API_URL = 'http://192.168.1.234:5000/api';

const initialTasks = [
    { title: 'Update Profile Information', id: 'update-profile' },
    { title: `Completion of Graduate Tracer Study \n (SKPG)`, id: 'graduate-tracer' },
    { title: `Attendance & Academic Attire \n Confirmation`, id: 'attire-confirmation' },
    { title: 'Collection of Academic Attire', id: 'attire-collection' },
    { title: 'Attendance of Rehearsal Confirmation', id: 'rehearsal-confirmation' },
    { title: 'Return of Academic Attire', id: 'attire-return' },
];

// ----------------------------------------------------------------------
// MODAL COMPONENT FOR ATTIRE RETURN QR CODE (MODIFIED)
// ----------------------------------------------------------------------
const ReturnAttireModal = ({ visible, onClose, onConfirmReturn, studentDetails, modalStyles }) => {
    if (!studentDetails) return null;

    const { 
        confirmationCode, 
        matricNo, 
        username: studentName, 
        attireSize,
    } = studentDetails;

    const qrData = JSON.stringify({
        type: 'attire-return',
        confirmationCode: confirmationCode || 'N/A',
        matricNo: matricNo || 'N/A',
        name: studentName || 'N/A',
        attireSize: attireSize || 'N/A',
        timestamp: new Date().toISOString(),
    });

    const getQRCodeUrl = () => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&margin=10`;
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={modalStyles.backdrop}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>Academic Attire Return</Text>
                    </View>

                    <Text style={modalStyles.description}>
                        Present this QR code at the Return Counter. Tap "Returned" below only if the item has been physically checked in.
                    </Text>

                    {/* QR Code Section */}
                    <View style={modalStyles.qrCodeSection}>
                        <Image
                            source={{ uri: getQRCodeUrl() }}
                            style={modalStyles.qrCodeImage}
                            resizeMode="contain"
                        />
                    </View>
                    
                    {/* Confirmed Details for scanning */}
                    <View style={modalStyles.infoSection}>
                        <View style={modalStyles.infoRow}>
                            <Ionicons name="person-outline" size={20} color="#666" />
                            <Text style={modalStyles.infoLabel}>Name:</Text>
                            <Text style={modalStyles.infoValue}>{studentName || 'N/A'}</Text>
                        </View>
                        <View style={modalStyles.infoRow}>
                            <Ionicons name="id-card-outline" size={20} color="#666" />
                            <Text style={modalStyles.infoLabel}>Matric No:</Text>
                            <Text style={modalStyles.infoValue}>{matricNo || 'N/A'}</Text>
                        </View>
                        <View style={modalStyles.infoRow}>
                            <Ionicons name="shirt-outline" size={20} color="#666" />
                            <Text style={modalStyles.infoLabel}>Attire Size:</Text>
                            <Text style={modalStyles.infoValue}>{attireSize || 'N/A'}</Text>
                        </View>
                    </View>
                    
                    <View style={modalStyles.buttonContainer}>
                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.buttonNo]}
                            onPress={onClose}
                        >
                            <Text style={modalStyles.buttonTextNo}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.buttonYes]}
                            onPress={onConfirmReturn} // Triggers the completion logic
                        >
                            <Text style={modalStyles.buttonTextYes}>Returned</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ----------------------------------------------------------------------
// MAIN CONFIRMATION COMPONENT
// ----------------------------------------------------------------------

const Confirmation = () => {
    const [tasks, setTasks] = useState(initialTasks.map(t => ({ ...t, status: 'pending' })));
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const [email, setEmail] = useState(null);
    const [token, setToken] = useState(null);
    const route = useRoute();
    const [studentDetails, setStudentDetails] = useState(null);
    const [attireSchedule, setAttireSchedule] = useState(null);

    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showTracerModal, setShowTracerModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false); 
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // ✅ Fetch Auth Token on Mount
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user?.email) {
                setEmail(user.email);
                try {
                    const idToken = await user.getIdToken();
                    setToken(idToken);
                } catch (error) {
                    console.error('Failed to get ID Token:', error);
                    Alert.alert('Error', 'Failed to authenticate user token.');
                }
            }
        });
        return unsubscribe;
    }, []);

    // ✅ Fetch Attire Schedule from Firebase
    const fetchAttireScheduleData = async (idToken) => {
        try {
            const response = await fetch(`${API_URL}/get-attire`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const errorText = await response.text();
                console.error('Server returned non-JSON response for attire:', errorText);
                setAttireSchedule(null);
                return;
            }

            const result = await response.json();

            if (result.success && result.attireSchedule) {
                setAttireSchedule(result.attireSchedule);
            } else {
                console.log(result.message || 'No attire schedule found.');
                setAttireSchedule(null);
            }
        } catch (error) {
            console.error('Error fetching attire schedule:', error);
            setAttireSchedule(null);
        }
    };

    // ✅ Fetch Student Details and Attire Schedule
    useEffect(() => {
        if (!email || !token) return;

        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/get-student-details/${email}`);
                const result = await response.json();

                if (result.success && result.data) {
                    setStudentDetails(result.data);
                    const fetchedTasks = result.data.tasks || {};

                    setTasks(prev =>
                        prev.map(task => ({
                            ...task,
                            status: fetchedTasks[task.id] || 'pending',
                        }))
                    );
                }

                await fetchAttireScheduleData(token);
            } catch (error) {
                console.error('Error fetching tasks/details:', error);
                Alert.alert('Error', 'Unable to fetch tasks from server.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [email, token]);

    // ✅ Update Firestore
    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/update-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, taskId, status: newStatus }),
            });
            const result = await response.json();
            if (!result.success) console.warn('⚠️ Update failed:', result.message);
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    // ✅ Update Rehearsal Status in Firebase
    const updateRehearsalStatus = async (status) => {
        try {
            const response = await fetch(`${API_URL}/update-rehearsal-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, rehearsalAttendanceStatus: status }),
            });
            const result = await response.json();
            if (!result.success) console.warn('⚠️ Rehearsal status update failed:', result.message);
        } catch (error) {
            console.error('Error updating rehearsal status:', error);
        }
    };

    // ✅ Update Return Attire Status in Firebase
    const updateReturnAttireStatus = async (status) => {
        try {
            const response = await fetch(`${API_URL}/update-return-attire-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, returnAttireStatus: status }),
            });
            const result = await response.json();
            if (!result.success) console.warn('⚠️ Return attire status update failed:', result.message);
        } catch (error) {
            console.error('Error updating return attire status:', error);
        }
    };

    // ✅ Handle PDF Upload for Graduate Tracer (Using DocumentPicker)
    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedFile = result.assets[0];

                if (selectedFile.mimeType !== 'application/pdf') {
                    Alert.alert('Invalid File', 'Please select a PDF file.');
                    return;
                }

                setUploadedFile({
                    name: selectedFile.name,
                    uri: selectedFile.uri,
                    type: selectedFile.mimeType,
                    size: selectedFile.size || 0
                });
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document. Please try again.');
        }
    };

    // ✅ Handle Tracer Study Submission
    const handleTracerSubmit = async () => {
        if (!uploadedFile) {
            Alert.alert('Error', 'Please upload a PDF proof of completion');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();

            formData.append('file', {
                uri: uploadedFile.uri,
                type: 'application/pdf',
                name: uploadedFile.name
            });
            formData.append('email', email);
            formData.append('taskId', 'graduate-tracer');

            const response = await fetch(`${API_URL}/upload-tracer-proof`, {
                method: 'POST',
                body: formData,
                headers: {}, // RN handles Content-Type for FormData
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const errorText = await response.text();
                console.error('❌ Server returned non-JSON response:', errorText.substring(0, 500));
                Alert.alert('Server Error', 'The server returned an unexpected response. Please check your backend logs.');
                return;
            }

            const result = await response.json();

            if (result.success) {
                await updateTaskStatus('graduate-tracer', 'completed');

                setTasks(prev =>
                    prev.map(t =>
                        t.id === 'graduate-tracer' ? { ...t, status: 'completed' } : t
                    )
                );

                setShowTracerModal(false);
                setUploadedFile(null);
                Alert.alert('Success', 'Graduate Tracer Study proof uploaded successfully!');
            } else {
                Alert.alert('Error', result.message || 'Failed to upload proof');
            }
        } catch (error) {
            console.error('❌ Error submitting tracer study:', error);
            Alert.alert(
                'Upload Failed',
                `Could not upload the file. Error: ${error.message}\n\nPlease check your internet connection and try again.`
            );
        } finally {
            setUploading(false);
        }
    };

    // ✅ Handle Collection Confirmation - Navigate to Gown Collection
    const handleCollectNow = () => {
        setShowCollectionModal(false);
        navigation.navigate('Profile', {
            email,
            openTab: 'ticket',
            scrollToGown: true
        });
    };

    // ✅ Handle Collection Already Completed
    const handleCollectionConfirmation = () => {
        setShowCollectionModal(false);
        setTasks(prev =>
            prev.map(t =>
                t.id === 'attire-collection' ? { ...t, status: 'completed' } : t
            )
        );
        updateTaskStatus('attire-collection', 'completed');
    };

    // ✅ Handle Rehearsal Confirmation
    const handleRehearsalConfirmation = () => {
        const currentIndex = tasks.findIndex(t => t.id === 'rehearsal-confirmation');
        const previousIncomplete = tasks.slice(0, currentIndex).some(t => t.status !== 'completed');

        if (previousIncomplete) {
            Alert.alert('Please complete previous steps first.');
            return;
        }

        Alert.alert(
            'Rehearsal Attendance',
            'Will you attend the rehearsal?',
            [
                {
                    text: 'Not Attending',
                    onPress: async () => {
                        setTasks(prev =>
                            prev.map(t =>
                                t.id === 'rehearsal-confirmation' ? { ...t, status: 'completed' } : t
                            )
                        );
                        await updateTaskStatus('rehearsal-confirmation', 'completed');
                        await updateRehearsalStatus('not-attend');

                        setStudentDetails(prev => ({
                            ...prev,
                            rehearsalAttendanceStatus: 'not-attend'
                        }));
                    },
                },
                {
                    text: 'Attending',
                    onPress: async () => {
                        setTasks(prev =>
                            prev.map(t =>
                                t.id === 'rehearsal-confirmation' ? { ...t, status: 'completed' } : t
                            )
                        );
                        await updateTaskStatus('rehearsal-confirmation', 'completed');
                        await updateRehearsalStatus('attend');

                        setStudentDetails(prev => ({
                            ...prev,
                            rehearsalAttendanceStatus: 'attend'
                        }));
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // ✅ Function triggered when 'Returned' button is pressed
    const markReturnAsCompleted = async () => {
        setShowReturnModal(false);
        setTasks(prev =>
            prev.map(t =>
                t.id === 'attire-return' ? { ...t, status: 'completed' } : t
            )
        );
        await updateTaskStatus('attire-return', 'completed');
        await updateReturnAttireStatus('returned');

        setStudentDetails(prev => ({
            ...prev,
            returnAttireStatus: 'returned'
        }));
    };

    // ✅ Handle Return Confirmation (MODIFIED to show modal)
    const handleReturnConfirmation = () => {
        const currentIndex = tasks.findIndex(t => t.id === 'attire-return');
        const previousIncomplete = tasks.slice(0, currentIndex).some(t => t.status !== 'completed');

        if (previousIncomplete) {
            Alert.alert('Please complete previous steps first.');
            return;
        }

        if (studentDetails?.attireOption !== 'collect') {
            Alert.alert('Not Applicable', 'This step is only for students who collected academic attire.');
            return;
        }

        // Show the QR code modal
        setShowReturnModal(true);
    };

    // ✅ Handle generic confirmation for each step
    const handleTaskConfirmation = (task) => {
        const currentIndex = tasks.findIndex(t => t.id === task.id);

        const previousIncomplete = tasks.slice(0, currentIndex).some(t => t.status !== 'completed');
        if (previousIncomplete) {
            Alert.alert('Please complete previous steps first.');
            return;
        }

        if (task.id === 'update-profile') {
            Alert.alert(
                'Update Profile',
                'Have you updated your profile information?',
                [
                    {
                        text: 'Yes',
                        onPress: async () => {
                            setTasks(prev =>
                                prev.map(t =>
                                    t.id === task.id ? { ...t, status: 'completed' } : t
                                )
                            );
                            await updateTaskStatus(task.id, 'completed');
                        },
                    },
                    {
                        text: 'No',
                        onPress: () => {
                            navigation.navigate('Profile', { email });
                        },
                    },
                ],
                { cancelable: true }
            );
        }

        else if (task.id === 'graduate-tracer') {
            setShowTracerModal(true);
        }

        else if (task.id === 'attire-confirmation') {
            navigation.navigate('AttendanceConfirm', {
                email,
                updateTaskStatus: updateTaskStatus,
            });
        }

        else if (task.id === 'attire-collection') {
            if (studentDetails?.attendanceStatus !== 'attending') {
                Alert.alert('Not Applicable', 'This step is only for students attending the ceremony.');
                return;
            }
            setShowCollectionModal(true);
        }

        else if (task.id === 'rehearsal-confirmation') {
            handleRehearsalConfirmation();
        }

        else if (task.id === 'attire-return') {
            handleReturnConfirmation();
        }

        else {
            Alert.alert(
                'Confirm Task',
                `Do you confirm completion of "${task.title}"?`,
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes',
                        onPress: async () => {
                            setTasks(prev =>
                                prev.map(t =>
                                    t.id === task.id ? { ...t, status: 'completed' } : t
                                )
                            );
                            await updateTaskStatus(task.id, 'completed');
                        },
                    },
                ],
                { cancelable: true }
            );
        }
    };

    useEffect(() => {
        const allDone = tasks.every(t => t.status === 'completed');
        if (!loading && allDone) {
            Alert.alert('🎉 All Tasks Completed!', 'You have finished all confirmation steps.');
        }
    }, [tasks, loading]);

    const getTaskIcon = (status) => (status === 'completed' ? 'checkmark-circle' : 'checkmark-circle-outline');
    const getTaskColor = (status) => (status === 'completed' ? '#28a745' : '#192F59');

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = completedTasks / tasks.length;
    const progressPercent = Math.round(progress * 100);
    const nextPendingTask = tasks.find(t => t.status === 'pending');
    const pendingText = nextPendingTask ? `Next: ${nextPendingTask.title}` : 'All Tasks Completed!';

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#192F59" />
                <Text style={{ marginTop: 10 }}>Loading tasks...</Text>
            </View>
        );
    }

    // Display confirmed details
    const renderConfirmationDetails = () => {
        if (tasks.find(t => t.id === 'attire-confirmation')?.status !== 'completed' || !studentDetails) {
            return null;
        }

        const { attendanceStatus, attireOption, nonAttendanceReason, attireSize, rehearsalAttendanceStatus, returnAttireStatus } = studentDetails;

        let statusText = 'Unknown';
        let detailText = '';

        if (attendanceStatus === 'attending') {
            statusText = 'Attending';
            if (attireOption === 'collect') {
                detailText = `Academic Attire: Collect, Size: ${attireSize || 'N/A'}`;
            } else if (attireOption === 'purchase') {
                detailText = 'Academic Attire: Purchase';
            }
        } else if (attendanceStatus === 'not-attending') {
            statusText = 'Not Attending';
            detailText = `Reason: ${nonAttendanceReason || 'N/A'}`;
        }

        return (
            <View style={[styles.detailsCard, { marginTop: 10, marginBottom: 20, marginHorizontal: 20 }]}>
                <Text style={styles.detailsTitle}>Confirmed Details</Text>
                <Text style={styles.detailsRow}>
                    **Attendance:** <Text style={{ color: attendanceStatus === 'attending' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                        {statusText}
                    </Text>
                </Text>
                <Text style={styles.detailsRow}>{detailText}</Text>

                {rehearsalAttendanceStatus && (
                    <Text style={styles.detailsRow}>
                        **Rehearsal:** <Text style={{ color: rehearsalAttendanceStatus === 'attend' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                            {rehearsalAttendanceStatus === 'attend' ? 'Attending' : 'Not Attending'}
                        </Text>
                    </Text>
                )}

                {returnAttireStatus === 'returned' && (
                    <Text style={styles.detailsRow}>
                        **Attire Return:** <Text style={{ color: '#28a745', fontWeight: 'bold' }}>
                            Returned
                        </Text>
                    </Text>
                )}
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <Header title="Confirmation" />
            <ScrollView style={[styles.container, { marginTop: 150 }]} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.progressSection}>
                    <Text style={styles.progressText}>{progressPercent}%</Text>
                    <Text style={styles.pendingText}>{pendingText}</Text>
                    <View style={styles.progressBar}>
                        <View style={{ flex: progress, backgroundColor: '#192F59', height: 6, borderRadius: 3 }} />
                        <View style={{ flex: 1 - progress, backgroundColor: '#ddd', height: 6, borderRadius: 3 }} />
                    </View>
                </View>

                {tasks.map((task, index) => (
                    <View key={task.id}>
                        <TouchableOpacity
                            style={[
                                styles.taskCard,
                                task.status === 'completed' && { backgroundColor: '#e6ffed', borderColor: '#28a745' },
                                index === 0 && styles.activeCard,
                            ]}
                            onPress={() => handleTaskConfirmation(task)}
                            disabled={task.status === 'completed'}
                        >
                            <View style={styles.taskLeft}>
                                <Ionicons name={getTaskIcon(task.status)} size={20} color={getTaskColor(task.status)} />
                                <Text
                                    style={[
                                        styles.taskText,
                                        task.status === 'completed' && { color: '#28a745' },
                                    ]}
                                >
                                    {task.title}
                                </Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#999" />
                        </TouchableOpacity>

                        {task.id === 'attire-confirmation' && renderConfirmationDetails()}
                    </View>
                ))}
            </ScrollView>

            {/* Graduate Tracer Study Upload Modal (Unchanged) */}
            <Modal
                visible={showTracerModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTracerModal(false)}
            >
                <View style={modalStyles.backdrop}>
                    <View style={modalStyles.container}>
                        <View style={modalStyles.header}>
                            <Ionicons name="document-text-outline" size={40} color="#192F59" />
                            <Text style={modalStyles.title}>Graduate Tracer Study (SKPG)</Text>
                        </View>

                        <Text style={modalStyles.description}>
                            Please upload a PDF proof that you have completed the SKPG survey.
                        </Text>

                        <TouchableOpacity
                            style={modalStyles.uploadButton}
                            onPress={handlePickDocument}
                        >
                            <Ionicons name="cloud-upload-outline" size={24} color="#192F59" />
                            <Text style={modalStyles.uploadButtonText}>
                                {uploadedFile ? uploadedFile.name : 'Select PDF File'}
                            </Text>
                        </TouchableOpacity>

                        {uploadedFile && (
                            <View style={modalStyles.filePreview}>
                                <Ionicons name="document" size={20} color="#28a745" />
                                <Text style={modalStyles.fileName}>{uploadedFile.name}</Text>
                            </View>
                        )}

                        <View style={modalStyles.buttonContainer}>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonNo]}
                                onPress={() => {
                                    setShowTracerModal(false);
                                    setUploadedFile(null);
                                }}
                            >
                                <Text style={modalStyles.buttonTextNo}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonYes]}
                                onPress={handleTracerSubmit}
                                disabled={!uploadedFile || uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={modalStyles.buttonTextYes}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={modalStyles.linkButton}
                            onPress={() => Linking.openURL('https://graduan.mohe.gov.my/SKPG25/')}
                        >
                            <Text style={modalStyles.linkText}>Haven't filled the form? Click here</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Collection Modal (Unchanged) */}
            <Modal
                visible={showCollectionModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCollectionModal(false)}
            >
                <View style={modalStyles.backdrop}>
                    <View style={modalStyles.container}>
                        <View style={modalStyles.header}>
                            <Ionicons name="shirt-outline" size={40} color="#192F59" />
                            <Text style={modalStyles.title}>Collection of Academic Attire</Text>
                        </View>

                        <View style={modalStyles.infoSection}>
                            <View style={modalStyles.infoRow}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <Text style={modalStyles.infoLabel}>Collection Date:</Text>
                                <Text style={modalStyles.infoValue}>
                                    {attireSchedule?.date || 'Not Available'}
                                </Text>
                            </View>

                            <View style={modalStyles.infoRow}>
                                <Ionicons name="time-outline" size={20} color="#666" />
                                <Text style={modalStyles.infoLabel}>Collection Time:</Text>
                                <Text style={modalStyles.infoValue}>
                                    {attireSchedule?.timeSlot || 'Not Available'}
                                </Text>
                            </View>

                            <View style={modalStyles.infoRow}>
                                <Ionicons name="location-outline" size={20} color="#666" />
                                <Text style={modalStyles.infoLabel}>Location:</Text>
                                <Text style={modalStyles.infoValue}>
                                    {attireSchedule?.location || 'To Be Announced'}
                                </Text>
                            </View>
                        </View>

                        <Text style={modalStyles.question}>What would you like to do?</Text>

                        <View style={modalStyles.buttonContainer}>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonCollectNow]}
                                onPress={handleCollectNow}
                            >
                                <Text style={modalStyles.buttonTextYes}>Collect Now</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.buttonYes]}
                                onPress={handleCollectionConfirmation}
                            >
                                <Text style={modalStyles.buttonTextYes}>Yes, Collected</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.buttonCancel]}
                            onPress={() => setShowCollectionModal(false)}
                        >
                            <Text style={modalStyles.buttonTextNo}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ⭐️ ACADEMIC ATTIRE RETURN QR CODE MODAL ⭐️ */}
            <ReturnAttireModal
                visible={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                onConfirmReturn={markReturnAsCompleted} // Pass the completion handler
                studentDetails={studentDetails}
                modalStyles={modalStyles}
            />
        </View>
    );
};

// Define modalStyles (extended with QR elements)
const modalStyles = {
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#192F59',
        marginTop: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    // --- QR Specific Styles ---
    qrCodeSection: {
        padding: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    qrCodeImage: {
        width: 200,
        height: 200,
    },
    // --- Existing Styles ---
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#192F59',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    uploadButtonText: {
        fontSize: 16,
        color: '#192F59',
        fontWeight: '600',
        marginLeft: 10,
    },
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6ffed',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    fileName: {
        fontSize: 14,
        color: '#28a745',
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    infoSection: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        fontWeight: '500',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        color: '#192F59',
        fontWeight: 'bold',
        flex: 1.5,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10, // Adjusted margin to separate from infoSection
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    buttonNo: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    buttonYes: {
        backgroundColor: '#28a745',
    },
    buttonCollectNow: {
        backgroundColor: '#192F59',
    },
    buttonCancel: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    buttonTextNo: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextYes: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 15,
        padding: 10,
    },
    linkText: {
        color: '#192F59',
        fontSize: 14,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
};

export default Confirmation;