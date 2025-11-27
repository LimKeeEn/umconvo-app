import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../firebaseConfig';

const API_URL = 'http://192.168.0.162:5000/api';

const EditProfile = ({ navigation, route }) => {
  const userData = route.params?.userData || {};
  
  // Get current user from Firebase
  const currentUser = auth.currentUser;

  const [formData, setFormData] = useState({
    username: userData.username || '',
    phoneNo: userData.phoneNo || '',
    faculty: userData.faculty || '',
    programme: userData.programme || '',
    graduationSession: userData.graduationSession || '',
    email: userData.email || '',
    photoURL: userData.photoURL || currentUser?.photoURL || '',
  });

  // Dropdown states
  const [openFaculty, setOpenFaculty] = useState(false);
  const [openProgramme, setOpenProgramme] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  const [facultyItems, setFacultyItems] = useState([
    { label: 'Faculty of Engineering', value: 'engineering' },
    { label: 'Faculty of Science', value: 'science' },
    { label: 'Faculty of Arts & Social Sciences', value: 'arts-social-sciences' },
    { label: 'Faculty of Business & Economics', value: 'business-economics' },
    { label: 'Faculty of Medicine', value: 'medicine' },
    { label: 'Faculty of Law', value: 'law' },
  ]);

  const [programmeItems, setProgrammeItems] = useState([
    { label: 'Computer Science', value: 'cs' },
    { label: 'Electrical Engineering', value: 'ee' },
    { label: 'Mechanical Engineering', value: 'me' },
    { label: 'Business Administration', value: 'ba' },
    { label: 'Accounting', value: 'accounting' },
  ]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera and gallery permissions are required to change your profile picture.'
        );
      }
    })();
  }, []);

  // Handle taking photo from camera
  const handleTakePhoto = async () => {
    setShowImagePickerModal(false);
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, photoURL: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Handle uploading from gallery
  const handleChooseFromGallery = async () => {
    setShowImagePickerModal(false);
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, photoURL: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Failed to choose photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/update-user/${formData.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.navigate('Profile', { updatedData: formData });
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Network or server issue.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={100}
        enableOnAndroid={true}
      >
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: formData.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
              }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowImagePickerModal(true)}
            >
              <Ionicons name="camera-outline" size={16} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
          />

          <Text style={styles.label}>Phone No</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={formData.phoneNo}
            onChangeText={(text) => setFormData({ ...formData, phoneNo: text })}
          />

          <Text style={styles.label}>Faculty</Text>
          <DropDownPicker
            open={openFaculty}
            value={formData.faculty}
            items={facultyItems}
            setOpen={setOpenFaculty}
            setItems={setFacultyItems}
            setValue={(callback) =>
              setFormData({
                ...formData,
                faculty: callback(formData.faculty),
              })
            }
            placeholder="Select Faculty"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            zIndex={2000}
            zIndexInverse={1000}
          />

          <Text style={styles.label}>Programme</Text>
          <DropDownPicker
            open={openProgramme}
            value={formData.programme}
            items={programmeItems}
            setOpen={setOpenProgramme}
            setItems={setProgrammeItems}
            setValue={(callback) =>
              setFormData({
                ...formData,
                programme: callback(formData.programme),
              })
            }
            placeholder="Select Programme"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            zIndex={1000}
            zIndexInverse={2000}
          />

          <Text style={styles.label}>Graduation Session</Text>
          <TextInput
            style={styles.input}
            value={formData.graduationSession}
            onChangeText={(text) =>
              setFormData({ ...formData, graduationSession: text })
            }
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera" size={24} color="#001F54" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleChooseFromGallery}
            >
              <Ionicons name="images" size={24} color="#001F54" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10, color: '#000' },
  scrollContent: { paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginTop: 30 },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#EEE',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFC107',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 20,
    padding: 8,
  },
  form: { marginTop: 30, paddingHorizontal: 20 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dropdown: {
    backgroundColor: 'white',
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 14,
  },
  dropdownContainer: {
    borderColor: '#DDD',
  },
  saveButton: {
    backgroundColor: '#FFC107',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
  
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001F54',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#001F54',
    marginLeft: 15,
    fontWeight: '500',
  },
  modalCancel: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
});