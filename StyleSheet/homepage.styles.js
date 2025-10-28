import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  timerBox: {
    alignItems: 'center',
  },
  timerDigit: {
    fontSize: 32,
    fontWeight: 'bold',
    backgroundColor: '#333',
    color: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timerLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#777',
  },
  newsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginVertical: 15,
    color: '#192F59',
  },
  newsCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    height: 180,
    width: '100%',
    resizeMode: 'cover',
  },
  newsText: {
    padding: 12,
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
});

export default styles;
