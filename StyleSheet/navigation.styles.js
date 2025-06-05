import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F2',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  headerOverlay: {
    height: 150,
    position: 'relative',
    justifyContent: 'center',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#192F59',
    opacity: 0.8,
    zIndex: 0,
  },
  menuOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 1,
  },
  notOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1,
  },
  headerText: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 1,
  },
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