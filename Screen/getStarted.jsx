import React, { useState, useRef } from 'react';
import { Text, View, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import styles from '../StyleSheet/getStarted.styles.js';
import { useGoogleSignIn } from '../googleSignIn';

const { width } = Dimensions.get('window');

const GetStarted = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  const { promptAsync, loading, error } = useGoogleSignIn(() => {
    navigation.replace('MainApp');
  });

  const images = [
    require('../assets/Started_1.png'),
    require('../assets/Started_2.png'),
    require('../assets/Started_3.png'),
  ];

  const renderImage = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image source={item} style={styles.image} />
      <LinearGradient colors={['transparent', '#FFFFFF']} style={styles.gradient} />
    </View>
  );

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex });
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: prevIndex });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderImage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onScroll={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        ref={flatListRef}
        scrollEventThrottle={16}
      />

      <View style={styles.indicatorContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentIndex === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.prevButton} onPress={handlePrev}>
        <MaterialIcons name="chevron-left" size={52} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <MaterialIcons name="chevron-right" size={52} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButtonGoogle}
          onPress={async () => {
            try {
              await promptAsync();
            } catch (e) {
              console.error('Google promptAsync failed:', e);
            }
          }}
          disabled={loading}
        >
          <Image
            source={require('../assets/google.png')}
            style={{ width: 24, height: 24 }}
          />
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign in with Siswamail'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButtonGuest}
          onPress={() => navigation.replace('MainApp')}
        >
          <MaterialIcons name="person" size={24} color="#000000" />
          <Text style={styles.buttonText}>Sign in as Guest</Text>
        </TouchableOpacity>

        {error && (
          <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>
            {error.message || 'Sign-in failed'}
          </Text>
        )}
      </View>
    </View>
  );
};

export default GetStarted;