import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  headerOverlay: {
    height: 180,
    position: 'relative',
    justifyContent: 'center',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#192F59',
    opacity: 0.8,
    zIndex: 0
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
  Title: {
    fontSize: 13,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#192F59',
    textAlign: 'center',
    },
  Card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  Image: {
    height: 500,
    width: '100%',
    resizeMode: 'contain',
    alignSelf: 'center'
  },
});

export default styles;