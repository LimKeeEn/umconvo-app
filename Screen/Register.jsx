// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import DropDownPicker from "react-native-dropdown-picker";
// import { useNavigation } from "@react-navigation/native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// export default function Register() {
//   const navigation = useNavigation();

//   const [formData, setFormData] = useState({
//     username: "",
//     phoneNo: "",
//     educationLevel: "",
//     faculty: "",
//     programme: "",
//     graduationSession: "",
//   });

//   // Dropdown states
//   const [openEdu, setOpenEdu] = useState(false);
//   const [openFaculty, setOpenFaculty] = useState(false);
//   const [openProgramme, setOpenProgramme] = useState(false);

//   const [educationItems, setEducationItems] = useState([
//     { label: "Foundation", value: "foundation" },
//     { label: "Diploma", value: "diploma" },
//     { label: "Bachelor's Degree", value: "bachelor" },
//     { label: "Master's Degree", value: "master" },
//     { label: "PhD", value: "phd" },
//   ]);

//   const [facultyItems, setFacultyItems] = useState([
//     { label: "Engineering", value: "engineering" },
//     { label: "Science", value: "science" },
//     { label: "Arts & Social Sciences", value: "arts" },
//     { label: "Business & Economics", value: "business" },
//     { label: "Medicine", value: "medicine" },
//     { label: "Law", value: "law" },
//   ]);

//   const [programmeItems, setProgrammeItems] = useState([
//     { label: "Computer Science", value: "cs" },
//     { label: "Electrical Engineering", value: "ee" },
//     { label: "Mechanical Engineering", value: "me" },
//     { label: "Business Administration", value: "ba" },
//     { label: "Accounting", value: "accounting" },
//   ]);

//   const handleSubmit = () => {
//     console.log("Form submitted:", formData);
//     // Use a custom modal or component instead of Alert if you are in a non-Expo/RN environment
//     Alert.alert("Success", "Form submitted successfully!");
//   };

//   return (
//     <View style={styles.container}>
//       {/* Decorative background shapes */}
//       <View style={[styles.shapeSmall, styles.topRightGold]} />
//       <View style={[styles.shape, styles.topRightBlue]} />
//       <View style={[styles.bottomLeftGold]} />
//       <View style={[styles.bottomLeftBlue]} />
      
//       {/* Use KeyboardAwareScrollView instead of ScrollView */}
//       <KeyboardAwareScrollView
//         contentContainerStyle={styles.scrollContent}
//         extraScrollHeight={100}
//         enableOnAndroid={true}
//         // Ensure dropdowns close when scrolling starts
//         onScrollBeginDrag={() => {
//           setOpenEdu(false);
//           setOpenFaculty(false);
//           setOpenProgramme(false);
//         }}
//         scrollEventThrottle={16} // Standard practice for scroll events
//       >
//         {/* Back Button */}
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <Ionicons name="arrow-back-outline" size={26} color="#001F54" />
//         </TouchableOpacity>

//         {/* Title */}
//         <Text style={styles.title}>REGISTER</Text>
//         <Text style={styles.subtitle}>Please register as UM student to login</Text>

//         {/* Form */}
//         {/* Add zIndex properties to ensure the dropdowns stack correctly */}
//         <View style={styles.form}>
//           <TextInput
//             style={styles.input}
//             placeholder="Username"
//             value={formData.username}
//             onChangeText={(text) => setFormData({ ...formData, username: text })}
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Phone No"
//             keyboardType="phone-pad"
//             value={formData.phoneNo}
//             onChangeText={(text) => setFormData({ ...formData, phoneNo: text })}
//           />

//           {/* Education Level (Highest zIndex) */}
//           <DropDownPicker
//             open={openEdu}
//             value={formData.educationLevel}
//             items={educationItems}
//             setOpen={setOpenEdu}
//             setItems={setEducationItems}
//             setValue={(callback) =>
//               setFormData({
//                 ...formData,
//                 educationLevel: callback(formData.educationLevel),
//               })
//             }
//             placeholder="Select Education Level"
//             style={styles.dropdown}
//             dropDownContainerStyle={styles.dropdownContainer}
//             // 💡 Fix: Change listMode to SCROLLVIEW
//             listMode="SCROLLVIEW"
//             // Set highest zIndex so it renders above other dropdowns
//             zIndex={3000} 
//             zIndexInverse={1000}
//           />

//           {/* Faculty (Middle zIndex) */}
//           <DropDownPicker
//             open={openFaculty}
//             value={formData.faculty}
//             items={facultyItems}
//             setOpen={setOpenFaculty}
//             setItems={setFacultyItems}
//             setValue={(callback) =>
//               setFormData({
//                 ...formData,
//                 faculty: callback(formData.faculty),
//               })
//             }
//             placeholder="Select Faculty"
//             style={styles.dropdown}
//             dropDownContainerStyle={styles.dropdownContainer}
//             // 💡 Fix: Change listMode to SCROLLVIEW
//             listMode="SCROLLVIEW"
//             // Set middle zIndex
//             zIndex={2000}
//             zIndexInverse={2000}
//           />

//           {/* Programme (Lowest zIndex) */}
//           <DropDownPicker
//             open={openProgramme}
//             value={formData.programme}
//             items={programmeItems}
//             setOpen={setOpenProgramme}
//             setItems={setProgrammeItems}
//             setValue={(callback) =>
//               setFormData({
//                 ...formData,
//                 programme: callback(formData.programme),
//               })
//             }
//             placeholder="Select Programme"
//             style={styles.dropdown}
//             dropDownContainerStyle={styles.dropdownContainer}
//             // 💡 Fix: Change listMode to SCROLLVIEW
//             listMode="SCROLLVIEW"
//             // Set lowest zIndex
//             zIndex={1000}
//             zIndexInverse={3000}
//           />

//           <TextInput
//             style={styles.input}
//             placeholder="Graduation Session"
//             value={formData.graduationSession}
//             onChangeText={(text) =>
//               setFormData({ ...formData, graduationSession: text })
//             }
//           />

//           <TouchableOpacity style={styles.registerButton} onPress={handleSubmit}>
//             <Text style={styles.registerText}>Register</Text>
//           </TouchableOpacity>

//           <Text style={styles.guestText}>
//             Not UM student?{" "}
//             <Text
//               style={styles.guestLink}
//               onPress={() => navigation.navigate("GuestLogin")}
//             >
//               Login as guest
//             </Text>
//           </Text>
//         </View>
//       </KeyboardAwareScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F9FAFB" },
//   scrollContent: { paddingHorizontal: 20, paddingBottom: 50, paddingTop:50 },
//   backButton: { marginTop: 20, marginBottom: 10 },
//   title: { fontSize: 32, fontWeight: "bold", color: "#001F54", marginBottom: 5 },
//   subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
//   form: { marginTop: 10 },
//   input: {
//     backgroundColor: "#fff",
//     borderColor: "#D1D5DB",
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     fontSize: 16,
//     marginBottom: 15,
//   },
//   dropdown: {
//     backgroundColor: "#fff",
//     borderColor: "#D1D5DB",
//     borderRadius: 12,
//     marginBottom: 15,
//   },
//   dropdownContainer: {
//     borderColor: "#D1D5DB",
//   },
//   registerButton: {
//     backgroundColor: "#FFD700",
//     borderRadius: 30,
//     paddingVertical: 14,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   registerText: { color: "#001F54", fontWeight: "700", fontSize: 16 },
//   guestText: { textAlign: "center", marginTop: 20, color: "#6B7280" },
//   guestLink: { color: "#2563EB", fontWeight: "600", textDecorationLine: "underline" },

//   // Background shapes
//   shape: {
//     position: "absolute",
//     backgroundColor: "#001F54",
//     borderBottomLeftRadius: 200,
//   },
//   shapeSmall: {
//     position: "absolute",
//     backgroundColor: "#FFD700",
//     borderBottomLeftRadius: 200,
//   },
//   topRightBlue: { top: -10, right: 0, width: 120, height: 120 },
//   topRightGold: { top: 80, right: 0, width: 80, height: 80 },
//   bottomLeftBlue: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     width: 100,
//     height: 100,
//     backgroundColor: "#001F54",
//     borderTopRightRadius: 200,
//   },
//   bottomLeftGold: {
//     position: "absolute",
//     bottom: 80,
//     left: 0,
//     width: 60,
//     height: 60,
//     backgroundColor: "#FFD700",
//     borderTopRightRadius: 200,
//   },
// });


import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function Register() {
  const navigation = useNavigation();
  const route = useRoute();
  const userInfo = route.params?.userInfo;
  const usernameFromGoogle = userInfo?.user?.name || "";
  const email = userInfo?.user?.email || "";
  const matricNoMatch = email.match(/^(\d{8})@siswa\.um\.edu\.my$/);
  const matricNo = matricNoMatch ? matricNoMatch[1] : "";

  const [formData, setFormData] = useState({
    username: usernameFromGoogle,
    email: userInfo?.user?.email || "",
    matricNo: matricNo,
    phoneNo: "",
    educationLevel: "",
    faculty: "",
    programme: "",
    graduationSession: "",
  });

  // Dropdown states
  const [openEdu, setOpenEdu] = useState(false);
  const [openFaculty, setOpenFaculty] = useState(false);
  const [openProgramme, setOpenProgramme] = useState(false);

  const [educationItems, setEducationItems] = useState([
    { label: "Foundation", value: "Foundation" },
    { label: "Diploma", value: "Diploma" },
    { label: "Bachelor's Degree", value: "Bachelor's Degree" },
    { label: "Master's Degree", value: "Master" },
    { label: "PhD", value: "PHD" },
  ]);

  const [facultyItems, setFacultyItems] = useState([
    { label: "Engineering", value: "engineering" },
    { label: "Science", value: "science" },
    { label: "Arts & Social Sciences", value: "arts" },
    { label: "Business & Economics", value: "business" },
    { label: "Medicine", value: "medicine" },
    { label: "Law", value: "law" },
  ]);

  const [programmeItems, setProgrammeItems] = useState([
    { label: "Computer Science", value: "cs" },
    { label: "Electrical Engineering", value: "ee" },
    { label: "Mechanical Engineering", value: "me" },
    { label: "Business Administration", value: "ba" },
    { label: "Accounting", value: "accounting" },
  ]);

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://10.0.2.2:5000/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "Registration successful!");
        navigation.navigate("MainApp");
      } else {
        Alert.alert("Error", data.message || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network or server error.");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={26} color="#001F54" />
        </TouchableOpacity>

        <Text style={styles.title}>REGISTER</Text>
        <Text style={styles.subtitle}>Please register as UM student to login</Text>

        <View style={styles.form}>
          {/* ✅ Username (read-only) */}
          <TextInput
            style={[styles.input, { backgroundColor: "#E5E7EB" }]}
            value={formData.username}
            editable={false}
          />

          <TextInput
            style={[styles.input, { backgroundColor: "#E5E7EB" }]}
            value={formData.email}
            editable={false}
          />

          <TextInput
            style={[styles.input, { backgroundColor: "#E5E7EB" }]}
            value={formData.matricNo}
            editable={false}
        />

          <TextInput
            style={styles.input}
            placeholder="Phone No"
            keyboardType="phone-pad"
            value={formData.phoneNo}
            onChangeText={(text) => setFormData({ ...formData, phoneNo: text })}
          />

          {/* Education Dropdown */}
          <DropDownPicker
            open={openEdu}
            value={formData.educationLevel}
            items={educationItems}
            setOpen={setOpenEdu}
            setItems={setEducationItems}
            setValue={(callback) =>
              setFormData({
                ...formData,
                educationLevel: callback(formData.educationLevel),
              })
            }
            placeholder="Select Education Level"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            zIndex={3000}
          />

          {/* Faculty Dropdown */}
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
          />

          {/* Programme Dropdown */}
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
          />

          <TextInput
            style={styles.input}
            placeholder="Graduation Session"
            value={formData.graduationSession}
            onChangeText={(text) =>
              setFormData({ ...formData, graduationSession: text })
            }
          />

          <TouchableOpacity style={styles.registerButton} onPress={handleSubmit}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 50 },
  backButton: { marginTop: 20, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: "bold", color: "#001F54", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  form: { marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginBottom: 15,
  },
  dropdownContainer: {
    borderColor: "#D1D5DB",
  },
  registerButton: {
    backgroundColor: "#FFD700",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  registerText: { color: "#001F54", fontWeight: "700", fontSize: 16 },
});
