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
    { label: "Faculty of Built Environment", value: "Faculty-of-Built-Environment" },
    { label: "Faculty of Languages and Linguistics", value: "Faculty of Languages and Linguistics" },
    { label: "Faculty of Pharmacy", value: "Faculty of Pharmacy" },
    { label: "Faculty of Engineering", value: "Faculty of Engineering" },
    { label: "Faculty of Education", value: "Faculty of Education" },
    { label: "Faculty of Dentistry", value: "Faculty of Dentistry" },
    { label: "Faculty of Business and Economics", value: "Faculty of Business and Economics" },
    { label: "Faculty of Medicine", value: "Faculty of Medicine" },
    { label: "Faculty of Science", value: "Faculty of Science" },
    { label: "Faculty of Computer Science & Information Technology", value: "Faculty of Computer Science & Information Technology" },
    { label: "Faculty of Arts And Social Sciences", value: "Faculty of Arts And Social Sciences" },
    { label: "Faculty of Creative Arts", value: "Faculty of Creative Arts" },
    { label: "Faculty of Law", value: "Faculty of Law" },
    { label: "Faculty of Sports and Exercise Sciences", value: "Faculty of Sports and Exercise Science" },
    { label: "Academy of Islamic Studies", value: "Academy of Islamic Studies" },
    { label: "Academy of Malay Studies", value: "Academy of Malay Studies" },
  ]);

  // Programme mapping based on faculty
  const programmesByFaculty = {
    "Faculty-of-Built-Environment": [
        { label: "Bachelor of Science in Architecture", value: "Bachelor of Science in Architecture" },
        { label: "Bachelor of Building Surveying", value: "Bachelor of Building Surveying" },
        { label: "Bachelor of Quantity Surveying", value: "Bachelor of Quantity Surveying" },
        { label: "Bachelor of Urban & Regional Planning", value: "Bachelor of Urban & Regional Planning" },
        { label: "Bachelor of Real Estate", value: "Bachelor of Real Estate" },
      ],
      "Faculty of Languages and Linguistics": [
        { label: "Bachelor of Arabic Language and Linguistics", value: "Bachelor of Arabic Language and Linguistics" },
        { label: "Bachelor of Chinese Language and Linguistics", value: "Bachelor of Chinese Language and Linguistics" },
        { label: "Bachelor of English Language and Linguistics", value: "Bachelor of English Language and Linguistics" },
        { label: "Bachelor of French Language and Linguistics", value: "Bachelor of French Language and Linguistics" },
        { label: "Bachelor of German Language and Linguistics", value: "Bachelor of German Language and Linguistics" },
        { label: "Bachelor of Italian Language and Linguistics", value: "Bachelor of Italian Language and Linguistics" },
        { label: "Bachelor of Japanese Language and Linguistics", value: "Bachelor of Japanese Language and Linguistics" },
        { label: "Bachelor of Spanish Language and Linguistics", value: "Bachelor of Spanish Language and Linguistics" },
        { label: "Bachelor of Tamil Language and Linguisticss", value: "Bachelor of Tamil Language and Linguistics" },
      ],
      "Faculty of Pharmacy": [
        { label: "Bachelor of Pharmacy", value: "Bachelor of Pharmacy" },
      ],
      "Faculty of Engineering": [
        { label: "Bachelor of Biomedical Engineering", value: "Bachelor of Biomedical Engineering" },
        { label: "Bachelor of Chemical Engineering", value: "Bachelor of Chemical Engineering" },
        { label: "Bachelor of Civil Engineering", value: "Bachelor of Civil Engineering" },
        { label: "Bachelor of Electrical Engineering", value: "Bachelor of Electrical Engineering" },
        { label: "Bachelor of Mechanical Engineering", value: "Bachelor of Mechanical Engineering" },
      ],
      "Faculty of Education": [
        { label: "Bachelor of Counselling", value: "Bachelor of Counselling" },
        { label: "Bachelor of Education Teaching Englishas a Second Language", value: "Bachelor of Education Teaching English as a Second Language" },
        { label: "Bachelor of Early Childhood Education ", value: "Bachelor of Early Childhood Education " },
      ],
      "Faculty of Dentistry": [
        { label: "Bachelor of Dentistry", value: "Bachelor of Dentistry" },
      ],
      "Faculty of Business and Economics": [
        { label: "Bachelor of Business Administration (BBA)", value: "Bachelor of Business Administration (BBA)" },
        { label: "Bachelor of Accounting (BAcc)", value: "Bachelor of Accounting (BAcc)" },
        { label: "Bachelor of Finance (BFin)", value: "Bachelor of Finance (BFin)" },
        { label: "Bachelor of Economics (BEc)", value: "Bachelor of Economics (BEc)" },
      ],
      "Faculty of Medicine": [
        { label: "Bachelor of Medicine and Bachelor of Surgery", value: "Bachelor of Medicine and Bachelor of Surgery" },
        { label: "Bachelor of Biomedical Science", value: "Bachelor of Biomedical Science" },
        { label: "Bachelor of Nursing Science", value: "Bachelor of Nursing Science" },
      ],
      "Faculty of Science": [
        { label: "Bachelor of Science Biotechnology", value: "Bachelor of Science Biotechnology" },
        { label: "Bachelor of Science Biochemistry", value: "Bachelor of Science Biochemistry" },
        { label: "Bachelor of Science Ecology & Biodiversity", value: "Bachelor of Science Ecology & Biodiversity" },
        { label: "Bachelor of Science Microbiology & Molecular Genetics", value: "Bachelor of Science Microbiology & Molecular Genetics" },
        { label: "Bachelor of Science Mathematics", value: "Bachelor of Science Mathematics" },
        { label: "Bachelor of Science Statistics", value: "Bachelor of Science Statistics" },
        { label: "Bachelor of Science Actuarial", value: "Bachelor of Science Actuarial" },
        { label: "Bachelor of Science Chemistry", value: "Bachelor of Science Chemistry" },
        { label: "Bachelor of Science Physics", value: "Bachelor of Science Physics" },
        { label: "Bachelor of Science Education", value: "Bachelor of Science Education" },
        { label: "Bachelor of Science Applied Geology", value: "Bachelor of Science Applied Geology" },
        { label: "Bachelor of Science in Enviromental Management", value: "Bachelor of Science in Enviromental Management" },
      ],
      "Faculty of Computer Science & Information Technology": [
        { label: "Bachelor of Computer Science (Artificial Intelligence)", value: "Bachelor of Computer Science (Artificial Intelligence)" },
        { label: "Bachelor of Computer Science (Computer System and Network)", value: "Bachelor of Computer Science (Computer System and Network)" },
        { label: "Bachelor of Computer Science (Information Systems)", value: "Bachelor of Computer Science (Information Systems)" },
        { label: "Bachelor of Computer Science (Software Engineering)", value: "Bachelor of Computer Science (Software Engineering)" },
        { label: "Bachelor of Computer Science ( Multimedia Computing)", value: "Bachelor of Computer Science ( Multimedia Computing)" },
        { label: "Bachelor of Computer Science (Data Science)", value: "Bachelor of Computer Science (Data Science)" },
      ],
      "Faculty of Arts And Social Sciences": [
        { label: "Bachelor of Arts Anthropology and Sociology", value: "Bachelor of Arts Anthropology and Sociology" },
        { label: "Bachelor of Arts Chinese Studies", value: "Bachelor of Arts Chinese Studies" },
        { label: "Bachelor of Arts English", value: "Bachelor of Arts English" },
        { label: "Bachelor of Arts History", value: "Bachelor of Arts History" },
        { label: "Bachelor of Arts Indian Studies", value: "Bachelor of Arts Indian Studies" },
        { label: "Bachelor of Arts International and Strategic Studies", value: "Bachelor of Arts International and Strategic Studies" },
        { label: "Bachelor of Arts Southeast Asian Studies", value: "Bachelor of Arts Southeast Asian Studies" },
        { label: "Bachelor of East Asian Studies", value: "Bachelor of East Asian Studies" },
        { label: "Bachelor of Environmental Studies", value: "Bachelor of Environmental Studies" },
        { label: "Bachelor of Geography", value: "Bachelor of Geography" },
        { label: "Bachelor of Media Studies", value: "Bachelor of Media Studies" },
        { label: "Bachelor of Social Administration", value: "Bachelor of Social Administration" },
      ],
      "Faculty of Creative Arts": [
        { label: "Bachelor of Drama", value: "Bachelor of Drama" },
        { label: "Bachelor of Music", value: "Bachelor of Music" },
        { label: "Bachelor of Dance", value: "Bachelor of Dance" },
        { label: "Bachelor of Performing Arts", value: "Bachelor of Performing Arts" },
      ],
      "Faculty of Law": [
        { label: "Bachelor of Law", value: "Bachelor of Law" },
      ],
      "Sports and Exercise Sciences": [
        { label: "Bachelor of Exercise Science", value: "Bachelor of Exercise Science" },
        { label: "Bachelor of Sports Management", value: "Bachelor of Sports Management" },
      ],
      "Academy of Islamic Studies": [
        { label: "Bachelor of Al-Quran and Al-Hadith", value: "Bachelor of Al-Quran and Al-Hadith" },
        { label: "Bachelor of Shariah", value: "Bachelor of Shariah" },
        { label: "Bachelor of Usuluddin", value: "Bachelor of Usuluddin" },
        { label: "Bachelor of Muamalat Management", value: "Bachelor of Muamalat Management" },
        { label: "Bachelor of Shariah and Law", value: "Bachelor of Shariah and Law" },
        { label: "Bachelor of Islamic Education", value: "Bachelor of Islamic Education" },
        { label: "Bachelor of Islamic Studies and Science", value: "Bachelor of Islamic Studies and Science" },
      ],
      "Academy of Malay Studies": [
        { label: "Sarjana Muda Bahasa Melayu Profesional", value: "Sarjana Muda Bahasa Melayu Profesional" },
        { label: "Sarjana Muda Pengajian Melayu", value: "Sarjana Muda Pengajian Melayu" },
        { label: "Sarjana Muda Kesusasteraan Melayu", value: "Sarjana Muda Kesusasteraan Melayu" },
        { label: "Sarjana Muda Linguistik Melayu", value: "Sarjana Muda Linguistik Melayu" },
      ],
  };

  const [programmeItems, setProgrammeItems] = useState([]);

  // Update programme list when faculty changes
  useEffect(() => {
    if (formData.faculty && programmesByFaculty[formData.faculty]) {
      setProgrammeItems(programmesByFaculty[formData.faculty]);
      // Reset programme if it doesn't exist in the new faculty
      const validProgrammes = programmesByFaculty[formData.faculty].map(p => p.value);
      if (!validProgrammes.includes(formData.programme)) {
        setFormData(prev => ({ ...prev, programme: '' }));
      }
    } else {
      setProgrammeItems([]);
      setFormData(prev => ({ ...prev, programme: '' }));
    }
  }, [formData.faculty]);

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
            placeholder={formData.faculty ? "Select Programme" : "Select Faculty First"}
            disabled={!formData.faculty || programmeItems.length === 0}
            style={[
              styles.dropdown,
              (!formData.faculty || programmeItems.length === 0) && styles.dropdownDisabled
            ]}
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
  dropdownDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
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