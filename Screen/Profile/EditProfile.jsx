import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.0.2.2:5000/api';

const EditProfile = ({ navigation, route }) => {
  const userData = route.params?.userData || {};

  const [formData, setFormData] = useState({
    username: userData.username || '',
    phoneNo: userData.phoneNo || '',
    faculty: userData.faculty || '',
    programme: userData.programme || '',
    graduationSession: userData.graduationSession || '',
    email: userData.email || '',
  });

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
        navigation.navigate('Profile');
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

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri:
                  userData.photoURL ||
                  'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton}>
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
          <TextInput
            style={styles.input}
            value={formData.faculty}
            onChangeText={(text) => setFormData({ ...formData, faculty: text })}
          />

          <Text style={styles.label}>Programme</Text>
          <TextInput
            style={styles.input}
            value={formData.programme}
            onChangeText={(text) => setFormData({ ...formData, programme: text })}
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
      </ScrollView>
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
  avatarContainer: { alignItems: 'center', marginTop: 30 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#EEE' },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    padding: 6,
  },
  form: { marginTop: 30, paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
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
  saveButton: {
    backgroundColor: '#FFC107',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
});
