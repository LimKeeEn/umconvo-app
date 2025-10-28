import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginVertical: 15,
    color: '#192F59',
  },
  cardContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    height: 180,
    width: '100%',
    resizeMode: 'cover',
    opacity: 0.4
  },
  iconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -25 },
      { translateY: -40 },
    ],
    zIndex: 1,
    fontSize: 40,
    fontWeight: 'bold',
    color: '#192F59',
    padding: 10,
  },
  iconText: {
    backgroundColor: 'white',
    color: '#192F59',
    padding:10
  },
  cardDescription: {
    padding: 12,
    fontWeight: '600',
    fontSize: 14,
    color: '#8B8B8B',
  },
  cardButtonBlue: {
    backgroundColor: '#192F59',
    paddingVertical: 10,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonYellow: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default styles;