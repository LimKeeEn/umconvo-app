import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  progressSection: {
    padding: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#777',
    marginTop: 4,
    marginBottom: 10,
  },
  progressBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#ddd',
  },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#192F59', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
},
detailsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#192F59',
    marginBottom: 8,
},
detailsRow: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
},
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#192F59',
    paddingVertical: 12,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default styles;