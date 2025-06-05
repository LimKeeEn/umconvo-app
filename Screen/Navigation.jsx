import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Navigation = () => {
  return (
    <View style={styles.container}>
      <Text>Navigation</Text>
    </View>
  );
};

export default Navigation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});