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
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10
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
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
},

modalContent: {
  width: "100%",
  maxHeight: "90%",
  backgroundColor: "#fff",
  borderRadius: 16,
  paddingVertical: 20,
  paddingHorizontal: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 5,
},

modalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
  borderBottomWidth: 1,
  borderColor: "#eee",
  paddingBottom: 8,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#13274f",
},

closeButton: {
  padding: 6,
},

modalBody: {
  flexGrow: 1,
  marginBottom: 10,
},

modalFooter: {
  marginTop: 10,
  alignItems: "center",
},

closeModalButton: {
  paddingVertical: 12,
  paddingHorizontal: 30,
  backgroundColor: "#13274f",
  borderRadius: 30,
},

closeModalButtonText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 16,
},

detailSection: {
  marginBottom: 16,
  padding: 12,
  backgroundColor: "#f9f9f9",
  borderRadius: 10,
},

detailLabel: {
  fontSize: 13,
  color: "#777",
  marginBottom: 4,
  fontWeight: "600",
},

detailValue: {
  fontSize: 15,
  color: "#333",
},

detailRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

statusContainer: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

statusDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
},

statusText: {
  fontSize: 14,
  fontWeight: "500",
},

pdfButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#13274f",
  padding: 12,
  borderRadius: 10,
  gap: 12,
},

pdfButtonContent: {
  flex: 1,
},

pdfButtonTitle: {
  color: "white",
  fontWeight: "600",
  fontSize: 15,
},

pdfButtonSubtitle: {
  color: "#ddd",
  fontSize: 12,
},
});

export default styles;