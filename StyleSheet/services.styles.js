import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  Title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#192F59',
    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10
    },
  Card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 50
  },
  Image: {
    height: 500,
    width: '100%',
    resizeMode: 'contain',
    alignSelf: 'center'
  },
});

export default styles;