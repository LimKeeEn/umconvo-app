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

// Data structure for education levels, faculties, and programmes
const EDUCATION_DATA = {
  Diploma: {
    // Diploma programmes without faculty grouping
    programmes: [
      { label: "Diploma in Management", value: "Diploma in Management" },
      { label: "Diploma in Human Resource Management", value: "Diploma in Human Resource Management" },
      { label: "Diploma in Business Management", value: "Diploma in Business Management" },
      { label: "Diploma in Accounting", value: "Diploma in Accounting" },
    ],
  },
  "Bachelor's Degree": {
    faculties: [
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
    ],
    programmes: {
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
    },
  },
  Master: {
    faculties: [
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
    ],
    programmes: {
      "Faculty of Built Environment": [
        { label: "Master of Real Estate", value: "Master of Real Estate" },
        { label: "Master of Project Management", value: "Master of Project Management" },
        { label: "Master of Facilities and Maintenance Management", value: "Master of Facilities and Maintenance Management" },
        { label: "Master of Architecture", value: "Master of Architecture" },
        { label: "Master of Built Environment [by Research]", value: "Master of Built Environment [by Research]" },
      ],
      "Faculty of Languages and Linguistics": [
        { label: "Master of Arts (Linguistics)", value: "Master of Arts (Linguistics)" },
        { label: "Master of English Language Studies", value: "Master of English Language Studies" },
      ],
      "Faculty of Pharmacy": [
        { label: "Masters of Pharmaceutical Science in Drug Discovery and Development", value: "Masters of Pharmaceutical Science in Drug Discovery and Development" },
        { label: "Masters in Pharmaceutical Legislation and Regulatory Control", value: "Masters in Pharmaceutical Legislation and Regulatory Control" },
        { label: "Master of Medical Science", value: "Master of Medical Science" },
      ],
      "Faculty of Engineering": [
        { label: "Master of Safety, Health and Environment Engineering", value: "Master of Safety, Health and Environment Engineering" },
        { label: "Master of Mechanical Engineering", value: "Master of Mechanical Engineering" },
        { label: "Master of Systems Engineering", value: "Master of Systems Engineering" },
        { label: "Master of Road Safety Engineering", value: "Master of Road Safety Engineering" },
        { label: "Master of Engineering Science", value: "Master of Engineering Science" },
        { label: "Master of Safety, Health and Environment Engineering", value: "Master of Safety, Health and Environment Engineering" },
        { label: "Master of Biomedical Engineering", value: "Master of Biomedical Engineering" },
      ],
      "Faculty of Education": [
        { label: "Master Of Education", value: "Master Of Education" },
        { label: "Master of Science Education with Information Technology", value: "Master of Science Education with Information Technology" },
        { label: "Master of Mathematics Education with Technology", value: "Master of Mathematics Education with Technology" },
        { label: "Master of Education in English as a Second Language", value: "Master of Education in English as a Second Language" },
        { label: "Master of Arabic Language Education", value: "Master of Arabic Language Education" },
        { label: "Master of Education in Malay Language", value: "Master of Education in Malay Language" },
        { label: "Master of Islamic Education", value: "Master of Islamic Education" },
        { label: "Master of Humanities Education", value: "Master of Humanities Education" },
        { label: "Master of Visual Arts Education", value: "Master of Visual Arts Education" },
        { label: "Master of Physical and Health Education", value: "Master of Physical and Health Education" },
      ],
      "Faculty of Dentistry": [
        { label: "Master of Oral Science", value: "Master of Oral Science" },
        { label: "Master of Community Oral Health", value: "Master of Community Oral Health" },
        { label: "Master of Dental Science", value: "Master of Dental Science" },
      ],
      "Faculty of Business and Economics": [
        { label: "Master of Business Administration (MBA)", value: "Bachelor of Business Administration (BBA)" },
        { label: "Master of Marketing (MMkt)", value: "Master of Marketing (MMkt)" },
        { label: "Master of Applied Statistics (MAppStats)", value: " Master of Applied Statistics (MAppStats)" },
        { label: "Master of Accounting (MAcc)", value: "Master of Accounting (MAcc)" },
        { label: "Master of Public Administration (MPA)", value: "Master of Public Administration (MPA)" },
        { label: "Master of Management (MM)", value: "Master of Management (MM)" },
        { label: "Master of Economics (MEc)", value: "Master of Economics (MEc)" },
        { label: "Master of Development Studies (MDS)", value: "Master of Development Studies (MDS)" },
      ],
      "Faculty of Medicine": [
        { label: "Master of Anaesthesiology", value: "Master of Anaesthesiology" },
        { label: "Master of Clinical Oncology", value: "Master of Clinical Oncology" },
        { label: "Master of Emergency Medicine", value: "Master of Emergency Medicine" },
        { label: "Master of Family Medicine", value: "Master of Family Medicine" },
        { label: "Master of Internal Medicine", value: "Master of Internal Medicine" },
        { label: "Master of Obstetrics and Gynaecology", value: "Master of Obstetrics and Gynaecology" },
        { label: "Master of Ophthalmology", value: "Master of Ophthalmology" },
        { label: "Master Of Orthopedic Surgery", value: "Master Of Orthopedic Surgery" },
        { label: "Master of Otorhinolaryngology-Head & Neck Surgery", value: "Master of Otorhinolaryngology-Head & Neck Surgery" },
        { label: "Master of Paediatrics", value: "Master of Paediatrics" },
      ],
      "Faculty of Science": [
        { label: "Master of Science in Biotechnology", value: "Master of Science in Biotechnology" },
        { label: "Master of Science in Applied Physics", value: "BMaster of Science in Applied Physics" },
        { label: "Master of Science in Crop Protection", value: "Master of Science in Crop Protection" },
        { label: "Master of Petroleum Geoscience", value: "Master of Petroleum Geoscience" },
        { label: "Master of Sustainability Science", value: "Master of Sustainability Science" },
        { label: "Master of Bioinformatics", value: "Master of Bioinformatics" },
      ],
      "Faculty of Computer Science & Information Technology": [
        { label: "Master of Software Engineering (Software Technology)", value: "Master of Software Engineering (Software Technology)" },
        { label: "Master of Computer Science (Applied Computing)", value: "Master of Computer Science (Applied Computing)" },
        { label: "Master in Data Science", value: "Master in Data Science" },
        { label: "Master of Cyber Security", value: "Master of Cyber Security" },
        { label: "Master of Artificial Intelligence", value: "Master of Artificial Intelligence" },
        { label: "Master of Computer Science", value: "Master of Computer Science" },
      ],
      "Faculty of Arts And Social Sciences": [
        { label: "Master of Arts (by Research)", value: "Master of Arts (by Research)" },
        { label: "Master of Arts (English Literature)", value: "Master of Arts (English Literature)" },
        { label: "Master of Arts (Malaysian History)", value: "Master of Arts (Malaysian History)" },
        { label: "Master of Arts (Southeast Asian Studies)", value: "Master of Arts (Southeast Asian Studies)" },
        { label: "Master of Arts (Publishing Studies)", value: "Master of Arts (Publishing Studies)" },
        { label: "Master of Arts (Strategic and Defence Studies)", value: "Master of Arts (Strategic and Defence Studies)" },
        { label: "Master of Arts (Southeast Asian History)", value: "Master of Arts (Southeast Asian History)" },
      ],
      "Faculty of Creative Arts": [
        { label: "Master of Performing Arts (Drama)", value: "Master of Performing Arts (Drama)" },
        { label: "Master of Performing Arts (Music)", value: "Master of Performing Arts (Music)" },
        { label: "Master Of Arts (Visual Arts)", value: "Master Of Arts (Visual Arts)" },
      ],
      "Faculty of Law": [
        { label: "Master of Laws", value: "Master of Laws" },
        { label: "Master of Commercial Law", value: "Master of Commercial Law" },
        { label: "Master of Criminal Justice", value: "Master of Criminal Justice" },
        { label: "Master of Legal Studies", value: "Master of Legal Studies" },
      ],
      "Sports and Exercise Sciences": [
        { label: "Master of Strength and Conditioning", value: "Master of Strength and Conditioning" },
        { label: "Master of Sports Administration and Leadership", value: "Master of Sports Administration and Leadership" },
        { label: "Master of Sport Science", value: "Master of Sport Science" },
      ],
      "Academy of Islamic Studies": [
        { label: "Master of Usuluddin", value: "Master of Usuluddin" },
        { label: "Master of Shariah", value: "Master of Shariah" },
        { label: "Master of Islamic Studies", value: "Master of Islamic Studies" },
      ],
      "Academy of Malay Studies": [
        { label: "Master of Arts in Malay Studies", value: "Master of Arts in Malay Studies" },
        { label: "Master of Malay Studies", value: "Master of Malay Studies" },
      ],
    },
  },
  PHD: {
    faculties: [
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
    ],
    programmes: {
      "Faculty of Built Environment": [
        { label: "Doctor of Philosophy (PHD) ", value: "Doctor of Philosophy (PHD)" },
      ],
      "Faculty of Languages and Linguistics": [
        { label: "Doctor of Philosophy (PHD)", value: "Doctor of Philosophy (PHD)" },
      ],
      "Faculty of Pharmacy": [
        { label: "Doctor of Philosophy (PHD)", value: "Doctor of Philosophy (PHD)" },
      ],
      "Faculty of Engineering": [
        { label: "Doctor of Philosophy (PHD)", value: "Doctor of Philosophy (PHD)" },
      ],
      "Faculty of Education": [
        { label: "Doctor of Philosophy (Research)", value: "Doctor of Philosophy (Research)" },
        { label: "Doctor of Philosophy (Mixed - Mode)", value: "Doctor of Philosophy (Mixed - Mode)" },
      ],
      "Faculty of Dentistry": [
        { label: "Doctor of Philosophy (PHD)", value: "Doctor of Philosophy (PHD)" },
      ],
      "Faculty of Business and Economics": [
        { label: "Doctor of Business Administration (DBA)", value: "Doctor of Business Administration (DBA)" },
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Faculty of Medicine": [
        { label: "Doctor of Public Health", value: "Doctor of Public Health" },
        { label: "Doctor of Medicine", value: "Doctor of Medicine" },
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Faculty of Science": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Faculty of Computer Science & Information Technology": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Faculty of Arts And Social Sciences": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Faculty of Creative Arts": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Faculty of Law": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Sports and Exercise Sciences": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Academy of Islamic Studies": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
      "Academy of Malay Studies": [
        { label: "Doctor of Philosophy (PhD)", value: "Doctor of Philosophy (PhD)" },
      ],
    },
  },
};

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

  const [openEdu, setOpenEdu] = useState(false);
  const [openFaculty, setOpenFaculty] = useState(false);
  const [openProgramme, setOpenProgramme] = useState(false);
  const [openGraduation, setOpenGraduation] = useState(false);

  const [educationItems] = useState([
    { label: "Select Education Level", value: "" },
    { label: "Diploma", value: "Diploma" },
    { label: "Bachelor's Degree", value: "Bachelor's Degree" },
    { label: "Master's Degree", value: "Master" },
    { label: "PhD", value: "PHD" },
  ]);

  const [graduationItems] = useState([
    { label: "2025/2026", value: "2025/2026" },
  ]);

  const [facultyItems, setFacultyItems] = useState([]);
  const [programmeItems, setProgrammeItems] = useState([]);

  // Check if current education level is Diploma
  const isDiploma = formData.educationLevel === "Diploma";

  // Update faculty and programme options when education level changes
  useEffect(() => {
    if (formData.educationLevel) {
      if (isDiploma) {
        // For Diploma: disable faculty, enable programme directly
        setFacultyItems([]);
        const programmes = EDUCATION_DATA.Diploma.programmes || [];
        setProgrammeItems(programmes);
        setFormData(prev => ({ ...prev, faculty: "", programme: "" }));
      } else {
        // For other levels: enable faculty, reset programme
        const faculties = EDUCATION_DATA[formData.educationLevel]?.faculties || [];
        setFacultyItems(faculties);
        setProgrammeItems([]);
        setFormData(prev => ({ ...prev, faculty: "", programme: "" }));
      }
    } else {
      setFacultyItems([]);
      setProgrammeItems([]);
    }
  }, [formData.educationLevel]);

  // Update programme options when faculty changes (only for non-Diploma levels)
  useEffect(() => {
    if (!isDiploma && formData.educationLevel && formData.faculty) {
      const programmes = EDUCATION_DATA[formData.educationLevel]?.programmes[formData.faculty] || [];
      setProgrammeItems(programmes);
      // Reset programme when faculty changes
      setFormData(prev => ({ ...prev, programme: "" }));
    }
  }, [formData.faculty, formData.educationLevel, isDiploma]);

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://192.168.0.162:5000/api/register-user", {
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
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        extraScrollHeight={100}
        enableOnAndroid={true}
        onScrollBeginDrag={() => {
          setOpenEdu(false);
          setOpenFaculty(false);
          setOpenProgramme(false);
          setOpenGraduation(false);
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.shapeSmall, styles.topRightGold]} />
        <View style={[styles.shape, styles.topRightBlue]} />
        <View style={[styles.bottomLeftGold]} />
        <View style={[styles.bottomLeftBlue]} />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={26} color="#001F54" />
        </TouchableOpacity>

        <Text style={styles.title}>REGISTER</Text>
        <Text style={styles.subtitle}>Please register as UM student to login</Text>

        <View style={styles.form}>
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

          <DropDownPicker
            open={openEdu}
            value={formData.educationLevel}
            items={educationItems}
            setOpen={setOpenEdu}
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
            zIndex={4000}
            zIndexInverse={1000}
          />

          {/* Only show Faculty dropdown if NOT Diploma */}
          {!isDiploma && (
            <DropDownPicker
              open={openFaculty}
              value={formData.faculty}
              items={facultyItems}
              setOpen={setOpenFaculty}
              setValue={(callback) =>
                setFormData({
                  ...formData,
                  faculty: callback(formData.faculty),
                })
              }
              placeholder="Select Faculty"
              style={[styles.dropdown, !formData.educationLevel && styles.disabledDropdown]}
              dropDownContainerStyle={styles.dropdownContainer}
              listMode="SCROLLVIEW"
              disabled={!formData.educationLevel}
              zIndex={3000}
              zIndexInverse={2000}
            />
          )}

          <DropDownPicker
            open={openProgramme}
            value={formData.programme}
            items={programmeItems}
            setOpen={setOpenProgramme}
            setValue={(callback) =>
              setFormData({
                ...formData,
                programme: callback(formData.programme),
              })
            }
            placeholder="Select Programme"
            style={[
              styles.dropdown,
              // For Diploma: enable if education level is selected
              // For others: enable if faculty is selected
              (isDiploma ? !formData.educationLevel : !formData.faculty) && styles.disabledDropdown
            ]}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            disabled={isDiploma ? !formData.educationLevel : !formData.faculty}
            zIndex={2000}
            zIndexInverse={3000}
          />

          <DropDownPicker
            open={openGraduation}
            value={formData.graduationSession}
            items={graduationItems}
            setOpen={setOpenGraduation}
            setValue={(callback) =>
              setFormData({
                ...formData,
                graduationSession: callback(formData.graduationSession),
              })
            }
            placeholder="Select Graduation Session"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            zIndex={1000}
            zIndexInverse={4000}
            dropDownDirection="BOTTOM"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.registerButton} onPress={handleSubmit}>
              <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>

            <Text style={styles.guestText}>
              Not UM student?{" "}
              <Text
                style={styles.guestLink}
                onPress={() => navigation.navigate("GuestMainApp")}
              >
                Login as guest
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 50, paddingTop: 50 },
  backButton: { marginTop: 10, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "bold", color: "#001F54", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6B7280", marginBottom: 15 },
  form: { marginTop: 8 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderRadius: 10,
    marginBottom: 12,
  },
  disabledDropdown: {
    backgroundColor: "#F3F4F6",
    opacity: 0.6,
  },
  dropdownContainer: {
    borderColor: "#D1D5DB",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  registerButton: {
    backgroundColor: "#FFD700",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    width: "60%",
  },
  registerText: { color: "#001F54", fontWeight: "700", fontSize: 15 },
  guestText: { marginTop: 15, color: "#6B7280", fontSize: 13 },
  guestLink: { color: "#2563EB", fontWeight: "600", textDecorationLine: "underline" },
  shape: {
    position: "absolute",
    backgroundColor: "#001F54",
    borderBottomLeftRadius: 200,
  },
  shapeSmall: {
    position: "absolute",
    backgroundColor: "#FFD700",
    borderBottomLeftRadius: 200,
  },
  topRightBlue: { top: -10, right: 0, width: 100, height: 100 },
  topRightGold: { top: 65, right: 0, width: 65, height: 65 },
  bottomLeftBlue: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 85,
    height: 85,
    backgroundColor: "#001F54",
    borderTopRightRadius: 200,
  },
  bottomLeftGold: {
    position: "absolute",
    bottom: 65,
    left: 0,
    width: 50,
    height: 50,
    backgroundColor: "#FFD700",
    borderTopRightRadius: 200,
  },
});