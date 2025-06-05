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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  switchButton: {
    paddingVertical: 12,      
    paddingHorizontal: 30,    
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginHorizontal: 12,
  },
  activeSwitch: {
    backgroundColor: '#e0e0e0',
  },
  switchText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    overflow: 'hidden',
  },
  sideBar: {
    width: 6,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 13,
  },
  chevron: {
    padding: 10,
    alignSelf: 'center',
    color: '#555',
  },
});

export default styles;