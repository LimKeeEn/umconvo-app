import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  
  countdownSection: {
    backgroundColor: 'white',
    paddingVertical: 20,
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#192F59',
    marginBottom: 5,
  },
  countdownSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#777',
    marginBottom: 15,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  // Modal Styles
  modalCenteredView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalFullScreenImage: {
    width: width, 
    height: height * 0.5,
    marginBottom: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalInfoContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    width: width - 40,
  },
  modalInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#192F59',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});

export default styles;