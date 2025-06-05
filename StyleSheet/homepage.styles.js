import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F2',
  },
  HeaderContainer: {
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